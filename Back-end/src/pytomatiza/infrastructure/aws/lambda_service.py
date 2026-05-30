"""AWS Lambda invocation service.

Enables the backend to asynchronously trigger serverless Lambda functions
for offloaded processing tasks such as OCR, document analysis, and AI
inference — without blocking the API response cycle.

Design:
- Default invocation type is ``Event`` (fire-and-forget, async).
- ``RequestResponse`` is available when synchronous replies are needed.
- Payloads are JSON-serialised consistently.
- All blocking ``invoke`` calls are offloaded via ``asyncio.to_thread()``.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any

from botocore.exceptions import ClientError as BotoClientError

from pytomatiza.config import settings
from pytomatiza.domain.exceptions.base import ProcessingException
from pytomatiza.infrastructure.aws.aws_client import get_aws_client_factory

if TYPE_CHECKING:
    from mypy_boto3_lambda.type_defs import InvocationResponseTypeDef

logger = logging.getLogger("pytomatiza.aws.lambda")


class LambdaService:
    def __init__(self) -> None:
        function_name = settings.LAMBDA_FUNCTION_NAME
        if not function_name:
            raise ProcessingException(
                "LAMBDA_FUNCTION_NAME is not configured — cannot initialise LambdaService.",
            )
        self._function_name: str = function_name
        self._client_factory = get_aws_client_factory()
        logger.info("LambdaService initialised — function=%r", self._function_name)

    async def invoke_async(
        self,
        payload: dict[str, Any],
        *,
        qualifier: str | None = None,
    ) -> str:
        response = await self._invoke(payload, invocation_type="Event", qualifier=qualifier)
        return str(response.get("StatusCode", "202"))

    async def invoke_sync(
        self,
        payload: dict[str, Any],
        *,
        qualifier: str | None = None,
    ) -> dict[str, Any]:
        response = await self._invoke(
            payload, invocation_type="RequestResponse", qualifier=qualifier
        )
        raw_payload = response.get("Payload")
        if isinstance(raw_payload, bytes):
            result: dict[str, Any] = json.loads(raw_payload.decode("utf-8"))
            return result
        return {}

    async def invoke_document_processor(
        self,
        s3_key: str,
        user_id: str,
        *,
        action: str = "process",
        options: dict[str, Any] | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            "s3_bucket": settings.S3_BUCKET,
            "s3_key": s3_key,
            "user_id": user_id,
            "action": action,
            **(options or {}),
        }
        logger.info(
            "Triggering document processor Lambda for key=%r user=%r",
            s3_key,
            user_id,
        )
        return await self.invoke_async(payload)

    async def _invoke(
        self,
        payload: dict[str, Any],
        *,
        invocation_type: str,
        qualifier: str | None = None,
    ) -> "InvocationResponseTypeDef":  # ← tipo correto, não dict[str, Any]
        try:
            client = self._client_factory.lambda_
            kwargs: dict[str, Any] = {
                "FunctionName": self._function_name,
                "InvocationType": invocation_type,
                "Payload": json.dumps(payload).encode("utf-8"),
            }
            if qualifier:
                kwargs["Qualifier"] = qualifier

            response: InvocationResponseTypeDef = await asyncio.to_thread(
                client.invoke, **kwargs  # pyright: ignore[reportUnknownArgumentType]
            )

            status_code = response.get("StatusCode", 0)
            logger.debug(
                "Lambda invocation — type=%s status=%s function=%s",
                invocation_type,
                status_code,
                self._function_name,
            )

            if invocation_type == "RequestResponse" and "FunctionError" in response:
                error_payload = response.get("Payload", b"{}") 
                if isinstance(error_payload, bytes):
                    error_detail = json.loads(error_payload)
                else:
                    error_detail = str(error_payload)
                raise ProcessingException(f"Lambda function error: {error_detail}")

            return response

        except BotoClientError as exc:
            logger.exception(
                "Lambda invocation failed — function=%r",
                self._function_name,
            )
            raise ProcessingException(
                f"Failed to invoke Lambda function: {exc}"
            ) from exc
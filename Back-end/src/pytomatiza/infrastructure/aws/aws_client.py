"""Centralized AWS client factory.

Provides a single source for boto3 sessions and service clients
across the entire application. All AWS credentials flow through
this module — never instantiate boto3 clients directly elsewhere.

Design decisions:
- Lazy-initialised session: the session is created once and reused.
- Typed client access: each service gets its own property for clarity.
- Environment-powered: all config comes from the Settings singleton.
- The session respects AWS_REGION from .env; fallback is us-east-1.
- All mypy_boto3_* imports are under TYPE_CHECKING — they are only
  needed by the type checker, not at runtime.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import TYPE_CHECKING

import boto3

from pytomatiza.config import settings

if TYPE_CHECKING:
    from mypy_boto3_lambda import LambdaClient
    from mypy_boto3_logs import CloudWatchLogsClient
    from mypy_boto3_s3 import S3Client
    from mypy_boto3_sns import SNSClient

logger = logging.getLogger("pytomatiza.aws.client")


class AWSClientError(Exception):
    """Raised when an AWS client cannot be initialised or its credentials are invalid."""


class AWSClientFactory:
    def __init__(self) -> None:
        self._region: str = settings.AWS_REGION or "us-east-1"
        self._validate_credentials()

    def _validate_credentials(self) -> None:
        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
            logger.warning(
                "AWS credentials not fully configured — "
                "S3/SNS/Lambda features will be unavailable."
            )

    @property
    def s3(self) -> "S3Client":
        return boto3.client( # pyright: ignore[reportUnknownMemberType]
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self._region,
        )

    @property
    def sns(self) -> "SNSClient":
        return boto3.client( # pyright: ignore[reportUnknownMemberType]
            "sns",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self._region,
        )

    @property
    def lambda_(self) -> "LambdaClient":
        return boto3.client( # pyright: ignore[reportUnknownMemberType]
            "lambda",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self._region,
        )

    @property
    def logs(self) -> "CloudWatchLogsClient":
        return boto3.client( # pyright: ignore[reportUnknownMemberType]
            "logs",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self._region,
        )


@lru_cache(maxsize=1)
def get_aws_client_factory() -> AWSClientFactory:
    return AWSClientFactory()

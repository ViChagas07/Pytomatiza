"""Amazon SNS notification service.

Provides typed, structured notification delivery through AWS SNS.
Used for event-driven workflows: document processing alerts,
fraud detection signals, workflow completions, and AI events.

Design:
- Uses the shared AWS client factory for the SNS client.
- All payloads are JSON-serialised with a uniform envelope.
- Each notification helper represents a business domain event.
- Blocking ``publish`` calls are offloaded via ``asyncio.to_thread()``.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any

from botocore.exceptions import ClientError as BotoClientError

from pytomatiza.config import settings
from pytomatiza.domain.exceptions.base import NotificationException
from pytomatiza.infrastructure.aws.aws_client import get_aws_client_factory

logger = logging.getLogger("pytomatiza.aws.sns")


@dataclass
class _SNSMessage:
    """Envelope for an SNS notification payload (internal use)."""

    event: str
    user_id: str | None
    data: dict[str, Any]
    timestamp: str


class SNSService:
    """Publishes structured notifications to AWS SNS topics.

    Usage::

        sns = SNSService()
        await sns.notify_document_processed(
            user_id="user-abc",
            document_key="uploads/doc.pdf",
            status="completed",
        )
    """

    def __init__(self) -> None:
        topic_arn = settings.AWS_SNS_TOPIC_ARN
        if not topic_arn:
            raise NotificationException(
                "AWS_SNS_TOPIC_ARN is not configured — cannot initialise SNSService.",
            )
        self._topic_arn: str = topic_arn
        self._client_factory = get_aws_client_factory()
        logger.info("SNSService initialised — topic=%r", self._topic_arn)

    # ------------------------------------------------------------------
    # Public API — generic publish
    # ------------------------------------------------------------------

    async def publish(
        self,
        message: dict[str, Any],
        subject: str = "Pytomatiza+ Notification",
    ) -> str:
        """Publish a JSON message to the configured SNS topic.

        Args:
            message: Dictionary that will be JSON-serialised as the message body.
            subject: Human-readable subject line (used in email subscriptions).

        Returns:
            The SNS MessageId of the published message.

        Raises:
            NotificationException: If publishing fails.
        """
        try:
            client = self._client_factory.sns
            response = await asyncio.to_thread(
                client.publish,
                TopicArn=self._topic_arn,
                Subject=subject,
                Message=json.dumps(message, default=str),
                # NOTE: MessageStructure is intentionally omitted — the
                # default "string" type is correct for free-form JSON bodies.
            )
            message_id = response["MessageId"]
            logger.info(
                "SNS message published — subject=%r message_id=%s",
                subject,
                message_id,
            )
            return message_id
        except BotoClientError as exc:
            logger.exception("SNS publish failed — subject=%r", subject)
            raise NotificationException(
                f"Failed to publish SNS notification: {exc}",
            ) from exc

    # ------------------------------------------------------------------
    # Domain-specific notification helpers
    # ------------------------------------------------------------------

    async def notify_document_processed(
        self,
        user_id: str,
        document_key: str,
        status: str,
        *,
        extra: dict[str, Any] | None = None,
    ) -> str:
        """Notify that a document has finished processing (OCR, AI, etc.)."""
        return await self._send_event(
            event="document_processed",
            user_id=user_id,
            data={
                "document_key": document_key,
                "status": status,
                **(extra or {}),
            },
            subject=f"Document {status}: {document_key.rsplit('/', 1)[-1]}",
        )

    async def notify_fraud_detected(
        self,
        user_id: str,
        workflow_id: str,
        risk_score: float,
        *,
        details: dict[str, Any] | None = None,
    ) -> str:
        """Notify about a detected fraud anomaly during document analysis."""
        return await self._send_event(
            event="fraud_detected",
            user_id=user_id,
            data={
                "workflow_id": workflow_id,
                "risk_score": risk_score,
                **(details or {}),
            },
            subject=f"Fraud Alert — Risk Score {risk_score:.1%}",
        )

    async def notify_workflow_completed(
        self,
        user_id: str,
        workflow_id: str,
        result_summary: str,
        *,
        extra: dict[str, Any] | None = None,
    ) -> str:
        """Notify that an automation workflow has finished."""
        return await self._send_event(
            event="workflow_completed",
            user_id=user_id,
            data={
                "workflow_id": workflow_id,
                "result_summary": result_summary,
                **(extra or {}),
            },
            subject=f"Workflow Completed — {workflow_id}",
        )

    async def notify_ai_processing_event(
        self,
        user_id: str,
        agent_name: str,
        event_type: str,
        *,
        extra: dict[str, Any] | None = None,
    ) -> str:
        """Notify about an AI agent processing milestone."""
        return await self._send_event(
            event=f"ai_{event_type}",
            user_id=user_id,
            data={
                "agent_name": agent_name,
                "event_type": event_type,
                **(extra or {}),
            },
            subject=f"AI Event — {agent_name}: {event_type}",
        )

    # ------------------------------------------------------------------
    # Internal helper
    # ------------------------------------------------------------------

    async def _send_event(
        self,
        event: str,
        user_id: str | None,
        data: dict[str, Any],
        subject: str,
    ) -> str:
        """Build a standardised _SNSMessage envelope and publish it."""
        envelope = _SNSMessage(
            event=event,
            user_id=user_id,
            data=data,
            timestamp=datetime.now(UTC).isoformat(),
        )
        logger.debug("Publishing SNS event %s for user %s", event, user_id)
        return await self.publish(
            message=asdict(envelope),
            subject=subject,
        )

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from botocore.exceptions import ClientError as BotoClientError

from pytomatiza.infrastructure.aws.aws_client import get_aws_client_factory

logger = logging.getLogger("pytomatiza.aws.cloudwatch")


class CloudWatchService:
    def __init__(self) -> None:
        self._client_factory = get_aws_client_factory()
        logger.info("CloudWatchService initialised")

    async def query_logs(
        self,
        log_group_name: str,
        *,
        filter_pattern: str | None = None,
        hours_back: int = 1,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        client = self._client_factory.logs
        now = datetime.now(timezone.utc)
        start_time = int((now - timedelta(hours=hours_back)).timestamp() * 1000)
        end_time = int(now.timestamp() * 1000)

        try:
            response = await asyncio.to_thread(
                client.filter_log_events,
                logGroupName=log_group_name,
                filterPattern=filter_pattern or "",
                startTime=start_time,
                endTime=end_time,
                limit=limit,
            )
        except BotoClientError:  # ← sem "as exc" — logger.exception já captura o traceback
            logger.exception("CloudWatch log query failed for group=%r", log_group_name)
            return []

        events: list[dict[str, Any]] = [
            {
                "timestamp": event.get("timestamp"),
                "message": event.get("message"),
                "log_stream_name": event.get("logStreamName"),
                "ingestion_time": event.get("ingestionTime"),
            }
            for event in response.get("events", [])
        ]

        logger.debug(
            "CloudWatch query returned %d events for group=%r",
            len(events),
            log_group_name,
        )
        return events

    async def get_lambda_execution_errors(
        self,
        log_group_name: str,
        *,
        hours_back: int = 24,
    ) -> list[dict[str, Any]]:
        return await self.query_logs(
            log_group_name=log_group_name,
            filter_pattern="ERROR",
            hours_back=hours_back,
            limit=200,
        )

    async def get_lambda_execution_summary(
        self,
        log_group_name: str,
        *,
        hours_back: int = 6,
    ) -> dict[str, Any]:
        errors_task = self.query_logs(
            log_group_name=log_group_name,
            filter_pattern="ERROR",
            hours_back=hours_back,
            limit=500,
        )
        warnings_task = self.query_logs(
            log_group_name=log_group_name,
            filter_pattern="WARNING",
            hours_back=hours_back,
            limit=500,
        )
        errors, warnings = await asyncio.gather(errors_task, warnings_task)

        recent_streams = sorted({
            e["log_stream_name"]
            for events in (errors, warnings)
            for e in events
            if e.get("log_stream_name")
        })

        return {
            "error_count": len(errors),
            "warning_count": len(warnings),
            "total_events": len(errors) + len(warnings),
            "recent_streams": recent_streams[:10],
            "window_hours": hours_back,
        }
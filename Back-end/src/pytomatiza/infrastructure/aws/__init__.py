"""AWS infrastructure layer for Pytomatiza+.

Exports:
    get_aws_client_factory  — Singleton factory for typed boto3 clients.
    S3Service               — Full S3 CRUD, AI pipeline, audit trails, pre-signed URLs.
    SNSService              — Structured notification publishing.
    LambdaService           — Async & sync Lambda invocations.
    CloudWatchService       — Log querying & Lambda execution diagnostics.
"""

from __future__ import annotations

from pytomatiza.infrastructure.aws.aws_client import (
    AWSClientFactory,
    get_aws_client_factory,
)
from pytomatiza.infrastructure.aws.cloudwatch_service import CloudWatchService
from pytomatiza.infrastructure.aws.lambda_service import LambdaService
from pytomatiza.infrastructure.aws.s3_service import S3Service
from pytomatiza.infrastructure.aws.sns_service import SNSService

__all__ = [
    "AWSClientFactory",
    "CloudWatchService",
    "LambdaService",
    "S3Service",
    "SNSService",
    "get_aws_client_factory",
]

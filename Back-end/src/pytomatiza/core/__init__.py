"""Core module — domain-agnostic building blocks.

Contains shared utilities and cross-cutting concerns that are not
specific to any single layer of Clean Architecture.
"""

from pytomatiza.core.s3_paths import S3Paths, S3Prefix

__all__ = [
    "S3Paths",
    "S3Prefix",
]

"""Domain exceptions — pure domain-level errors with no HTTP knowledge."""


class DomainException(Exception):
    """Root of all domain exceptions."""


class EntityNotFound(DomainException):
    """Raised when an entity cannot be found by its identifier."""


class BusinessRuleViolation(DomainException):
    """Raised when a business rule is violated."""


class StorageException(DomainException):
    """Raised when a cloud storage operation fails (e.g. S3 upload/download)."""


class NotificationException(DomainException):
    """Raised when a notification delivery fails (e.g. SNS publish)."""


class ProcessingException(DomainException):
    """Raised when an async processing invocation fails (e.g. Lambda)."""

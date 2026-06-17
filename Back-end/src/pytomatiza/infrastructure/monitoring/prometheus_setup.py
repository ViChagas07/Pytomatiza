"""Prometheus metrics — counters, histograms, and gauges for the API.

Exposes metrics on the /metrics endpoint via make_asgi_app().
"""

from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram, make_asgi_app

REQUEST_COUNT = Counter(
    "pytomatiza_request_total",
    "Total HTTP requests served",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "pytomatiza_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

ACTIVE_WS_CONNECTIONS = Gauge(
    "pytomatiza_ws_connections_active",
    "Number of currently active WebSocket connections",
)

AUTOMATION_RUN_COUNT = Counter(
    "pytomatiza_automation_runs_total",
    "Total number of automation runs triggered",
    ["agent_type", "status"],
)

DB_QUERY_LATENCY = Histogram(
    "pytomatiza_db_query_latency_seconds",
    "Database query execution time in seconds",
    ["operation"],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0],
)

# ── OCR metrics ──────────────────────────────────────────────────────

OCR_REQUESTS_TOTAL = Counter(
    "pytomatiza_ocr_requests_total",
    "Total number of OCR requests",
    ["provider", "file_type"],
)

OCR_FAILURES_TOTAL = Counter(
    "pytomatiza_ocr_failures_total",
    "Total number of OCR processing failures",
    ["provider", "reason"],
)

OCR_PROCESSING_SECONDS = Histogram(
    "pytomatiza_ocr_processing_seconds",
    "OCR processing time in seconds",
    ["provider"],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

OCR_PAGES_PROCESSED = Counter(
    "pytomatiza_ocr_pages_processed_total",
    "Total number of pages processed by OCR",
    ["provider"],
)

OCR_PROVIDER_USAGE = Counter(
    "pytomatiza_ocr_provider_usage_total",
    "OCR provider selection count",
    ["provider", "language"],
)

# ── Workflow Execution metrics ──────────────────────────────────────

WORKFLOW_EXECUTIONS_TOTAL = Counter(
    "pytomatiza_workflow_executions_total",
    "Total number of workflow executions",
    ["status"],
)

WORKFLOW_EXECUTION_SECONDS = Histogram(
    "pytomatiza_workflow_execution_seconds",
    "Workflow execution duration in seconds",
    buckets=[0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
)

AGENT_EXECUTIONS_TOTAL = Counter(
    "pytomatiza_agent_executions_total",
    "Total agent step executions",
    ["tool", "status"],
)

AUTOMATION_RUNS_CREATED = Counter(
    "pytomatiza_workflow_runs_total",
    "Total workflow automation runs created",
    ["status"],
)

metrics_app = make_asgi_app()

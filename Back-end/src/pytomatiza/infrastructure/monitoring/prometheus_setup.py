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

metrics_app = make_asgi_app()

"""Status Router — Public system health endpoint.

Accessible via URL (no authentication required).
Shows the operational status of all configured third-party services.

Endpoints:
  GET /api/v1/system/status  → JSON with per-service health
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse

from pytomatiza.application.services.integrations import get_integration_service

logger = logging.getLogger("pytomatiza.api.status")

router = APIRouter()


# ── The 12 services the user considers "available" ──────────────────
# These are the integrations that should be functioning in the app.
AVAILABLE_SERVICES: list[dict[str, Any]] = [
    {"service": "discord",         "label": "Discord",         "category": "Comunicação"},
    {"service": "telegram",        "label": "Telegram",        "category": "Comunicação"},
    {"service": "trello",          "label": "Trello",          "category": "Gestão de Projetos"},
    {"service": "jira",            "label": "Jira",            "category": "Gestão de Projetos"},
    {"service": "google_drive",    "label": "Google Drive",    "category": "Armazenamento"},
    {"service": "gmail",           "label": "Gmail",           "category": "Comunicação"},
    {"service": "google_calendar", "label": "Google Calendar", "category": "Produtividade"},
    {"service": "google_photos",   "label": "Google Photos",   "category": "Armazenamento"},
    {"service": "google_maps",     "label": "Google Maps",     "category": "Utilitários"},
    {"service": "slack",           "label": "Slack",           "category": "Comunicação"},
    {"service": "zoom",            "label": "Zoom",            "category": "Comunicação"},
    {"service": "google_meet",     "label": "Google Meet",     "category": "Comunicação"},
]

# ── Future services (shown as "coming_soon") ────────────────────────
FUTURE_SERVICES: list[dict[str, Any]] = [
    {"service": "facebook",  "label": "Facebook Pages",       "category": "Redes Sociais"},
    {"service": "whatsapp",  "label": "WhatsApp Business",    "category": "Comunicação"},
    {"service": "instagram", "label": "Instagram",            "category": "Redes Sociais"},
    {"service": "linkedin",  "label": "LinkedIn",             "category": "Redes Sociais"},
    {"service": "teams",     "label": "Microsoft Teams",      "category": "Comunicação"},
]


@router.get("/system/status")
async def system_status(request: Request) -> JSONResponse | HTMLResponse:
    """Return the operational status of all app services.

    No authentication required — accessible directly via URL.
    Returns JSON by default, or HTML when viewed in a browser.
    """
    svc = get_integration_service()

    # Run health checks on all registered providers
    raw_results = await svc.health_check_all(user_id=None)

    # Build per-service results for the 12 available services
    services_status: list[dict[str, Any]] = []
    all_connected = True

    for entry in AVAILABLE_SERVICES:
        service_name = entry["service"]
        health = raw_results.get(service_name, {})

        services_status.append({
            "service": service_name,
            "label": entry["label"],
            "category": entry["category"],
            "connected": health.get("connected", False),
            "status": health.get("status", "unknown"),
            "message": health.get("message", ""),
        })

        if not health.get("connected", False):
            all_connected = False

    # Build future services (not checked, always "coming_soon")
    future_status = [
        {
            "service": f["service"],
            "label": f["label"],
            "category": f["category"],
            "connected": False,
            "status": "coming_soon",
            "message": "Serviço futuro — ainda não disponível",
        }
        for f in FUTURE_SERVICES
    ]

    # Determine overall system health
    connected_count = sum(1 for s in services_status if s["connected"])
    total_available = len(AVAILABLE_SERVICES)

    payload: dict[str, Any] = {
        "system": "Pytomatiza+",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overall_status": "all_operational" if all_connected else "degraded",
        "connected_services": connected_count,
        "total_services": total_available,
        "available_services": services_status,
        "future_services": future_status,
    }

    # If the client accepts HTML, render a pretty status page
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return _render_html(payload)

    return JSONResponse(content=payload)


def _render_html(payload: dict[str, Any]) -> HTMLResponse:
    """Render the status payload as a human‑friendly HTML page."""
    overall_status = payload["overall_status"]
    overall_color = "#22c55e" if overall_status == "all_operational" else "#eab308"
    overall_icon = "✅" if overall_status == "all_operational" else "⚠️"

    rows = ""
    for svc in payload["available_services"]:
        connected = svc["connected"]
        color = "#22c55e" if connected else "#ef4444"
        dot = "🟢" if connected else "🔴"
        status_text = "Operacional" if connected else (svc["message"] or "Indisponível")
        rows += f"""
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;font-weight:500;">{svc['label']}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;color:#94a3b8;font-size:13px;">{svc['category']}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;">
            <span style="display:inline-flex;align-items:center;gap:6px;color:{color};font-weight:500;">
              {dot} {status_text}
            </span>
          </td>
        </tr>"""

    future_rows = ""
    for svc in payload["future_services"]:
        future_rows += f"""
        <tr style="opacity:0.4;">
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;font-weight:500;">{svc['label']}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#94a3b8;font-size:13px;">{svc['category']}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">
            <span style="display:inline-flex;align-items:center;gap:6px;color:#64748b;font-weight:400;">
              ⏳ Em breve
            </span>
          </td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pytomatiza+ — Status do Sistema</title>
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #0f0f0f;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }}
    .container {{ max-width: 800px; width: 100%; }}
    .header {{ text-align: center; margin-bottom: 32px; }}
    .header h1 {{ font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }}
    .header p {{ color: #94a3b8; font-size: 14px; margin-top: 6px; }}
    .overall-badge {{
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px;
      font-size: 14px; font-weight: 600; margin-top: 12px;
      background: {overall_color}15; border: 1px solid {overall_color}30;
      color: {overall_color};
    }}
    .summary {{ display: flex; gap: 16px; justify-content: center; margin-bottom: 24px; flex-wrap: wrap; }}
    .summary-card {{
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
      padding: 16px 24px; text-align: center; flex: 1; min-width: 120px;
    }}
    .summary-card .number {{ font-size: 28px; font-weight: 700; color: #e2e8f0; }}
    .summary-card .label {{ font-size: 12px; color: #94a3b8; margin-top: 4px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th {{ text-align: left; padding: 10px 12px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #2a2a2a; }}
    .section-title {{ font-size: 16px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; color: #e2e8f0; }}
    .footer {{ text-align: center; margin-top: 40px; font-size: 12px; color: #475569; }}
    .footer a {{ color: #3b82f6; text-decoration: none; }}
    .footer a:hover {{ text-decoration: underline; }}
    @media (max-width: 600px) {{
      body {{ padding: 20px 12px; }}
      .header h1 {{ font-size: 22px; }}
      .summary-card {{ padding: 12px 16px; }}
      .summary-card .number {{ font-size: 22px; }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 Pytomatiza+</h1>
      <p>Status dos serviços do sistema</p>
      <div class="overall-badge">
        {overall_icon} { 'Todos os serviços operacionais' if overall_status == 'all_operational' else 'Alguns serviços apresentam instabilidade' }
      </div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="number" style="color:{overall_color};">{payload['connected_services']}/{payload['total_services']}</div>
        <div class="label">Serviços Online</div>
      </div>
      <div class="summary-card">
        <div class="number">{len(payload['future_services'])}</div>
        <div class="label">Em breve</div>
      </div>
      <div class="summary-card">
        <div class="number" style="color:#64748b;">{payload['connected_services'] + len(payload['future_services'])}</div>
        <div class="label">Total</div>
      </div>
    </div>

    <div class="section-title">📡 Serviços Disponíveis</div>
    <table>
      <thead>
        <tr><th>Serviço</th><th>Categoria</th><th>Status</th></tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>

    <div class="section-title">🚀 Serviços Futuros</div>
    <table>
      <thead>
        <tr><th>Serviço</th><th>Categoria</th><th>Status</th></tr>
      </thead>
      <tbody>
        {future_rows}
      </tbody>
    </table>

    <div class="footer">
      <p>Atualizado em: {payload['timestamp']}</p>
      <p style="margin-top:4px;"><a href="/api/v1/system/status">Ver JSON</a> · <a href="/docs">API Docs</a></p>
    </div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)

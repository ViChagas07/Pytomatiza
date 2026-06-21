"""Jira Integration Provider — create issues/bugs/tasks, update tickets, health check."""

from __future__ import annotations

import logging
from base64 import b64encode
from typing import Any

import httpx

from pytomatiza.config import settings
from pytomatiza.domain.services.integrations.provider import (
    IntegrationAction,
    IntegrationHealth,
)

logger = logging.getLogger(__name__)


class JiraProvider:
    service_name = "jira"

    def __init__(self, domain: str = "", email: str = "", api_token: str = "") -> None:
        self._domain = domain or getattr(settings, "JIRA_DOMAIN", "")
        self._email = email or getattr(settings, "JIRA_EMAIL", "")
        self._token = api_token or getattr(settings, "JIRA_API_TOKEN", "")
        self._base = f"https://{self._domain}/rest/api/3" if self._domain else ""

    @property
    def _headers(self) -> dict[str, str]:
        auth = b64encode(f"{self._email}:{self._token}".encode()).decode()
        return {"Authorization": f"Basic {auth}", "Content-Type": "application/json", "Accept": "application/json"}

    async def health_check(self, **kwargs: Any) -> IntegrationHealth:
        if not self._domain or not self._email or not self._token:
            return IntegrationHealth(service=self.service_name, connected=False, status="disconnected", message="Missing domain, email, or API token")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self._base}/myself", headers=self._headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return IntegrationHealth(service=self.service_name, connected=True, status="connected", message="Authenticated", details={"displayName": data.get("displayName", "")})
                return IntegrationHealth(service=self.service_name, connected=False, status="error", message=f"HTTP {resp.status_code}")
        except Exception as exc:
            return IntegrationHealth(service=self.service_name, connected=False, status="error", message=str(exc))

    async def execute_action(self, action: str, params: dict[str, Any], **kwargs: Any) -> IntegrationAction:
        try:
            if action in ("create_issue", "create_bug", "create_task"):
                return await self._create_issue(action, params)
            if action == "update_issue":
                return await self._update_issue(params)
            return IntegrationAction(success=False, action=action, error=f"Unknown action: {action}")
        except Exception as exc:
            return IntegrationAction(success=False, action=action, error=str(exc))

    async def validate_credentials(self) -> bool:
        health = await self.health_check()
        return health.connected

    async def _create_issue(self, action: str, params: dict[str, Any]) -> IntegrationAction:
        project_key = params.get("project_key", params.get("project", ""))
        summary = params.get("summary", params.get("title", "New Issue"))
        description = params.get("description", params.get("desc", ""))
        issue_type_map = {"create_bug": "Bug", "create_task": "Task", "create_issue": "Task"}
        issue_type = issue_type_map.get(action, "Task")
        payload = {"fields": {"project": {"key": project_key}, "summary": summary, "description": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}]}, "issuetype": {"name": issue_type}}}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(f"{self._base}/issue", json=payload, headers=self._headers)
            if resp.status_code == 201:
                data = resp.json()
                return IntegrationAction(success=True, action=action, result={"key": data.get("key", ""), "id": data.get("id", "")})
            return IntegrationAction(success=False, action=action, error=f"HTTP {resp.status_code}: {resp.text[:200]}")

    async def _update_issue(self, params: dict[str, Any]) -> IntegrationAction:
        issue_key = params.get("issue_key", params.get("key", ""))
        updates = params.get("updates", {})
        payload = {"fields": updates}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(f"{self._base}/issue/{issue_key}", json=payload, headers=self._headers)
            return IntegrationAction(success=resp.status_code in (200, 204), action="update_issue", result={"status": resp.status_code})

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pytomatiza.infrastructure.monitoring.prometheus_setup import ACTIVE_WS_CONNECTIONS
from pytomatiza.infrastructure.security.jwt_token_service import JWTTokenService

ws_router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self._active: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if user_id in self._active:
            try:
                await self._active[user_id].close(code=1000)
            except Exception:
                pass
        self._active[user_id] = ws
        ACTIVE_WS_CONNECTIONS.inc()

    def disconnect(self, user_id: str) -> None:
        self._active.pop(user_id, None)
        ACTIVE_WS_CONNECTIONS.dec()

    async def send_to_user(self, user_id: str, payload: dict[str, Any]) -> None:
        ws = self._active.get(user_id)
        if ws is not None:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        disconnected: list[str] = []
        for uid, ws in self._active.items():
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(uid)


manager = ConnectionManager()


@ws_router.websocket("/ws/agents")
async def agents_websocket(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    if token is None:
        await websocket.close(code=1008, reason="Missing token")
        return

    try:
        payload: dict[str, Any] = JWTTokenService().decode_token(token)
        raw_sub = payload.get("sub")
        if not isinstance(raw_sub, str):
            await websocket.close(code=1008, reason="Invalid token subject")
            return
        user_id: str = raw_sub
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message: dict[str, Any] = json.loads(data)
            msg_type: str = str(message.get("type", ""))

            if msg_type == "ping":
                await manager.send_to_user(user_id, {"type": "pong"})

            elif msg_type == "subscribe_agent":
                agent_id: str = str(message.get("agent_id", ""))
                await manager.send_to_user(
                    user_id,
                    {
                        "type": "subscribed",
                        "agent_id": agent_id,
                        "message": f"Subscribed to agent {agent_id}",
                    },
                )
            else:
                await manager.send_to_user(
                    user_id,
                    {"type": "error", "message": f"Unknown message type: {msg_type}"},
                )
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception:
        manager.disconnect(user_id)
"""Integration tests for API endpoints."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from pytomatiza.main import create_app


@pytest.fixture
def app():
    """Return a fresh FastAPI app for testing."""
    return create_app()


@pytest.fixture
async def client(app):
    """Return an async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    async def test_health_returns_200(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


class TestAuthEndpoints:
    """Tests for auth endpoints."""

    async def test_register_validation(self, client: AsyncClient) -> None:
        """Registration should validate required fields."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "invalid", "password": "short"},
        )
        assert response.status_code == 422  # Pydantic validation error

    async def test_register_success(self, client: AsyncClient) -> None:
        # This would need a test DB — skipping full integration for now
        pass

    async def test_login_validation(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "", "password": ""},
        )
        assert response.status_code == 422  # Validation error

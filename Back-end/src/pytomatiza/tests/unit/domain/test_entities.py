"""Unit tests for domain entities — User, Agent, Workflow."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from pytomatiza.domain.entities.agent import Agent, AgentStatus
from pytomatiza.domain.entities.user import User
from pytomatiza.domain.entities.workflow import Workflow, WorkflowStatus
from pytomatiza.domain.events.user_registered import UserRegistered
from pytomatiza.domain.events.workflow_completed import (
    WorkflowApproved,
    WorkflowCreated,
)
from pytomatiza.domain.value_objects.email import Email


# ── User tests ─────────────────────────────────────────────────────────


class TestUser:
    """Tests for the User domain entity."""

    def test_verify_email_emits_event(self, sample_user: User) -> None:
        sample_user.is_verified = False
        sample_user.verify_email()
        assert sample_user.is_verified is True
        events = sample_user.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], UserRegistered)
        assert events[0].email == "test@example.com"

    def test_verify_already_verified_is_noop(self, sample_user: User) -> None:
        sample_user.verify_email()
        events = sample_user.pull_events()
        assert len(events) == 0

    def test_deactivate(self, sample_user: User) -> None:
        sample_user.deactivate()
        assert sample_user.is_active is False

    def test_change_password(self, sample_user: User) -> None:
        sample_user.change_password("new_hash")
        assert sample_user.hashed_password == "new_hash"


# ── Email Value Object tests ────────────────────────────────────────────


class TestEmail:
    """Tests for the Email value object."""

    def test_valid_email(self) -> None:
        email = Email("user@example.com")
        assert str(email) == "user@example.com"

    def test_invalid_email_raises(self) -> None:
        with pytest.raises(ValueError):
            Email("not-an-email")

    def test_empty_email_raises(self) -> None:
        with pytest.raises(ValueError):
            Email("")

    def test_equality(self) -> None:
        a = Email("same@example.com")
        b = Email("same@example.com")
        assert a == b


# ── Agent tests ─────────────────────────────────────────────────────────


class TestAgent:
    """Tests for the Agent domain entity."""

    def test_activate(self, sample_agent: Agent) -> None:
        sample_agent.activate()
        assert sample_agent.status == AgentStatus.ACTIVE

    def test_deactivate(self, sample_agent: Agent) -> None:
        sample_agent.status = AgentStatus.ACTIVE
        sample_agent.deactivate()
        assert sample_agent.status == AgentStatus.INACTIVE

    def test_cannot_activate_configuring_agent(self, sample_agent: Agent) -> None:
        sample_agent.status = AgentStatus.CONFIGURING
        with pytest.raises(ValueError, match="still configuring"):
            sample_agent.activate()

    def test_mark_error(self, sample_agent: Agent) -> None:
        sample_agent.mark_error()
        assert sample_agent.status == AgentStatus.ERROR


# ── Workflow tests ────────────────────────────────────────────────────────


class TestWorkflow:
    """Tests for the Workflow domain entity."""

    def test_submit_for_approval(self, sample_workflow: Workflow) -> None:
        sample_workflow.submit_for_approval()
        assert sample_workflow.status == WorkflowStatus.PENDING_APPROVAL

    def test_approve_emits_event(self, sample_workflow: Workflow) -> None:
        sample_workflow.status = WorkflowStatus.PENDING_APPROVAL
        approver_id = uuid.uuid4()
        sample_workflow.approve(approved_by=approver_id)
        assert sample_workflow.status == WorkflowStatus.APPROVED
        events = sample_workflow.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], WorkflowApproved)

    def test_deny(self, sample_workflow: Workflow) -> None:
        sample_workflow.status = WorkflowStatus.PENDING_APPROVAL
        sample_workflow.deny()
        assert sample_workflow.status == WorkflowStatus.DENIED

    def test_cannot_approve_non_pending(self, sample_workflow: Workflow) -> None:
        with pytest.raises(ValueError):
            sample_workflow.approve(approved_by=uuid.uuid4())

    def test_complete_success(self, sample_workflow: Workflow) -> None:
        sample_workflow.status = WorkflowStatus.RUNNING
        sample_workflow.complete(result_status="success")
        assert sample_workflow.status == WorkflowStatus.COMPLETED

    def test_complete_failure(self, sample_workflow: Workflow) -> None:
        sample_workflow.status = WorkflowStatus.RUNNING
        sample_workflow.complete(result_status="failure")
        assert sample_workflow.status == WorkflowStatus.FAILED

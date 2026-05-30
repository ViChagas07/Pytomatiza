"""ApproveWorkflowUseCase — approves or denies a pending workflow."""

from __future__ import annotations

from uuid import UUID

from pytomatiza.application.dtos.workflow_dtos import WorkflowApprovalCommand, WorkflowResponse
from pytomatiza.domain.entities.workflow import WorkflowStatus
from pytomatiza.domain.exceptions.base import BusinessRuleViolation, EntityNotFound
from pytomatiza.domain.repositories.workflow_repository import WorkflowRepository


class ApproveWorkflowUseCase:
    """Approve or deny a workflow that is pending approval.

    Only the owner of the workflow or an admin can approve/deny. Once
    approved, the workflow can be executed by agents.
    """

    def __init__(self, workflow_repo: WorkflowRepository) -> None:
        self._workflow_repo = workflow_repo

    async def execute(
        self,
        workflow_id: UUID,
        command: WorkflowApprovalCommand,
        user_id: UUID,
    ) -> WorkflowResponse:
        """Approve or deny the workflow.

        Raises:
            EntityNotFound: if the workflow does not exist.
            BusinessRuleViolation: if the workflow is not in PENDING_APPROVAL status
                or if a non-owner tries to approve.
        """
        workflow = await self._workflow_repo.find_by_id(workflow_id)
        if workflow is None:
            raise EntityNotFound(f"Workflow {workflow_id!r} not found.")

        if workflow.owner_id != user_id:
            raise BusinessRuleViolation("Only the workflow owner can approve or deny it.")

        if workflow.status != WorkflowStatus.PENDING_APPROVAL:
            raise BusinessRuleViolation(
                f"Workflow is in {workflow.status.value!r} status, not pending approval."
            )

        if command.approved:
            workflow.approve(approved_by=user_id)
        else:
            workflow.deny()

        saved_workflow = await self._workflow_repo.save(workflow)
        return WorkflowResponse.model_validate(saved_workflow, from_attributes=True)

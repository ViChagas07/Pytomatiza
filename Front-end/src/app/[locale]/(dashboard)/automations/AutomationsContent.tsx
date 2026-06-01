/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Automations — NLP Workflow Builder (Client)
   Text area for natural language instructions, agent type picker,
   approval toggle, and result display.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Send,
  ToggleLeft,
  ToggleRight,
  Play,
  Clock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  nlpWorkflowSchema,
  type NLPWorkflowInput,
} from "@/lib/validations/workflow";
import { Button } from "@/components/ui/Button";
import { LoginAlert } from "@/components/ui/LoginAlert";
import { cn } from "@/lib/utils";

/* ── Mock workflow type ──────────────────────────────────────────── */

interface Workflow {
  id: string;
  instruction: string;
  status: "active" | "paused";
  lastTriggered: string | null;
  executions: number;
}

/* ── Example suggestions ─────────────────────────────────────────── */

const suggestions = ["example1", "example2", "example3"];

export function AutomationsContent() {
  const t = useTranslations("automations");
  const ta = useTranslations("automations.nlpBuilder");
  const [loaded, setLoaded] = React.useState(false);
  const [isBuilding, setIsBuilding] = React.useState(false);
  const [buildResult, setBuildResult] = React.useState<string | null>(null);
  const [buildError, setBuildError] = React.useState<string | null>(null);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NLPWorkflowInput>({
    resolver: zodResolver(nlpWorkflowSchema),
    defaultValues: {
      instruction: "",
      requireApproval: true,
    },
  });

  const instruction = watch("instruction");
  const requireApproval = watch("requireApproval") ?? true;
  const charCount = instruction?.length || 0;

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /* Build workflow handler */
  const onBuild = async (data: NLPWorkflowInput) => {
    setIsBuilding(true);
    setBuildError(null);
    setBuildResult(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock result
      setBuildResult(
        t("workflowList.created", {
          agentType: data.agentType || "auto-detected",
          approval: data.requireApproval ? t("workflowList.required") : t("workflowList.notRequired"),
        })
      );

      // Add to workflow list
      setWorkflows((prev) => [
        {
          id: `wf-${Date.now()}`,
          instruction: data.instruction,
          status: "active",
          lastTriggered: null,
          executions: 0,
        },
        ...prev,
      ]);

      // Reset form
      setValue("instruction", "");
    } catch {
      setBuildError(ta("buildFailed"));
    } finally {
      setIsBuilding(false);
    }
  };

  /* Toggle workflow status */
  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id
          ? { ...wf, status: wf.status === "active" ? "paused" : "active" } as Workflow
          : wf
      )
    );
  };

  /* Delete workflow */
  const deleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
  };

  /* Use suggestion */
  const applySuggestion = (key: string) => {
    setValue("instruction", ta(key));
  };

  if (!loaded) return null;

  return (
    <>
      {/* Login prompt — shown when user is a visitor (not authenticated) */}
      <LoginAlert label={t("loginPrompt")} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* NLP Workflow Builder */}
      <section
        aria-labelledby="nlp-builder-heading"
        className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
            <Sparkles
              className="h-4 w-4 text-[var(--brand-accent)]"
              aria-hidden="true"
            />
          </div>
          <h2 id="nlp-builder-heading" className="text-md font-semibold text-[var(--text-primary)]">
            {ta("title")}
          </h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {ta("description")}
        </p>

        <form onSubmit={handleSubmit(onBuild)} noValidate className="space-y-6">
          {/* Instruction textarea */}
          <div>
            <label
              htmlFor="nlp-instruction"
              className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
            >
              {ta("instructionLabel")}
            </label>
            <textarea
              id="nlp-instruction"
              rows={4}
              placeholder={ta("instructionPlaceholder")}
              aria-describedby="nlp-helper nlp-char-count"
              data-testid="nlp-instruction"
              className={cn(
                "w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
                "bg-[var(--surface-0)] resize-y min-h-[100px]",
                "placeholder:text-[var(--text-tertiary)]",
                "focus-visible:outline-2 focus-visible:outline-offset-1",
                "focus-visible:outline-[var(--brand-accent)]",
                errors.instruction
                  ? "border-[var(--color-danger)]"
                  : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
              )}
              {...register("instruction")}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p
                id="nlp-helper"
                className="text-xs text-[var(--text-tertiary)]"
              >
                {ta("instructionHelper")}
              </p>
              <p
                id="nlp-char-count"
                aria-live="polite"
                className={cn(
                  "text-xs",
                  charCount > 450
                    ? "text-[var(--color-danger)] font-medium"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                {ta("charCount", { current: charCount, max: 500 })}
              </p>
            </div>
            {errors.instruction && (
              <p
                role="alert"
                className="mt-1 text-xs text-[var(--color-danger)]"
                data-testid="nlp-instruction-error"
              >
                {ta(errors.instruction.message as string)}
              </p>
            )}
          </div>

          {/* Agent type */}
          <div>
            <label
              htmlFor="nlp-agent-type"
              className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
            >
              {ta("agentTypeLabel")}
            </label>
            <select
              id="nlp-agent-type"
              data-testid="nlp-agent-type"
              className={cn(
                "w-full h-10 rounded-[var(--radius-md)] border border-[var(--border-default)]",
                "bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)]",
                "focus-visible:outline-2 focus-visible:outline-offset-1",
                "focus-visible:outline-[var(--brand-accent)]"
              )}
              {...register("agentType")}
            >
              <option value="">{ta("agentTypePlaceholder")}</option>
              <option value="productivity">{t("agentTypes.productivity")}</option>
              <option value="data">{t("agentTypes.data")}</option>
              <option value="content">{t("agentTypes.content")}</option>
              <option value="admin">{t("agentTypes.admin")}</option>
              <option value="technical">{t("agentTypes.technical")}</option>
            </select>
          </div>

          {/* Approval toggle */}
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-1)] p-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {ta("requireApprovalLabel")}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {ta("requireApprovalHelper")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={requireApproval}
              onClick={() => setValue("requireApproval", !requireApproval)}
              data-testid="nlp-approval-toggle"
              className={cn(
                "flex h-8 w-14 items-center rounded-full p-1 transition-colors",
                requireApproval
                  ? "bg-[var(--brand-accent)]"
                  : "bg-[var(--border-default)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--brand-accent)]"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
                  requireApproval ? "translate-x-6" : "translate-x-0"
                )}
                aria-hidden="true"
              >
                {requireApproval ? (
                  <ToggleRight className="h-4 w-4 text-[var(--brand-accent)]" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-[var(--text-tertiary)]" />
                )}
              </span>
            </button>
          </div>

          {/* Build button */}
          <Button
            type="submit"
            loading={isBuilding}
            disabled={charCount < 10}
            className="w-full"
            data-testid="nlp-build"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isBuilding ? ta("building") : ta("build")}
          </Button>
        </form>

        {/* Build result / error */}
        <div aria-live="polite">
          {buildError && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)]"
              data-testid="nlp-build-error"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {buildError}
            </div>
          )}
          {buildResult && (
            <div
              className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)]"
              data-testid="nlp-build-result"
            >
              {buildResult}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-5">
          <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">
            {ta("suggestions")}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applySuggestion(key)}
                className={cn(
                  "rounded-[var(--radius-full)] border border-[var(--border-default)]",
                  "px-3 py-1.5 text-xs text-[var(--text-secondary)]",
                  "hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-1",
                  "focus-visible:outline-[var(--brand-accent)]"
                )}
                data-testid={`nlp-suggestion-${key.split(".").pop()}`}
              >
                {ta(key)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow list */}
      <section aria-labelledby="workflows-heading">
        <h2
          id="workflows-heading"
          className="text-lg font-semibold text-[var(--text-primary)] mb-3"
        >
          {t("workflowList.title")}
        </h2>

        {workflows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            role="status"
          >
            <Sparkles className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">
              {t("workflowList.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-5" role="list" aria-label={t("workflowList.label")}>
            {workflows.map((wf) => (
              <div
                key={wf.id}
                role="listitem"
                className={cn(
                  "flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)]",
                  "bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]"
                )}
                data-testid={`workflow-${wf.id}`}
              >
                {/* Status indicator */}
                <div className="mt-1 shrink-0">
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      wf.status === "active"
                        ? "bg-[var(--brand-accent)]"
                        : "bg-[var(--text-tertiary)]"
                    )}
                    aria-hidden="true"
                  />
                  <span className="sr-only">
                    {t("workflowList.status", { status: wf.status })}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed line-clamp-2">
                    {wf.instruction}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {wf.lastTriggered
                        ? `${t("workflowList.lastTriggered")}: ${new Date(wf.lastTriggered).toLocaleDateString()}`
                        : t("workflowList.neverTriggered")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" aria-hidden="true" />
                      {wf.executions} {t("workflowList.executions")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleWorkflow(wf.id)}
                    aria-label={t("workflowList.toggle")}
                    data-testid={`workflow-toggle-${wf.id}`}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
                      "transition-colors",
                      wf.status === "active"
                        ? "text-[var(--brand-accent)] hover:bg-[var(--brand-accent-light)]"
                        : "text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]",
                      "focus-visible:outline-2 focus-visible:outline-offset-1",
                      "focus-visible:outline-[var(--brand-accent)]"
                    )}
                  >
                    {wf.status === "active" ? (
                      <ToggleRight className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("workflowList.deleteConfirm"))) {
                        deleteWorkflow(wf.id);
                      }
                    }}
                    aria-label={t("workflowList.delete")}
                    data-testid={`workflow-delete-${wf.id}`}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
                      "text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]",
                      "hover:text-[var(--color-danger)] transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-1",
                      "focus-visible:outline-[var(--brand-accent)]"
                    )}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Agent Store
   Manages agent list, active agent, and status updates.
   ═══════════════════════════════════════════════════════════════════ */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/* ── Agent Type Definitions ──────────────────────────────────────── */

export type AgentType =
  | "productivity"
  | "data"
  | "content"
  | "admin"
  | "technical";

export type AgentStatus = "idle" | "running" | "error" | "paused";

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  /** ISO timestamp of last execution */
  lastRun: string | null;
  /** Success rate 0–100 */
  successRate: number;
  /** Total executions count */
  totalExecutions: number;
  /** Whether the agent is editable by the current user */
  isEditable: boolean;
}

/* ── Filter State ────────────────────────────────────────────────── */

export interface AgentFilters {
  search: string;
  type: AgentType | "all";
  status: AgentStatus | "all";
}

/* ── Store Interface ─────────────────────────────────────────────── */

interface AgentStore {
  agents: Agent[];
  /** Currently selected agent for detail view */
  activeAgentId: string | null;
  /** Search & filter state */
  filters: AgentFilters;
  /** Loading / error states */
  isLoading: boolean;
  error: string | null;

  /* Actions */
  setAgents: (agents: Agent[]) => void;
  setActiveAgent: (id: string | null) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  setFilters: (filters: Partial<AgentFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/* ── Default Filters ─────────────────────────────────────────────── */

const defaultFilters: AgentFilters = {
  search: "",
  type: "all",
  status: "all",
};

/* ── Store ───────────────────────────────────────────────────────── */

export const useAgentStore = create<AgentStore>()(
  devtools(
    (set) => ({
      agents: [],
      activeAgentId: null,
      filters: { ...defaultFilters },
      isLoading: false,
      error: null,

      setAgents: (agents) =>
        set({ agents, isLoading: false, error: null }, false, "setAgents"),

      setActiveAgent: (id) =>
        set({ activeAgentId: id }, false, "setActiveAgent"),

      updateAgentStatus: (id, status) =>
        set(
          (state) => ({
            agents: state.agents.map((a) =>
              a.id === id ? { ...a, status } : a
            ),
          }),
          false,
          "updateAgentStatus"
        ),

      setFilters: (partial) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...partial },
          }),
          false,
          "setFilters"
        ),

      resetFilters: () =>
        set({ filters: { ...defaultFilters } }, false, "resetFilters"),

      setLoading: (isLoading) =>
        set({ isLoading }, false, "setLoading"),

      setError: (error) =>
        set({ error, isLoading: false }, false, "setError"),
    }),
    { name: "AgentStore" }
  )
);

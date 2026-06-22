/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ API Client
   Typed fetch wrapper for the FastAPI backend.
   Handles auth tokens, error normalization, and response parsing.

   Resilience features:
   - Automatic retry with exponential backoff for transient errors
   - Network error classification (OFFLINE vs SERVER_ERROR vs AUTH)
   - Health-check endpoint to verify backend reachability
   - Graceful degradation helpers for dashboard consumers
   ═══════════════════════════════════════════════════════════════════ */

import type { Agent, AgentStatus } from "@/store";
import { signOut } from "next-auth/react";

/* ── API Response Types ──────────────────────────────────────────── */

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/** Categorised error codes so consumers can decide on UI treatment. */
export type ErrorCode =
  | "NETWORK_ERROR"      // backend unreachable (DNS, connection refused, timeout)
  | "BACKEND_OFFLINE"    // health-check explicitly returned 503 or timed out
  | "AUTH_ERROR"         // 401 / 403 — token expired, insufficient permissions
  | "NOT_FOUND"          // 404
  | "VALIDATION_ERROR"   // 422 / 400
  | "SERVER_ERROR"       // 5xx
  | "UNKNOWN_ERROR";     // anything else

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  /** Number of items per page (backend sends `per_page`) */
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  activeAgents: number;
  automationsToday: number;
  successRate: number;
  pendingApprovals: number;
}

/** Default zeroed stats for graceful degradation when backend is offline. */
export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  activeAgents: 0,
  automationsToday: 0,
  successRate: 0,
  pendingApprovals: 0,
};

/* ── Backend Agent Response Shape ────────────────────────────────── */

/** Raw agent shape returned by the FastAPI backend. */
export interface BackendAgentResponse {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  status: string;
  config: Record<string, unknown>;
  owner_id: string;
  created_at: string;
  updated_at: string;

  // ── Run‑result metadata (populated by POST /agents/{id}/run) ─────
  accepted?: boolean | null;
  refusal_reason?: string | null;
  response_text?: string | null;
  recommendation?: {
    agent_type: string;
    label: string;
    reason: string;
    tools: string[];
  } | null;
}

/** Paginated agent list as returned by GET /agents */
export interface BackendAgentListResponse {
  items: BackendAgentResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

/** Mapped frontend agent list — what consumers receive */
export interface AgentListResult {
  items: Agent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ── Mapping helpers ─────────────────────────────────────────────── */

const STATUS_MAP: Record<string, AgentStatus> = {
  active: "running",
  running: "running",
  inactive: "idle",
  idle: "idle",
  paused: "paused",
  error: "error",
};

/**
 * Maps a backend agent response to the frontend Agent shape.
 */
export function mapAgentToFrontend(raw: BackendAgentResponse): Agent {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    type: raw.agent_type as Agent["type"],
    status: STATUS_MAP[raw.status] ?? "idle",
    lastRun: raw.updated_at,
    successRate: 0, // Not yet provided by backend — TODO: add computed field
    totalExecutions: 0, // Not yet provided by backend — TODO: add computed field
    isEditable: true, // Owner can always edit their own agents
  };
}

/* ── API Base URL ────────────────────────────────────────────────── */

/* ── API Base URLs ──────────────────────────────────────────────────
   Client-side:  relative path → Next.js proxy → http://localhost:8000
   Server-side:  absolute URL   → direct fetch (Node.js needs this)
   ═══════════════════════════════════════════════════════════════════ */

/** Relative URL for browser fetches (goes through Next.js rewrite → no CORS). */
export const API_BASE = "/api/v1";

/** Absolute URL for server-side fetches (Node.js requires absolute URLs).
 *  In production (Vercel), NEXT_PUBLIC_BACKEND_URL must point to Railway. */
const SERVER_API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/v1`;

/* ── Backend Health State (module-level cache) ────────────────────── */

let _backendReachable: boolean | null = null;    // null = unchecked
let _lastHealthCheck = 0;
const HEALTH_CACHE_MS = 15_000;                  // 15 s cooldown

/* ── Error Classification ─────────────────────────────────────────── */

function classifyError(status: number, _message?: string): ErrorCode {
  if (status === 0) return "NETWORK_ERROR";
  if (status === 401 || status === 403) return "AUTH_ERROR";
  if (status === 404) return "NOT_FOUND";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

/**
 * Normalise a raw error body from the backend into the ApiError format.
 *
 * FastAPI sends `{ detail: string, type?: string }` but the frontend
 * expects `{ code: ErrorCode, message: string }`.
 *
 * If the body already uses the frontend format (`code` / `message`) it
 * passes through unchanged.  Otherwise `detail` → `message` and
 * `type` → `code`, falling back to the HTTP status code.
 */
function normalizeErrorResponse(
  body: Record<string, unknown>,
  status: number,
): ApiError {
  // Already in frontend format?  Use it as-is.
  if (typeof body.code === "string" && typeof body.message === "string") {
    return body as unknown as ApiError;
  }

  // FastAPI shape → frontend shape
  const message =
    (body.message as string) ??
    (body.detail as string) ??
    `HTTP ${status}`;
  const code: ErrorCode =
    (body.code as ErrorCode) ??
    (body.type as ErrorCode) ??
    classifyError(status, message);

  return { code, message };
}

/** Returns `true` when the browser reports the user is offline. */
function isBrowserOffline(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.onLine === "boolean" &&
    !navigator.onLine
  );
}

/**
 * Returns `true` when the error is a genuine network / connectivity problem.
 *
 * Only `NETWORK_ERROR`, `BACKEND_OFFLINE`, or the browser's own offline
 * flag are considered network errors.  Auth, validation, server errors etc.
 * are never conflated with network issues.
 */
export function isNetworkError(error: ApiError | null): boolean {
  if (!error) return false;

  // Direct fetch-failure codes
  if (
    error.code === "NETWORK_ERROR" ||
    error.code === "BACKEND_OFFLINE"
  ) {
    return true;
  }

  // Browser reports offline
  return isBrowserOffline();
}

/* ── Retry helper ─────────────────────────────────────────────────── */

interface RetryOptions {
  maxRetries?: number;          // default 2
  baseDelayMs?: number;         // default 500
  /** Only retry on network errors (default true). */
  onlyNetwork?: boolean;
}

async function withRetry<T>(
  fn: () => Promise<ApiResponse<T>>,
  options: RetryOptions = {}
): Promise<ApiResponse<T>> {
  const { maxRetries = 2, baseDelayMs = 500, onlyNetwork = true } = options;

  let lastResponse: ApiResponse<T> | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fn();
    lastResponse = res;

    // Success — return immediately
    if (!res.error) return res;

    // If we shouldn't retry this error type, bail out
    if (onlyNetwork && !isNetworkError(res.error)) return res;

    // Last attempt — don't sleep
    if (attempt === maxRetries) return res;

    // Exponential backoff: 500, 1000, 2000 …
    await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
  }

  return lastResponse!;
}

/* ── Backend Health Check ─────────────────────────────────────────── */

/**
 * Check if the FastAPI backend is reachable.
 * Result is cached for HEALTH_CACHE_MS to avoid flooding.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const now = Date.now();
  if (_backendReachable !== null && now - _lastHealthCheck < HEALTH_CACHE_MS) {
    return _backendReachable;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);
    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    _backendReachable = res.ok;
  } catch {
    _backendReachable = false;
  }

  _lastHealthCheck = now;
  return _backendReachable;
}

/** Reset the cached health state (call after successful reconnection). */
export function resetHealthState(): void {
  _backendReachable = null;
  _lastHealthCheck = 0;
}

/* ── Server-side fetch (with auth cookie forwarding) ─────────────── */

interface ServerFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  tags?: string[];
  /** Set to false to skip the automatic retry for network errors. */
  retry?: boolean;
}

/**
 * Server-side fetch helper.
 * Forwards cookies for auth. Adds cache tags for ISR revalidation.
 * Automatically retries once on transient network failures.
 * Forwards the backend JWT token from NextAuth session as Bearer.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { body, tags, retry = true, ...fetchOptions } = options;

  async function doFetch(): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...((fetchOptions.headers as Record<string, string>) || {}),
      };

      // Forward auth cookies in server context
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      if (allCookies.length > 0) {
        const cookieHeader = allCookies
          .map((c) => `${c.name}=${c.value}`)
          .join("; ");
        (headers as Record<string, string>)["Cookie"] = cookieHeader;
      }

      // Forward the backend JWT token from NextAuth session (server-side)
      try {
        const { auth } = await import("@/lib/auth");
        const session = await auth();
        if (session?.backendToken) {
          (headers as Record<string, string>)["Authorization"] =
            `Bearer ${session.backendToken}`;
        }
      } catch {
        // auth() not available in this context — skip Bearer header
      }

      const response = await fetch(`${SERVER_API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        next: tags ? { tags } : undefined,
      });

      const status = response.status;

      if (!response.ok) {
        let error: ApiError;
        try {
          const body = await response.json();
          error = normalizeErrorResponse(
            typeof body === "object" && body !== null ? body : {},
            status,
          );
        } catch {
          error = {
            code: classifyError(status),
            message: `Request failed with status ${status}`,
          };
        }
        return { data: null, error, status };
      }

      const data = (await response.json()) as T;
      return { data, error: null, status };
    } catch (err) {
      // Genuine network failure (DNS, connection refused, timeout, CORS, etc.)
      return {
        data: null,
        error: {
          code: "NETWORK_ERROR",
          message:
            err instanceof Error ? err.message : "Network request failed",
        },
        status: 0,
      };
    }
  }

  if (retry) {
    return withRetry(doFetch, { maxRetries: 2, baseDelayMs: 400 });
  }
  return doFetch();
}

/* ── Client-side fetch (uses browser cookies + Bearer token) ──────── */

interface ClientFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Set to false to skip the automatic retry for network errors. */
  retry?: boolean;
}

/**
 * Client-side fetch helper.
 * Credentials included automatically via `credentials: "include"`.
 * Bearer token from NextAuth session forwarded in Authorization header.
 * Auto-retries on transient network failures.
 * On 401, automatically calls signOut() to redirect to login.
 */
export async function clientFetch<T>(
  endpoint: string,
  options: ClientFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { body, retry = true, ...fetchOptions } = options;

  async function doFetch(): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...((fetchOptions.headers as Record<string, string>) || {}),
      };

      // ── Inject Bearer token from NextAuth session ────────────────
      let backendToken: string | undefined;
      try {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        backendToken = (session as { backendToken?: string } | null)?.backendToken;
        console.log("[clientFetch] endpoint:", endpoint, "backendToken:", backendToken ? `${backendToken.slice(0, 12)}...` : "NULL/UNDEFINED");
        console.log("[clientFetch] session expires:", session?.expires);
        if (backendToken) {
          (headers as Record<string, string>)["Authorization"] =
            `Bearer ${backendToken}`;
        }
      } catch {
        // getSession not available (SSR context) — skip Bearer header
      }

      // No token at all — session is gone, force re-login
      if (!backendToken) {
        console.error("[clientFetch] No backendToken in session — forcing signOut");
        try {
          await signOut({ callbackUrl: "/login", redirect: true });
        } catch {
          // signOut may fail in SSR — ignore
        }
        return { data: null, error: { code: "AUTH_ERROR", message: "No session" }, status: 401 };
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        credentials: "include",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const status = response.status;

      if (!response.ok) {
        // ── 401: Token expired or invalid — force re-login ──────
        if (status === 401) {
          console.error("[clientFetch] 401 on", endpoint, "— session may be stale, forcing signOut");
          try {
            await signOut({ callbackUrl: "/login", redirect: true });
          } catch {
            // signOut may fail in SSR — ignore
          }
          return { data: null, error: { code: "AUTH_ERROR", message: "Session expired" }, status: 401 };
        }

        let error: ApiError;
        try {
          const body = await response.json();
          error = normalizeErrorResponse(
            typeof body === "object" && body !== null ? body : {},
            status,
          );
        } catch {
          error = {
            code: classifyError(status),
            message: `Request failed with status ${status}`,
          };
        }
        return { data: null, error, status };
      }

      const data = (await response.json()) as T;
      return { data, error: null, status };
    } catch (err) {
      // Genuine network failure (DNS, connection refused, timeout, CORS, etc.)
      console.error("[clientFetch] Network error on", endpoint, ":", err);
      return {
        data: null,
        error: {
          code: "NETWORK_ERROR",
          message:
            err instanceof Error ? err.message : "Network request failed",
        },
        status: 0,
      };
    }
  }

  if (retry) {
    return withRetry(doFetch, { maxRetries: 2, baseDelayMs: 400 });
  }
  return doFetch();
}

/* ── API Endpoints ────────────────────────────────────────────────── */

export const api = {
  /* Auth */
  login: (email: string, password: string) =>
    clientFetch<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>("/auth/login", { method: "POST", body: { email, password } }),

  register: (data: { name: string; email: string; password: string }) =>
    clientFetch<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>("/auth/register", { method: "POST", body: data }),

  /* Agents */
  getAgents: async (): Promise<ApiResponse<AgentListResult>> => {
    const res = await clientFetch<BackendAgentListResponse>("/agents");
    if (res.error || !res.data) {
      return { data: null, error: res.error, status: res.status };
    }
    return {
      data: {
        items: res.data.items.map(mapAgentToFrontend),
        total: res.data.total,
        page: res.data.page,
        pageSize: res.data.per_page,
        totalPages: res.data.pages,
      },
      error: null,
      status: res.status,
    };
  },

  getAgent: async (id: string): Promise<ApiResponse<Agent>> => {
    const res = await clientFetch<BackendAgentResponse>(`/agents/${id}`);
    if (res.error || !res.data) {
      return { data: null, error: res.error, status: res.status };
    }
    return {
      data: mapAgentToFrontend(res.data),
      error: null,
      status: res.status,
    };
  },

  runAgent: (id: string, prompt?: string) =>
    clientFetch<BackendAgentResponse>(`/agents/${id}/run`, {
      method: "POST",
      body: { prompt: prompt ?? "" },
    }),

  pauseAgent: (id: string) =>
    clientFetch<BackendAgentResponse>(`/agents/${id}/pause`, { method: "POST" }),

  resumeAgent: (id: string) =>
    clientFetch<BackendAgentResponse>(`/agents/${id}/resume`, {
      method: "POST",
    }),

  /* Dashboard */
  getDashboardStats: () => clientFetch<DashboardStats>("/dashboard/stats"),

  /* Workflows */
  buildWorkflow: (prompt: string, name?: string) =>
    clientFetch<{
      id: string;
      name: string;
      description: string;
      natural_language_prompt: string;
      steps: Array<{ tool: string; action: string; params: Record<string, unknown> }>;
      status: string;
      owner_id: string;
      agent_id: string | null;
      created_at: string;
      updated_at: string;
    }>("/workflows/nlp", {
      method: "POST",
      body: { prompt, name: name ?? "" },
    }),

  getWorkflows: (page?: number, status?: string) =>
    clientFetch<{
      items: Array<{
        id: string;
        name: string;
        description: string;
        natural_language_prompt: string;
        steps: Array<{ tool: string; action: string; params: Record<string, unknown> }>;
        status: string;
        owner_id: string;
        agent_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      total: number;
      page: number;
      per_page: number;
      pages: number;
    }>(`/workflows?page=${page ?? 1}&per_page=20${status ? `&status=${status}` : ""}`),

  executeWorkflow: (id: string) =>
    clientFetch<{
      status: string;
      workflow_id: string;
      run_id: string;
      steps: Array<{ step: number; tool: string; action: string; status: string; output?: unknown; error?: string }>;
      outputs: Record<string, unknown>;
    }>(`/workflows/${id}/execute`, { method: "POST" }),

  approveWorkflow: (id: string, approved: boolean) =>
    clientFetch<{ id: string; name: string; status: string }>(
      `/workflows/${id}/${approved ? "approve" : "deny"}`,
      { method: "POST", body: { approved } }
    ),

  deleteWorkflow: (id: string) =>
    clientFetch<null>(`/workflows/${id}`, { method: "DELETE" }),

  /* ── Integrations (third‑party connectors) ────────────────────── */

  /** List all integrations with metadata and status */
  listIntegrations: () =>
    clientFetch<{
      integrations: Array<{
        service: string;
        label: string;
        icon: string;
        color: string;
        category: string;
        available: boolean;
      }>;
    }>("/integrations"),

  /** Health check all integrations */
  integrationsHealth: () =>
    clientFetch<{
      integrations: Record<
        string,
        {
          connected: boolean;
          status: "connected" | "disconnected" | "error";
          message: string;
          details: Record<string, unknown>;
        }
      >;
    }>("/integrations/health"),

  /** Execute an action on a specific integration */
  integrationExecute: (service: string, action: string, params?: Record<string, unknown>) =>
    clientFetch<{
      success: boolean;
      action: string;
      result: Record<string, unknown>;
      error: string | null;
    }>(`/integrations/${service}/execute?action=${encodeURIComponent(action)}`, {
      method: "POST",
      body: params ?? {},
    }),

  /* ── Architecture Diagram Generation ──────────────────────────── */

  /** Generate an architecture diagram from natural language via Gemini */
  generateArchitecture: (prompt: string, template?: string, format?: string) =>
    clientFetch<{
      mermaid: string;
      title: string;
      description: string;
      component_count: number;
      metadata: Record<string, string>;
    }>("/architecture/generate", {
      method: "POST",
      body: { prompt, template: template ?? "aws", format: format ?? "mermaid" },
    }),

  /* ── Logs ─────────────────────────────────────────────────────── */

  getLogs: (page?: number, status?: string) =>
    clientFetch<{
      items: Array<{
        id: string;
        workflow_name: string;
        workflow_id: string;
        agent_type: string;
        status: string;
        started_at: string | null;
        finished_at: string | null;
        error_message: string | null;
        duration_ms: number;
      }>;
      total: number;
      page: number;
      per_page: number;
      pages: number;
    }>(`/logs?page=${page ?? 1}&per_page=20${status ? `&status=${status}` : ""}`),

  getLogsStats: () =>
    clientFetch<{
      total_executions: number;
      success_rate: number;
      errors_24h: number;
      pending_approvals: number;
      avg_duration_ms: number;
    }>("/logs/stats"),

  getPendingApprovals: () =>
    clientFetch<{
      items: Array<{ id: string; workflow_name: string; workflow_id: string }>;
      total: number;
    }>("/logs/approvals"),

  /* ── Communication ─────────────────────────────────────────────── */

  sendMessage: (service: string, action: string, params?: Record<string, unknown>) =>
    clientFetch<{ success: boolean; action: string; result: Record<string, unknown>; error: string | null }>(
      `/communication/send?service=${service}&action=${action}`,
      { method: "POST", body: params ?? {} }
    ),

  getCommunicationChannels: () =>
    clientFetch<{
      channels: Record<string, { connected: boolean; status: string; message: string }>;
    }>("/communication/channels"),

  /* ── Data Analysis ─────────────────────────────────────────────── */

  analyzeData: (prompt: string) =>
    clientFetch<{ result: string; status: string }>("/data/analyze", {
      method: "POST",
      body: { prompt },
    }),

  /* ── Media Transform ───────────────────────────────────────────── */

  transformMedia: async (file: File, action: string, options?: { width?: number; height?: number; quality?: number; format?: string }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", action);
    if (options?.width) formData.append("width", String(options.width));
    if (options?.height) formData.append("height", String(options.height));
    if (options?.quality) formData.append("quality", String(options.quality));
    if (options?.format) formData.append("format", options.format);

    try {
      const headers: Record<string, string> = {};
      try {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.backendToken) headers["Authorization"] = `Bearer ${session.backendToken}`;
      } catch { /* skip */ }

      const response = await fetch(`${API_BASE}/media/transform`, {
        method: "POST", credentials: "include", headers, body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { data: null, error: { code: "SERVER_ERROR" as const, message: (err as Record<string,unknown>).detail as string || "Transform failed" }, status: response.status };
      }
      const blob = await response.blob();
      return { data: { blob, url: URL.createObjectURL(blob) }, error: null, status: response.status };
    } catch (err) {
      return { data: null, error: { code: "NETWORK_ERROR" as const, message: err instanceof Error ? err.message : "Network error" }, status: 0 };
    }
  },

  /* ── Files / Storage (wire to existing storage.py) ─────────────── */

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const headers: Record<string, string> = {};
      try {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.backendToken) headers["Authorization"] = `Bearer ${session.backendToken}`;
      } catch { /* skip */ }
      const response = await fetch(`${API_BASE}/storage/upload`, {
        method: "POST", credentials: "include", headers, body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { data: null, error: { code: "SERVER_ERROR" as const, message: (err as Record<string,unknown>).detail as string || "Upload failed" }, status: response.status };
      }
      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (err) {
      return { data: null, error: { code: "NETWORK_ERROR" as const, message: err instanceof Error ? err.message : "Network error" }, status: 0 };
    }
  },

  listFiles: (prefix?: string) =>
    clientFetch<{
      items: Array<{ key: string; size: number; last_modified: string }>;
    }>(`/storage/list${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`),

  deleteFile: (key: string) =>
    clientFetch<{ message: string }>(`/storage/files?key=${encodeURIComponent(key)}`, { method: "DELETE" }),

  /* Automations */
  getAutomationRuns: (page = 1, perPage = 20) =>
    clientFetch<PaginatedResponse<unknown>>(
      `/automations/runs?page=${page}&per_page=${perPage}`
    ),

  /* ── Integrations ────────────────────────────────────────────── */

  /** Check Google Drive OAuth connection status */
  getDriveStatus: () =>
    clientFetch<{ connected: boolean; service: string; email: string | null }>(
      "/integrations/google-drive/status"
    ),

  /** Disconnect Google Drive */
  disconnectDrive: () =>
    clientFetch<{ message: string; disconnected: boolean }>(
      "/integrations/google-drive/disconnect",
      { method: "DELETE" }
    ),

  /** List files from Google Drive */
  listDriveFiles: (query?: string, pageSize?: number, pageToken?: string) =>
    clientFetch<{
      files: Array<{
        id: string;
        name: string;
        mime_type: string;
        size: string | null;
        web_view_link: string | null;
        created_at: string | null;
        modified_at: string | null;
      }>;
      next_page_token: string | null;
    }>(
      `/integrations/google-drive/files?${new URLSearchParams({
        ...(query ? { query } : {}),
        page_size: String(pageSize ?? 50),
        ...(pageToken ? { page_token: pageToken } : {}),
      }).toString()}`
    ),

  /** Check Google Photos OAuth connection status */
  getPhotosStatus: () =>
    clientFetch<{ connected: boolean; service: string; email: string | null }>(
      "/integrations/google-photos/status"
    ),

  /** Disconnect Google Photos */
  disconnectPhotos: () =>
    clientFetch<{ message: string; disconnected: boolean }>(
      "/integrations/google-photos/disconnect",
      { method: "DELETE" }
    ),

  /** List albums from Google Photos */
  listPhotosAlbums: (pageSize?: number, pageToken?: string) =>
    clientFetch<{
      albums: Array<{
        id: string;
        title: string;
        item_count: string | null;
        cover_url: string | null;
      }>;
      next_page_token: string | null;
    }>(
      `/integrations/google-photos/albums?${new URLSearchParams({
        page_size: String(pageSize ?? 50),
        ...(pageToken ? { page_token: pageToken } : {}),
      }).toString()}`
    ),

  /** Get Google OAuth authorization URL for Drive */
  getDriveAuthUrl: () =>
    clientFetch<{ authorization_url: string }>("/auth/google/drive"),

  /** Get Google OAuth authorization URL for Photos */
  getPhotosAuthUrl: () =>
    clientFetch<{ authorization_url: string }>("/auth/google/photos"),

  /* ── OCR ──────────────────────────────────────────────────────── */

  /** Upload a file and extract text via OCR. Uses FormData (multipart). */
  ocrExtract: async (
    file: File,
    language?: string,
    extractFields?: boolean,
  ): Promise<
    ApiResponse<{
      text: string;
      pages: Array<{
        page_number: number;
        text: string;
        confidence: number;
      }>;
      language: string;
      processing_time: number;
      confidence: number;
      provider: string;
      metadata: Record<string, unknown>;
      extracted_fields?: {
        cpf?: string | null;
        cnpj?: string | null;
        emails: string[];
        phones: string[];
        dates: string[];
        money_values: string[];
        urls: string[];
        license_plates: string[];
        codes: string[];
      } | null;
    }>
  > => {
    const formData = new FormData();
    formData.append("file", file);
    if (language) formData.append("language", language);
    if (extractFields !== undefined)
      formData.append("extract", String(extractFields));

    try {
      // ── Inject Bearer token from NextAuth session ──────────────
      const headers: Record<string, string> = {};
      try {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.backendToken) {
          headers["Authorization"] = `Bearer ${session.backendToken}`;
        }
      } catch { /* skip */ }

      const response = await fetch(`${API_BASE}/ocr`, {
        method: "POST",
        credentials: "include",
        headers,
        body: formData,
      });

      const status = response.status;

      if (!response.ok) {
        let errorBody: Record<string, unknown> = {};
        try { errorBody = await response.json(); } catch { /* keep empty */ }
        return {
          data: null,
          error: {
            code: "SERVER_ERROR",
            message:
              (errorBody.detail as string) ||
              `OCR request failed with status ${status}`,
          },
          status,
        };
      }

      const data = await response.json();
      return { data, error: null, status };
    } catch (err) {
      return {
        data: null,
        error: {
          code: "NETWORK_ERROR",
          message:
            err instanceof Error ? err.message : "OCR network request failed",
        },
        status: 0,
      };
    }
  },

  /** Check OCR provider health */
  ocrHealth: () =>
    clientFetch<{
      provider: string;
      available: boolean;
      language: string;
      details: Record<string, unknown>;
    }>("/ocr/health"),
};

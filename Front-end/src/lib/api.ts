/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ API Client
   Typed fetch wrapper for the FastAPI backend.
   Handles auth tokens, error normalization, and response parsing.
   ═══════════════════════════════════════════════════════════════════ */

import type { Agent } from "@/store";

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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  activeAgents: number;
  automationsToday: number;
  successRate: number;
  pendingApprovals: number;
}

/* ── API Base URL ────────────────────────────────────────────────── */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/* ── Server-side fetch (with auth cookie forwarding) ─────────────── */

interface ServerFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  tags?: string[];
}

/**
 * Server-side fetch helper.
 * Forwards cookies for auth. Adds cache tags for ISR revalidation.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { body, tags, ...fetchOptions } = options;

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

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      next: tags ? { tags } : undefined,
    });

    const status = response.status;

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status ${status}`,
        };
      }
      return { data: null, error, status };
    }

    const data = (await response.json()) as T;
    return { data, error: null, status };
  } catch (err) {
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

/* ── Client-side fetch (uses browser cookies automatically) ──────── */

interface ClientFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Client-side fetch helper.
 * Credentials included automatically via `credentials: "include"`.
 */
export async function clientFetch<T>(
  endpoint: string,
  options: ClientFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { body, ...fetchOptions } = options;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...((fetchOptions.headers as Record<string, string>) || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status;

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status ${status}`,
        };
      }
      return { data: null, error, status };
    }

    const data = (await response.json()) as T;
    return { data, error: null, status };
  } catch (err) {
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

/* ── API Endpoints ────────────────────────────────────────────────── */

export const api = {
  /* Auth */
  login: (email: string, password: string) =>
    clientFetch<{ token: string; user: { id: string; email: string; name: string } }>(
      "/auth/login",
      { method: "POST", body: { email, password } }
    ),

  register: (data: { name: string; email: string; password: string }) =>
    clientFetch<{ token: string; user: { id: string; email: string; name: string } }>(
      "/auth/register",
      { method: "POST", body: data }
    ),

  /* Agents */
  getAgents: () => clientFetch<Agent[]>("/agents"),

  getAgent: (id: string) => clientFetch<Agent>(`/agents/${id}`),

  runAgent: (id: string) =>
    clientFetch<{ status: string }>(`/agents/${id}/run`, { method: "POST" }),

  pauseAgent: (id: string) =>
    clientFetch<{ status: string }>(`/agents/${id}/pause`, { method: "POST" }),

  resumeAgent: (id: string) =>
    clientFetch<{ status: string }>(`/agents/${id}/resume`, {
      method: "POST",
    }),

  /* Dashboard */
  getDashboardStats: () => clientFetch<DashboardStats>("/dashboard/stats"),

  /* Workflows */
  buildWorkflow: (instruction: string) =>
    clientFetch<{ id: string; workflow: unknown }>("/workflows/nlp", {
      method: "POST",
      body: { instruction },
    }),

  getWorkflows: () =>
    clientFetch<PaginatedResponse<unknown>>("/workflows"),

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
};

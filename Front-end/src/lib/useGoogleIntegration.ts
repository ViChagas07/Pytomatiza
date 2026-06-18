/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ useGoogleIntegration — React hook for Google OAuth
   Handles Drive & Photos connection state, OAuth popup flow,
   and disconnect functionality.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { api } from "@/lib/api";

export type GoogleService = "drive" | "photos" | "gmail";

interface UseGoogleIntegrationReturn {
  /** Whether the service is currently connected via OAuth */
  isConnected: boolean;
  /** Whether we're checking connection status */
  isLoading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Initiate OAuth flow for this service */
  connect: () => Promise<void>;
  /** Disconnect this service */
  disconnect: () => Promise<void>;
  /** Re-check connection status */
  refresh: () => Promise<void>;
}

/**
 * React hook for managing Google OAuth integration state
 * for Drive or Photos services.
 *
 * Usage:
 *   const drive = useGoogleIntegration("drive");
 *   const photos = useGoogleIntegration("photos");
 */
export function useGoogleIntegration(
  service: GoogleService,
): UseGoogleIntegrationReturn {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ── Check connection status ──────────────────────────────────
  const checkStatus = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const statusFn =
        service === "drive" ? api.getDriveStatus : api.getPhotosStatus;
      const result = await statusFn();

      if (result.error) {
        setError(result.error.message);
        setIsConnected(false);
      } else {
        setIsConnected(result.data?.connected ?? false);
      }
    } catch {
      setError("Failed to check connection status.");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Check status on mount and when service changes
  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // ── Connect (OAuth popup flow) ──────────────────────────────
  const connect = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // 1. Get the authorization URL from backend
      const authUrlFn =
        service === "drive" ? api.getDriveAuthUrl : api.getPhotosAuthUrl;
      const authResult = await authUrlFn();

      if (authResult.error || !authResult.data?.authorization_url) {
        throw new Error(
          authResult.error?.message ?? "Failed to get authorization URL.",
        );
      }

      const authUrl = authResult.data.authorization_url;

      // 2. Open OAuth popup
      const popupWidth = 600;
      const popupHeight = 700;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        authUrl,
        "google-oauth",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`,
      );

      if (!popup) {
        throw new Error(
          "Popup blocked. Please allow popups for this site and try again.",
        );
      }

      // 3. Wait for the popup to close (OAuth flow completes)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(checkClosed);
          reject(new Error("OAuth flow timed out."));
        }, 120000); // 2 minute timeout

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            clearTimeout(timeout);
            resolve();
          }
        }, 500);
      });

      // 4. After popup closes, check status
      await checkStatus();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "OAuth connection failed.";
      setError(message);
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [service, checkStatus]);

  // ── Disconnect ──────────────────────────────────────────────
  const disconnect = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const disconnectFn =
        service === "drive" ? api.disconnectDrive : api.disconnectPhotos;
      const result = await disconnectFn();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setIsConnected(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disconnect.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  return {
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    refresh: checkStatus,
  };
}

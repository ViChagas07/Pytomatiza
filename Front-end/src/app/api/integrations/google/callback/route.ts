/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Google OAuth Callback Page (service integrations)
   Renders in the OAuth popup window and auto-closes after confirming
   the connection status to the parent window.
   ═══════════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HTML_TEMPLATE = (
  success: boolean,
  service: string,
  error?: string,
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Connected" : "Connection Failed"} — Pytomatiza+</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #0f172a; color: #e2e8f0;
    }
    .card {
      text-align: center; padding: 2rem; max-width: 320px;
    }
    .icon {
      font-size: 3rem; margin-bottom: 1rem;
    }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; }
    .spinner {
      display: inline-block; width: 24px; height: 24px;
      border: 3px solid #334155; border-top-color: #38bdf8;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin-top: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "&#9989;" : "&#10060;"}</div>
    <h1>${
      success
        ? `Google ${capitalize(service)} connected!`
        : error
          ? `Google ${capitalize(service)} connection failed`
          : "Connection failed"
    }</h1>
    <p>
      ${
        success
          ? "This window will close automatically. You can now use Google "
            + capitalize(service)
            + " features."
          : error
            ? "There was an error: " + error + ". Please try again."
            : "An unknown error occurred. Please try again."
      }
    </p>
    ${success ? '<div class="spinner"></div>' : ""}
  </div>
  <script>
    ${
      success
        ? 'setTimeout(function () { window.close(); }, 1500);'
        : 'setTimeout(function () { window.close(); }, 3000);'
    }
    // If window.close() doesn't work (non-script-opened window),
    // show a fallback message
    setTimeout(function () {
      if (!window.closed) {
        document.querySelector('p').textContent +=
          ' You can close this window manually.';
        document.querySelector('.spinner')?.remove();
      }
    }, ${success ? "2000" : "3500"});
  </script>
</body>
</html>`;

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const success = searchParams.get("success") === "true";
  const service = searchParams.get("service") || "drive";
  const error = searchParams.get("error") || undefined;

  return new NextResponse(HTML_TEMPLATE(success, service, error), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

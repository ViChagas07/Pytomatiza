/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Google OAuth Callback Page (service integrations)
   Renders in the OAuth popup window and auto-closes after confirming
   the connection status to the parent window.
   ═══════════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ── Inline locale messages ─────────────────────────────────────── */

const LOCALE_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    "page.title.success": "Connected",
    "page.title.failure": "Connection Failed",
    "h1.success": "Google {service} connected!",
    "h1.failure.error": "Google {service} connection failed",
    "h1.failure.generic": "Connection failed",
    "p.success": "This window will close automatically. You can now use Google {service} features.",
    "p.failure.error": "There was an error: {error}. Please try again.",
    "p.failure.generic": "An unknown error occurred. Please try again.",
    "p.closeManual": " You can close this window manually.",
  },
  pt: {
    "page.title.success": "Conectado",
    "page.title.failure": "Conexão Falhou",
    "h1.success": "Google {service} conectado!",
    "h1.failure.error": "Conexão com Google {service} falhou",
    "h1.failure.generic": "Conexão falhou",
    "p.success": "Esta janela fechará automaticamente. Agora você pode usar os recursos do Google {service}.",
    "p.failure.error": "Ocorreu um erro: {error}. Tente novamente.",
    "p.failure.generic": "Ocorreu um erro desconhecido. Tente novamente.",
    "p.closeManual": " Você pode fechar esta janela manualmente.",
  },
};

function t(locale: string, key: string, vars?: Record<string, string>): string {
  const msg = LOCALE_MESSAGES[locale]?.[key] || LOCALE_MESSAGES.en[key] || key;
  if (!vars) return msg;
  return msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function render(success: boolean, service: string, locale: string, error?: string) {
  const loc = locale || "en";
  const serviceLabel = capitalize(service);
  const title = success
    ? t(loc, "page.title.success") + " — Pytomatiza+"
    : t(loc, "page.title.failure") + " — Pytomatiza+";

  let heading: string;
  let paragraph: string;

  if (success) {
    heading = t(loc, "h1.success", { service: serviceLabel });
    paragraph = t(loc, "p.success", { service: serviceLabel });
  } else if (error) {
    heading = t(loc, "h1.failure.error", { service: serviceLabel });
    paragraph = t(loc, "p.failure.error", { error });
  } else {
    heading = t(loc, "h1.failure.generic");
    paragraph = t(loc, "p.failure.generic");
  }

  const closeTimeout = success ? 1500 : 3000;
  const fallbackTimeout = success ? 2000 : 3500;
  const closeManual = t(loc, "p.closeManual");

  return `<!DOCTYPE html>
<html lang="${loc}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
    <h1>${heading}</h1>
    <p>${paragraph}</p>
    ${success ? '<div class="spinner"></div>' : ""}
  </div>
  <script>
    setTimeout(function () { window.close(); }, ${closeTimeout});
    setTimeout(function () {
      if (!window.closed) {
        document.querySelector('p').textContent += '${closeManual}';
        document.querySelector('.spinner')?.remove();
      }
    }, ${fallbackTimeout});
  </script>
</body>
</html>`;
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const success = searchParams.get("success") === "true";
  const service = searchParams.get("service") || "drive";
  const locale = searchParams.get("locale") || "en";
  const error = searchParams.get("error") || undefined;

  return new NextResponse(render(success, service, locale, error), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

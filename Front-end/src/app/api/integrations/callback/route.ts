/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Generic OAuth Callback Page
   Renders in the OAuth popup window and communicates back to the
   parent via postMessage, then auto-closes.
   ═══════════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const success = searchParams.get("success") === "true";
  const provider = searchParams.get("provider") || "";
  const service = searchParams.get("service") || "";
  const error = searchParams.get("error") || undefined;

  const title = success ? "Conectado — Pytomatiza+" : "Conexão Falhou — Pytomatiza+";
  const heading = success ? "Integração conectada com sucesso!" : "Falha na conexão";
  const paragraph = success
    ? `Serviço: ${service}`
    : error
      ? `Erro: ${error}`
      : "Ocorreu um erro desconhecido. Tente novamente.";

  const closeTimeout = success ? 1500 : 3000;

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="pt">
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
    .card { text-align: center; padding: 2rem; max-width: 320px; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { font-size: 0.875rem; color: #94a3b8; }
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
    <h1>${heading}</h1>
    <p>${paragraph}</p>
    ${success ? '<div class="spinner"></div>' : ""}
  </div>
  <script>
    try {
      window.opener.postMessage(
        { type: "oauth-result", success: ${success}, provider: "${provider}" },
        "${request.headers.get("origin") || "*"}"
      );
    } catch (e) {
      console.error("postMessage failed", e);
    }
    setTimeout(function () { window.close(); }, ${closeTimeout});
  </script>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

/**
 * Pytomatiza+ i18n Sync — fills missing keys in every locale from the pt base.
 *
 * - `messages/pt.json` is the single source of truth for STRUCTURE.
 * - Matching containers are preserved; missing leaves are translated from pt.
 * - Protected paths keep the pt value verbatim (stable keys, native language
 *   names, brand labels) — never translated.
 * - Arrays may hold strings or objects; both are handled recursively.
 * - Brands, technical terms and interpolation tokens are protected.
 *
 * Usage:  node scripts/i18n-sync.js            (all locales)
 *         node scripts/i18n-sync.js en es fr    (selected locales)
 */

const fs = require("fs");
const path = require("path");
const translateApi = require("google-translate-api-x");

const MSGS_DIR = path.join(__dirname, "..", "messages");
const BASE = "pt";

/** locale → google-translate target code */
const LOCALE_TO_TRANSLATOR = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  ru: "ru",
  ja: "ja",
  zh: "zh-CN",
  ar: "ar",
  hi: "hi",
};

/** Paths that must be copied verbatim from the base (never translated). */
const PROTECTED_PATH_PATTERNS = [
  /^common\.languages\./, // native language names
  /^integrationPanel\.services\.[^.]+\.label$/, // brand names
  /^integrationPanel\.services\.[^.]+\.category$/, // stable category keys
];

function isProtectedPath(keyPath) {
  return PROTECTED_PATH_PATTERNS.some((re) => re.test(keyPath));
}

/* Terms that must never be translated */
const PROTECTED_TERMS = [
  "Pytomatiza+", "Pytomatiza",
  "Google Drive", "Google Workspace", "Gmail", "Google Sheets",
  "Google Calendar", "Google Photos", "Google Maps", "Google Meet",
  "Slack", "GitHub", "GitLab", "Twitter", "LinkedIn", "Reddit",
  "PagerDuty", "YouTube", "Vimeo", "Discord", "Telegram", "Trello",
  "Jira", "Zoom", "Facebook", "Instagram", "WhatsApp", "Microsoft Teams",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "PostgreSQL", "Redis",
  "RabbitMQ", "Nginx", "Node.js", "Python", "Gemini", "OCR", "API", "REST",
  "SQL", "CSV", "PDF", "DOCX", "XLSX", "PPTX", "PNG", "JPG", "JPEG",
  "WebP", "SVG", "GIF", "MP4", "MOV", "WebM", "ZIP", "UTF-8",
  "LGPD", "GDPR", "SaaS", "TLS", "AES-256", "JWT", "RBAC", "DPO", "2FA",
  "CrewAI", "SCCs", "BCRs", "EU-U.S. Data Privacy Framework",
  "YYYY-MM-DD", "End-to-end", "Event-Driven", "Serverless",
  "pytomatiza.com", "privacy@pytomatiza.com", "pytomatiza.app",
];

function protectText(text) {
  let protectedText = text;
  const placeholders = [];
  let idx = 0;

  protectedText = protectedText.replace(/\{\{?[^}]+\}?\}/g, (m) => {
    const ph = `⧼${idx}⧽`;
    placeholders.push({ ph, original: m });
    idx++;
    return ph;
  });

  const sorted = [...PROTECTED_TERMS].sort((a, b) => b.length - a.length);
  for (const term of sorted) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    protectedText = protectedText.replace(regex, () => {
      const ph = `⟪${idx}⟫`;
      placeholders.push({ ph, original: term });
      idx++;
      return ph;
    });
  }

  return { text: protectedText, placeholders };
}

function restoreText(text, placeholders) {
  let result = text;
  const sorted = [...placeholders].sort((a, b) => b.ph.length - a.ph.length);
  for (const { ph, original } of sorted) {
    result = result.split(ph).join(original);
  }
  return result;
}

/**
 * Recursively align `parent[key]` with `base` structure.
 * Collects { keyPath, source } for every leaf that needs a value.
 * Leaves flagged `protected` keep the base value verbatim.
 */
function align(parent, key, base, keyPath, todo) {
  if (Array.isArray(base)) {
    let target = parent[key];
    if (!Array.isArray(target) || target.length !== base.length) {
      target = cloneShape(base);
      parent[key] = target;
    }
    for (let i = 0; i < base.length; i++) {
      const childPath = keyPath ? `${keyPath}.${i}` : String(i);
      align(target, i, base[i], childPath, todo);
    }
    return;
  }

  if (base && typeof base === "object") {
    let target = parent[key];
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      target = {}; // keys filled by recursion below
      parent[key] = target;
    }
    for (const k of Object.keys(base)) {
      const childPath = keyPath ? `${keyPath}.${k}` : k;
      align(target, k, base[k], childPath, todo);
    }
    return;
  }

  // Leaf
  if (typeof base === "string") {
    if (isProtectedPath(keyPath)) {
      if (parent[key] !== base) parent[key] = base;
      return;
    }
    const current = parent[key];
    if (typeof current !== "string" || current.trim() === "") {
      todo.push({ keyPath, source: base });
    }
  }
}

/** Build an empty structure mirroring `v` (leaf strings become ""). */
function cloneShape(v) {
  if (Array.isArray(v)) return v.map(cloneShape);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = cloneShape(v[k]);
    return o;
  }
  return "";
}

/** Set a nested value by dotted path, creating arrays/objects as needed. */
function setByPath(root, keyPath, value) {
  if (!keyPath) return;
  const parts = keyPath.split(".");
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || typeof cur[p] !== "object") {
      cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateTexts(texts, targetLang) {
  if (texts.length === 0) return [];
  const protectedItems = texts.map(protectText);
  const toSend = protectedItems.map((p) => p.text);

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await translateApi.batchTranslate(toSend, {
        from: BASE,
        to: targetLang,
      });
      const arr = Array.isArray(res) ? res : [res];
      if (arr.length !== toSend.length) {
        throw new Error(`Batch size mismatch: got ${arr.length}, expected ${toSend.length}`);
      }
      return arr.map((r, i) => restoreText(r.text, protectedItems[i].placeholders));
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastErr;
}

async function syncLocale(locale, baseData) {
  const filePath = path.join(MSGS_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`✗ ${locale}.json not found — skipping`);
    return;
  }

  const targetLang = LOCALE_TO_TRANSLATOR[locale];
  const target = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const todo = [];
  const root = { value: target };
  align(root, "value", baseData, "", todo);

  if (todo.length === 0) {
    fs.writeFileSync(filePath, JSON.stringify(target, null, 2) + "\n");
    console.log(`✓ ${locale}: already complete`);
    return;
  }

  console.log(`── ${locale} → ${targetLang}: ${todo.length} value(s) to translate`);

  const BATCH = 20;
  let done = 0;
  for (let start = 0; start < todo.length; start += BATCH) {
    const batch = todo.slice(start, start + BATCH);
    const texts = batch.map((m) => m.source);

    let translated;
    try {
      translated = await translateTexts(texts, targetLang);
    } catch (err) {
      console.log(`   ✗ batch failed: ${err.message}`);
      // Fall back to base value so structure is valid & non-empty
      for (const item of batch) setByPath(target, item.keyPath, item.source);
      continue;
    }

    for (let i = 0; i < batch.length; i++) {
      setByPath(target, batch[i].keyPath, translated[i]);
      done++;
    }

    if (start + BATCH < todo.length) {
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(target, null, 2) + "\n");
  console.log(`   ✓ ${locale}.json saved (${done}/${todo.length} filled)\n`);
}

async function main() {
  const baseData = JSON.parse(fs.readFileSync(path.join(MSGS_DIR, `${BASE}.json`), "utf8"));
  const selected = process.argv.slice(2);
  const locales = selected.length > 0 ? selected : Object.keys(LOCALE_TO_TRANSLATOR);
  console.log(`Syncing locales: ${locales.join(", ")} (base: ${BASE})\n`);

  for (const locale of locales) {
    await syncLocale(locale, baseData);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

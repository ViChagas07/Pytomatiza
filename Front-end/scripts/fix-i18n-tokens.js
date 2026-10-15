/**
 * Pytomatiza+ i18n — restore interpolation tokens to match the pt base.
 *
 * For every message key shared with the base, the locale's `{token}`
 * placeholders are rewritten, by position, to the base token names.
 * Text around tokens and ICU plural blocks are preserved.
 *
 * Usage: node scripts/fix-i18n-tokens.js
 */

const fs = require("fs");
const path = require("path");

const MSGS_DIR = path.join(__dirname, "..", "messages");
const BASE = "pt";
const LOCALES = ["en", "es", "fr", "de", "it", "ru", "ja", "zh", "ar", "hi"];

function flatten(o, p = "", out = {}) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    const np = p ? `${p}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, np, out);
    else out[np] = v;
  }
  return out;
}

function setByPath(root, keyPath, value) {
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

/** Simple `{name}` tokens, ignoring ICU blocks that contain a comma. */
function simpleTokens(s) {
  if (typeof s !== "string") return [];
  return s.match(/\{[^,{}\s]+\}/g) || [];
}

function hasIcu(s) {
  return typeof s === "string" && /\{[^}]*,\s*(plural|select|selectordinal|number|date|time)/.test(s);
}

function fixValue(baseVal, locVal) {
  if (typeof baseVal !== "string" || typeof locVal !== "string") return locVal;
  if (hasIcu(baseVal) || hasIcu(locVal)) return locVal; // leave ICU structures untouched

  const baseT = simpleTokens(baseVal);
  if (baseT.length === 0) return locVal;

  const locT = simpleTokens(locVal);
  if (locT.length !== baseT.length) return locVal;

  // Only fix when the token NAME SETS differ. A different order with the same
  // names is a legitimate grammatical choice and must be preserved.
  const sameSet =
    [...baseT].sort().join("|") === [...locT].sort().join("|");
  if (sameSet) return locVal;

  let result = locVal;
  for (let i = 0; i < locT.length; i++) {
    if (locT[i] === baseT[i]) continue;
    // Replace only this exact occurrence, in order
    result = result.replace(locT[i], `\u0000${i}\u0000`);
  }
  for (let i = 0; i < baseT.length; i++) {
    result = result.replace(`\u0000${i}\u0000`, baseT[i]);
  }
  return result;
}

function main() {
  const base = flatten(JSON.parse(fs.readFileSync(path.join(MSGS_DIR, `${BASE}.json`), "utf8")));
  let grand = 0;

  for (const loc of LOCALES) {
    const fp = path.join(MSGS_DIR, `${loc}.json`);
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    const flat = flatten(data);

    let fixed = 0;
    for (const key of Object.keys(base)) {
      if (!(key in flat)) continue;
      const next = fixValue(base[key], flat[key]);
      if (next !== flat[key]) {
        setByPath(data, key, next);
        fixed++;
        console.log(`  ${loc} ${key}: ${JSON.stringify(flat[key])} → ${JSON.stringify(next)}`);
      }
    }

    if (fixed > 0) fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
    console.log(`${loc}: ${fixed} token fix(es)`);
    grand += fixed;
  }

  console.log(`\nTotal fixes: ${grand}`);
}

main();

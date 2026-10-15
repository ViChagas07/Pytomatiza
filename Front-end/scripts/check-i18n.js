#!/usr/bin/env node
/**
 * Pytomatiza+ — i18n integrity check (base = pt).
 *
 * Fails (exit 1) when any locale has:
 *   - a key missing from the pt base        (missing)
 *   - a key that does not exist in the base (orphan)
 *   - an empty / whitespace-only value      (empty)
 *   - interpolation tokens that differ from the base
 *   - a different structure (leaf vs branch) than the base
 *
 * Usage:  node scripts/check-i18n.js
 */

const fs = require("fs");
const path = require("path");

const MSGS_DIR = path.join(__dirname, "..", "messages");
const BASE = "pt";
const LOCALES = ["en", "es", "fr", "de", "it", "ru", "ja", "zh", "ar", "hi"];

/** Flatten to dotted leaf paths; branches become objects. */
function flatten(obj, prefix = "", out = {}) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const p = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      out[p] = value;
      value.forEach((v, i) => {
        if (v && typeof v === "object") flatten(v, `${p}.${i}`, out);
      });
    } else if (value && typeof value === "object") {
      flatten(value, p, out);
    } else {
      out[p] = value;
    }
  }
  return out;
}

function tokenKey(value) {
  if (typeof value !== "string") return "";
  if (/\{[^}]*,(plural|select|selectordinal|number|date|time)/.test(value)) return "ICU";
  return (value.match(/\{[^,{}\s]+\}/g) || []).sort().join(",");
}

function main() {
  const basePath = path.join(MSGS_DIR, `${BASE}.json`);
  if (!fs.existsSync(basePath)) {
    console.error(`✗ Base locale ${BASE}.json not found`);
    process.exit(1);
  }
  const base = flatten(JSON.parse(fs.readFileSync(basePath, "utf8")));
  const baseKeys = Object.keys(base).filter((k) => !/\.\d+$/.test(k) && !Array.isArray(base[k]));

  let failures = 0;

  for (const locale of LOCALES) {
    const filePath = path.join(MSGS_DIR, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`✗ ${locale}.json not found`);
      failures++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      console.error(`✗ ${locale}.json is not valid JSON: ${err.message}`);
      failures++;
      continue;
    }

    const flat = flatten(data);
    const problems = [];

    // Missing + empty + token mismatch + type mismatch
    for (const key of baseKeys) {
      if (!(key in flat)) {
        problems.push(`missing: ${key}`);
        continue;
      }
      const bv = base[key];
      const lv = flat[key];

      if (typeof bv === "string") {
        if (typeof lv !== "string") {
          problems.push(`type mismatch (expected string): ${key}`);
          continue;
        }
        if (lv.trim() === "") {
          problems.push(`empty: ${key}`);
          continue;
        }
        const bt = tokenKey(bv);
        const lt = tokenKey(lv);
        if (bt !== "ICU" && lt !== "ICU" && bt !== lt) {
          problems.push(`token mismatch: ${key} (base "${bt}" vs ${locale} "${lt}")`);
        }
      }
    }

    // Orphans
    const baseSet = new Set(Object.keys(base));
    for (const key of Object.keys(flat)) {
      if (/\.[0-9]+$/.test(key)) continue;
      if (Array.isArray(flat[key])) continue;
      if (!baseSet.has(key)) problems.push(`orphan: ${key}`);
    }

    if (problems.length > 0) {
      failures++;
      console.error(`\n✗ ${locale}.json — ${problems.length} problem(s):`);
      for (const p of problems.slice(0, 50)) console.error(`    ${p}`);
      if (problems.length > 50) console.error(`    … and ${problems.length - 50} more`);
    } else {
      console.log(`✓ ${locale}.json — OK`);
    }
  }

  if (failures > 0) {
    console.error(`\n✗ i18n check failed for ${failures} locale(s).`);
    process.exit(1);
  }
  console.log("\n✓ i18n check passed for all locales.");
}

main();

/**
 * Script to fix missing translation keys across all locale files.
 *
 * 1. Reads pt.json (the most complete/default locale) as the key reference
 * 2. For each locale file, identifies keys present in pt.json but missing
 * 3. Adds missing keys using en.json value as fallback (or pt.json if even en is missing)
 * 4. Preserves ALL existing translations — never overwrites an existing value
 *
 * Usage: node scripts/fix-i18n-missing-keys.js
 */

const fs = require("fs");
const path = require("path");

const MESSAGES_DIR = path.join(__dirname, "..", "messages");

// ---------------------------------------------------------------------------
// 1. Load all locale files
// ---------------------------------------------------------------------------

const locales = ["en", "es", "fr", "de", "it", "ru", "ja", "zh", "ar", "hi"];

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

const ptData = loadJson(path.join(MESSAGES_DIR, "pt.json"));
const enData = loadJson(path.join(MESSAGES_DIR, "en.json"));

// ---------------------------------------------------------------------------
// 2. Get all leaf keys (paths) from an object recursively
// ---------------------------------------------------------------------------

function getAllKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// 3. Set a nested key in an object (mutates)
// ---------------------------------------------------------------------------

function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  // Only set if the key does NOT already exist
  if (!(lastKey in current)) {
    current[lastKey] = value;
  }
}

// ---------------------------------------------------------------------------
// 4. Merge missing keys from reference into target, preserving existing
// ---------------------------------------------------------------------------

function deepMergeMissing(reference, target, fallback) {
  const refKeys = getAllKeys(reference);
  let addedCount = 0;

  for (const keyPath of refKeys) {
    // Determine if target already has this key
    const parts = keyPath.split(".");
    let exists = true;
    let current = target;
    for (const part of parts) {
      if (current == null || !(part in current)) {
        exists = false;
        break;
      }
      current = current[part];
    }

    if (!exists) {
      // Get value from fallback (English) or reference (Portuguese)
      let fallbackValue = undefined;
      let fbCurrent = fallback;
      for (const part of parts) {
        if (fbCurrent == null || !(part in fbCurrent)) {
          fbCurrent = undefined;
          break;
        }
        fbCurrent = fbCurrent[part];
      }
      if (fbCurrent !== undefined) {
        fallbackValue = fbCurrent;
      } else {
        // Try reference (pt.json)
        let refCurrent = reference;
        for (const part of parts) {
          if (refCurrent == null || !(part in refCurrent)) {
            refCurrent = undefined;
            break;
          }
          refCurrent = refCurrent[part];
        }
        if (refCurrent !== undefined) {
          fallbackValue = refCurrent;
        }
      }

      if (fallbackValue !== undefined) {
        setNestedValue(target, keyPath, fallbackValue);
        addedCount++;
      }
    }
  }

  return addedCount;
}

// ---------------------------------------------------------------------------
// 5. Process each locale file
// ---------------------------------------------------------------------------

console.log("=" .repeat(60));
console.log("Fixing missing translation keys across all locale files");
console.log("=" .repeat(60));
console.log(`Reference (complete keys): pt.json (${getAllKeys(ptData).length} keys)`);
console.log(`Fallback values:           en.json`);
console.log("");

let totalAdded = 0;
let totalLocales = 0;

for (const locale of locales) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  ${locale}.json not found, skipping`);
    continue;
  }

  const localeData = loadJson(filePath);
  const originalKeys = getAllKeys(localeData).length;

  // Deep merge: add missing keys (using en.json as fallback, then pt.json)
  const added = deepMergeMissing(ptData, localeData, enData);
  totalAdded += added;
  totalLocales++;

  if (added > 0) {
    saveJson(filePath, localeData);
    const newKeys = getAllKeys(localeData).length;
    console.log(
      `  ✅ ${locale}.json: ${originalKeys} → ${newKeys} keys (+${added} added)`
    );
  } else {
    console.log(`  ✓  ${locale}.json: ${originalKeys} keys (complete)`);
  }
}

console.log("");
console.log("=" .repeat(60));
console.log(`Total: ${totalAdded} keys added across ${totalLocales} locale files`);
console.log("=" .repeat(60));

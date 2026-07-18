#!/usr/bin/env node
/**
 * i18n parity guard.
 *
 * TypeScript already fails the build when an Arabic key is missing (each `ar`
 * object is typed as Record<EnglishKey, string>). This script catches the
 * things the type system cannot:
 *   - an Arabic value left identical to the English one (untranslated paste)
 *   - an empty Arabic value
 *   - {placeholder} tokens that don't match between en and ar, which would
 *     render a literal "{amount}" to a customer
 *   - duplicate keys across namespaces, where the merge order silently wins
 *
 * Run: npm run check:i18n
 */

const fs = require('fs');
const path = require('path');

const DICT_DIR = path.join(__dirname, '..', 'lib', 'i18n');
const FILES = ['dictionaries.ts', 'dictionaries.home.ts', 'dictionaries.shop.ts'];

// Values may be single- OR double-quoted: strings containing an apostrophe
// (e.g. "Don't have an account?") are written with double quotes.
const KEY_RE = /^\s*'([^']+)':\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm;

function parseBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return {};
  const end = endMarker ? source.indexOf(endMarker, start) : -1;
  const block = source.slice(start, end === -1 ? undefined : end);

  const out = {};
  let m;
  KEY_RE.lastIndex = 0;
  while ((m = KEY_RE.exec(block)) !== null) {
    // group 2 = single-quoted value, group 3 = double-quoted value
    out[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  return out;
}

function placeholders(value) {
  return (value.match(/\{(\w+)\}/g) || []).sort().join(',');
}

let errors = 0;
let warnings = 0;
let totalKeys = 0;
const seenKeys = new Map();

for (const file of FILES) {
  const full = path.join(DICT_DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`✗ missing dictionary file: ${file}`);
    errors++;
    continue;
  }

  const src = fs.readFileSync(full, 'utf8');
  const en = parseBlock(src, 'export const en', 'export const ar');
  const ar = parseBlock(src, 'export const ar', null);

  const enKeys = Object.keys(en);
  totalKeys += enKeys.length;

  for (const key of enKeys) {
    // duplicate across namespaces — merge order decides the winner silently
    if (seenKeys.has(key)) {
      console.error(`✗ ${file}: duplicate key '${key}' (also in ${seenKeys.get(key)})`);
      errors++;
    } else {
      seenKeys.set(key, file);
    }

    if (!(key in ar)) {
      console.error(`✗ ${file}: '${key}' has no Arabic translation`);
      errors++;
      continue;
    }

    const arVal = ar[key];

    if (!arVal.trim()) {
      console.error(`✗ ${file}: '${key}' has an empty Arabic value`);
      errors++;
      continue;
    }

    if (placeholders(en[key]) !== placeholders(arVal)) {
      console.error(
        `✗ ${file}: '${key}' placeholder mismatch — en "${en[key]}" vs ar "${arVal}"`
      );
      errors++;
      continue;
    }

    // Identical strings are usually an untranslated paste. Some are legitimately
    // the same (brand names, "Apple Pay", "PRIMO"), so this is a warning only.
    if (arVal === en[key] && !/^[A-Za-z0-9 .&+/'-]{1,20}$/.test(arVal)) {
      console.warn(`⚠ ${file}: '${key}' Arabic is identical to English — "${arVal}"`);
      warnings++;
    }
  }

  for (const key of Object.keys(ar)) {
    if (!(key in en)) {
      console.error(`✗ ${file}: Arabic key '${key}' has no English source`);
      errors++;
    }
  }
}

console.log(
  `\ni18n: ${totalKeys} keys checked across ${FILES.length} namespaces — ` +
    `${errors} error(s), ${warnings} warning(s)`
);

process.exit(errors > 0 ? 1 : 0);

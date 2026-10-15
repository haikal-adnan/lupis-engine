#!/usr/bin/env node
// Static E2E Testing Standard check (Section 13). Fast, dependency-free, safe for CI.
//
//   node scripts/check-standard.mjs
//
// It complements ESLint (eslint-plugin-playwright); it does NOT replace running the suite.
// Exits with code 1 when any rule is violated.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const E2E_DIR = join(ROOT, 'e2e');

/** Application UI strings allowlist (all app UI strings are now in professional English). */
const UI_STRING_ALLOWLIST = [];

/** Distinctive Indonesian words. Kept unambiguous to avoid English false positives. */
const INDONESIAN_WORDS = [
  'dengan', 'yang', 'tidak', 'untuk', 'setelah', 'sebelum', 'harus', 'pastikan', 'memastikan',
  'sudah', 'belum', 'jika', 'bila', 'dapat', 'karena', 'sebuah', 'semua', 'tanpa', 'melalui',
  'secara', 'tepat', 'seluruh', 'setiap', 'langsung', 'kemudian', 'hanya', 'menambah', 'menghapus',
  'membuat', 'mengubah', 'menampilkan', 'memilih', 'mengklik', 'menunggu', 'membuka', 'menutup',
  'tambah', 'hapus', 'buat', 'ubah', 'simpan', 'muncul', 'dibuat', 'dihapus', 'terhapus', 'gagal',
  'berhasil', 'sengaja', 'kecuali', 'beserta', 'masing', 'dulu', 'nanti', 'bukan', 'lalu',
];

/** [rule id, regex, applies to (path predicate), message] */
const RULES = [
  ['no-wait-for-timeout', /\bwaitForTimeout\s*\(/, () => true, 'page.waitForTimeout() is banned (Section 2/9).'],
  ['no-networkidle', /networkidle/, () => true, "waitForLoadState('networkidle') is banned (Section 9)."],
  ['no-force', /\bforce\s*:\s*true/, () => true, 'force: true is banned (Section 9).'],
  ['no-catch-swallow', /\.catch\s*\(\s*(async\s*)?\(\s*\)\s*=>/, () => true, '.catch(() => ...) swallows failures (Section 9).'],
  ['no-explicit-timeout', /\btimeout\s*:\s*\d/, () => true, 'Explicit { timeout } is banned; tune playwright.config.js instead (Section 2).'],
  ['no-class-assertion', /\btoHaveClass\s*\(/, () => true, 'Assert state through ARIA/data-* attributes, not CSS classes (Section 7.1/7.3).'],
  ['no-is-visible-assertion', /expect\(\s*await\s+[^)]*\.isVisible\(\s*\)\s*\)/, () => true, 'Use await expect(locator).toBeVisible() (Section 9).'],
  ['no-only', /\b(test|describe)\.only\s*\(/, () => true, 'Committed .only skips the rest of the suite.'],
  ['no-serial', /\bdescribe\.serial\s*\(|mode\s*:\s*['"]serial['"]/, () => true, 'Serial mode hides shared-state bugs (Section 12).'],
  ['no-nth-in-specs', /\.(first|last|nth)\s*\(|nth=/, (f) => isSpec(f), 'Resolve index/ambiguity in the Page Object, not in the spec (Section 7.3).'],
  ['spec-imports-fixtures', /from\s+['"]@playwright\/test['"]/, (f) => isSpec(f), "Import { test, expect } from fixtures.js (Section 4.6)."],
  ['no-should-title', /\btest\(\s*['"`]should\b/i, () => true, 'Do not start test titles with "should" (Section 2).'],
];

const isSpec = (file) => /[\\/]e2e[\\/](specs|contract)[\\/]/.test(file);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === 'node_modules') return [];
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.js') ? [full] : [];
  });
}

const indonesianRe = new RegExp(`\\b(${INDONESIAN_WORDS.join('|')})\\b`, 'i');

const problems = [];
for (const file of walk(E2E_DIR)) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    // The documented exception: the context-menu probe constant (Section 2).
    const line = rawLine.replace(/MENU_OPEN_PROBE_MS/g, '');
    const isComment = /^\s*(\/\/|\/\*|\*)/.test(line);

    for (const [id, regex, appliesTo, message] of RULES) {
      if (!appliesTo(file)) continue;
      if (isComment && id !== 'no-should-title') continue;
      if (regex.test(line)) problems.push(`${rel}:${index + 1}  [${id}] ${message}`);
    }

    // English-only descriptions and comments (Section 2: Description Language).
    let text = rawLine;
    for (const allowed of UI_STRING_ALLOWLIST) text = text.split(allowed).join('');
    if (indonesianRe.test(text)) {
      problems.push(`${rel}:${index + 1}  [english-only] Indonesian text found: ${rawLine.trim().slice(0, 100)}`);
    }
  });
}

if (problems.length > 0) {
  console.error(`E2E standard check failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log('E2E standard check passed.');

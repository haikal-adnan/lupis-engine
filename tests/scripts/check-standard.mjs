#!/usr/bin/env node
// Pemeriksaan CI statis untuk E2E Testing Standard (Section 13).
// Jalankan dari folder tests/:  node scripts/check-standard.mjs
// - GAGAL bila ada "timeout:" di tests/e2e selain konstanta MENU_OPEN_PROBE_MS
// - GAGAL bila ada waitForTimeout, networkidle, force: true, .catch(() => {}), toHaveClass,
//   isVisible(), atau test('should ...')
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../e2e', import.meta.url));
const RULES = [
  { name: 'explicit timeout option', re: /\btimeout\s*:/, allow: /MENU_OPEN_PROBE_MS/ },
  { name: 'waitForTimeout', re: /waitForTimeout\s*\(/ },
  { name: 'networkidle', re: /networkidle/ },
  { name: 'force: true', re: /force\s*:\s*true/ },
  { name: 'swallowed error (.catch(() => ...))', re: /\.catch\(\s*\(\s*\)\s*=>/ },
  { name: 'CSS class assertion (toHaveClass)', re: /toHaveClass\(/ },
  { name: 'point-in-time isVisible() probe', re: /\.isVisible\(/ },
  { name: "test description starts with 'should'", re: /\btest\(\s*['"`]should\b/ },
  { name: 'partial regex name matching (nodesByText)', re: /nodesByText\(/ },
];

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.js')) yield p;
  }
}

let failures = 0;
for (const file of walk(ROOT)) {
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // abaikan komentar
    for (const r of RULES) {
      if (r.re.test(line) && !(r.allow && r.allow.test(line))) {
        console.error(`${file}:${i + 1}  [${r.name}]  ${line.trim()}`);
        failures++;
      }
    }
  });
}
if (failures) {
  console.error(`\n${failures} pelanggaran standar ditemukan.`);
  process.exit(1);
}
console.log('check-standard: OK');

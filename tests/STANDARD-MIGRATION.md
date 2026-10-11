# Penyesuaian E2E ke Testing Standard

Diverifikasi hanya secara STATIS (sintaks + `node scripts/check-standard.mjs`).
Playwright dan aplikasi tidak bisa dijalankan saat penyesuaian ini dibuat, jadi
jalankan `npx playwright test --project=contract` lalu seluruh suite sebelum merge.

## 1. Yang diubah

| Area | Perubahan | Section |
|---|---|---|
| `playwright.config.js` | `timeout 30s`, `expect.timeout 8s`, `actionTimeout 8s`; `retries` CI 2 -> 1; project `chromium-with-contract` dihapus, `chromium` kini `dependencies: ['contract']`. Args WebGL, baseURL, reporter, workers dipertahankan. Iterasi cepat: `--project=chromium --no-deps` | 13 |
| `AssetPanelPage.upload` | hapus `{ timeout: 10000 }` | 2 |
| `HierarchyPage` | tambah `nodeIds()`, `expectNewNode()`, `addEntity()` (node baru dikunci lewat `data-node-id`); hapus `nodesByText()`; hapus fallback `textContent` di `snapshot()`; hapus `.first()` di `addLayerToSection` | 7.3, 8, 10 |
| Semua spec/flow/contract | `nodesByText(/Empty/i).first()` / `.nth()` diganti `addEntity` / `expectNewNode` / `nodeById` / `nodeByName` | 7.3, 8 |
| `hierarchy-management.spec` | cabang `if (childId && parentId)` dihapus; hitungan nama (`'Hero Sprite'` x2/x3) diganti identitas node; tombol OK dialog eksak; `[Bad Path]` pada test hapus scene | 3.7, 8, 10 |
| `flows/hierarchy` | `EntityCrud.create` lewat `addEntity`; fallback class Tailwind `.bg-accent, .border-b-2` pada tab UI Editor dihapus | 7.1, 7.3 |
| `flows/animator`, `AnimatorPage` | hapus semua `.catch(() => false)` dan `isVisible()`; hapus pembacaan class `bg-primary`; hapus fallback `has-text("Clear")`, `.lucide-play`, dll.; hapus `.first()` pada test ID singleton | 7.3, 9 |
| `animator-management.spec` | `toHaveClass(/bg-.../)` -> `aria-pressed`; fallback `[aria-selected]` dihapus; `.first()` pada hasil search diganti `toHaveCount(2)` | 7.1, 10 |
| `script-management.spec` | `try { confirmAction } catch {}` dihapus | 9 |
| `flows/scripts` | `.catch(() => {})` dan probe `isVisible()` dihapus | 9 |
| `InspectorPage` | `ensure*Component` memakai `_settle()` lalu `count()`; toggle via `setChecked`; tambah `field()` dan `checkbox()` agar spec tidak mengulang `.locator('input').first()` | 2, 9.1 |
| `PrefabPage`, `ScriptPanelPage`, `AssetPanelPage` | `ensureVisible/ensureOpen`: settle dulu, lalu `count()` | 2, 9.1 |
| Contract spec | trigger scene options pakai test ID eksplisit | 11 poin 6 |
| Baru | `eslint.config.js`, `scripts/check-standard.mjs` (cek CI statis) | 13 |

## 2. Perlu perubahan komponen Vue (test akan gagal sampai ini dibuat)

Standar 14.2 #3: perbaiki kontraknya di aplikasi, jangan melonggarkan test.

1. `animator-property-flipx-btn` dan `animator-timeline-play-toggle`: render `aria-pressed="true|false"` (sebelumnya dibaca dari class `bg-primary/20` dan `bg-amber-500`).
2. Tab workspace (Animator dan Inspector spec): atribut `data-tab-id="<entityId>"` harus ada. Tab "UI Editor": beri test ID sendiri lalu ganti selector `[aria-selected="true"]:not([data-testid="hierarchy-node"])` di `flows/hierarchy.js` dan hierarchy spec (ada penanda TODO).
3. Asset panel: `AssetPanelPage.panel` masih memakai class Tailwind `div.relative.h-full.flex.flex-col` (dilarang 7.1). Usul: `data-testid="asset-panel"`.

## 3. Asumsi yang perlu Anda konfirmasi

- `addEntity` mengharapkan TEPAT satu node baru di DOM setelah menu dipilih (termasuk "Add Child": parent harus ter-expand otomatis).
- Setelah **Cut**, node langsung hilang dari tree (test context menu hierarchy).
- Menghapus Script Controller lewat section menu **selalu** memunculkan dialog konfirmasi (sebelumnya try/catch menutupi ketidakpastian ini). Jika aplikasi memang langsung menghapus, hapus baris `confirmAction` itu.
- `.first()` yang dihapus pada test ID singleton (`AnimatorPage`, `PrefabPage.itemByName`) bisa memunculkan error strict mode jika ada ID ganda di DOM. Perbaiki ID gandanya di komponen; jangan tambah `.first()` lagi (14.2 #4).
- Upload asset yang lambat: naikkan `expect.timeout` global, bukan per-call.

## 4. Sengaja TIDAK diubah (butuh PR terpisah dengan contract test)

Helper bersama berubah hanya secara aditif dan harus dijaga contract test (11.1, 11.3). Penyimpangan yang masih ada:

- `PopupHelper.fillPromptAndSubmit/fillPromptAndCancel/confirmAction`: union fuzzy `getByRole('dialog', { name }).or(getByRole('dialog'))` dan fallback `hasText: new RegExp(...)`. Perlu `aria-labelledby` pada dialog agar bisa dikunci per nama.
- `PopupHelper.selectContextMenu`: menutup menu lama dengan Escape (standar 11.2: assert tidak ada menu terbuka), memakai `dispatchEvent('click')`, dan belum ada probe `MENU_OPEN_PROBE_MS`.
- `BaseControlHelper`: fallback `locator('button', { hasText })` pada beberapa method; `clickSelectAction` memakai `getByRole('menu').last()` (Section 11.2 melarang `[role="menu"]` tanpa scope).
- Inspector spec: `getByText(/Restricted|Cannot add components/i)`, `/Custom Shape Inspector|Shape Editor/i`, `/Tile Palette|Tilemap/i`, `/Clip|Properties/i` masih regex parsial; butuh test ID atau teks eksak dari komponen.
- ID inspector lama (`editor-*-section`, `transform-*`, dst.) belum dimigrasi ke 7.4 (standar meminta PR tersendiri).
- `ensureProject` dibiarkan sama dengan contoh Section 5.1.

## 4b. Menjalankan pemeriksaan

```
node scripts/check-standard.mjs         # cek statis (CI)
npx eslint e2e                          # butuh: npm i -D eslint eslint-plugin-playwright
npx playwright test --project=contract
npx playwright test                     # contract dulu, lalu spec fitur
npx playwright test --repeat-each=10    # cek flakiness (Section 14.3)
```

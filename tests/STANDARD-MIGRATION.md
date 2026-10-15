# E2E Testing Standard Alignment

Verification status: **static only**. Syntax of every file was checked and
`node scripts/check-standard.mjs` passes, but Playwright and the application could not be
run while preparing this change. Run contract tests (when helpers change or during urgent testing) and the finalize suite before merging:

```
node scripts/check-standard.mjs                  # static standard check (CI)
npm test                                         # routine feature check (chromium specs only, no contract)
npm run test:all                                 # check all feature specs (chromium + blueprint)
npm run test:contract                            # helper contract tests (on helper changes or urgent testing)
npm run test:finalize                            # finalization: contract + chromium + blueprint projects
npx playwright test --repeat-each=10             # flakiness check (Section 14.3)
```

## 1. What changed in this round

| Area | Change | Section |
|---|---|---|
| Language | Every test title, `describe` name, comment, JSDoc, error message and test-data string is now English. Only real application UI labels stay Indonesian (`Buat Proyek Baru`, `Ganti Nama`, `Simpan`) because they are matched against the app. | 2 |
| Folder layout | `e2e/blueprint/*.spec.js` moved to `e2e/specs/blueprint/` so all feature specs follow the one layout (imports now `../../fixtures.js`). | 4.5 |
| Test titles | Numeric prefixes (`1.`, `2.1`) removed from the blueprint specs; order is not part of a test's identity. | 2, 12 |
| `playwright.config.js` | New `blueprint` project (`timeout 90s`, `expect.timeout 30s`) for the slow WebGL preview specs. `chromium` ignores that folder. This replaces the per-call `{ timeout: 30_000 }` / `{ timeout: 15_000 }` that lived in `PreviewPage`. | 2, 13 |
| `PreviewPage` | Removed both explicit timeouts; rewritten with consistent formatting; grouped into editor-side capture, popup, and diagnostics. | 2 |
| `BlueprintTestRunner` | Split into private stage methods and wrapped in `test.step` (Graph build, Preview boot, Logic evaluation). Failures keep the stage label and the original error as `cause`. Removed the unused `expect` import. | 11, 14.2 |
| `VariablePage`, `flows/variables` | Removed every `.catch(() => {})` and `.catch(async () => ...)`. Native `<select>` / checkbox branches are decided deterministically from the element. Added `setBooleanValue()` (delegates to `BaseControlHelper.selectOption`); the flow and the spec reuse it. Map key `locator('nth=...')` replaced by `.nth()` inside the Page Object. | 9, 11 |
| `variable-management.spec` | Spec no longer repeats locator logic: uses `setBooleanValue`, `openRowMenu`, `fillCollectionMapKey`; no `.first()`, `.nth()`, `.catch()`. | 4.4, 7.3, 9 |
| `NodeInspectorPage` | Added `inputPortRows`, `outputPortRows`, `portRows`, `inputPortIdAt/outputPortIdAt/portIdAt(index)` (`-1` = last) and `portField(portId)`. | 4.4, 7.3 |
| `node-inspector-management.spec`, `node-graph-management.spec` | Replaced every `.first()` / `.nth()` / `.last()` with the accessors above (ESLint `no-nth-methods` is an error in specs). | 7.3 |
| `node-graph-management.spec` | `test.slow()` now has a comment stating why (Section 2). | 2 |
| `PopupHelper.confirmAction` | Button text is regex-escaped before building the fallback `RegExp`. Additive, no caller changes. | 11 |
| New `scripts/check-standard.mjs` | Dependency-free CI check: banned APIs (`waitForTimeout`, `networkidle`, `force`, swallowed `.catch`, explicit `timeout`, `toHaveClass`, `.only`, serial), `.first/.nth` and Playwright imports in specs, `should` titles, and Indonesian text. | 13 |
| `fixtures.js` | Formatting fix, English comments. | - |

## 2. Component contract changes still needed (tests fail until the app provides them)

Standard 14.2 #3: fix the contract in the application, do not loosen the tests.

1. `animator-property-flipx-btn` and `animator-timeline-play-toggle` must render `aria-pressed="true|false"`.
2. Workspace tabs need `data-tab-id="<entityId>"` (Animator and Inspector specs). The "UI Editor" tab needs its own test ID; then replace the `[aria-selected="true"]:not([data-testid="hierarchy-node"])` selector in `flows/hierarchy.js` and the hierarchy spec (TODO markers are in place).
3. Asset panel: `AssetPanelPage.panel` still uses Tailwind classes. Proposal: `data-testid="asset-panel"`.
4. `animator-tree-node` should expose `aria-selected` (TODO in `flows/animator.js`).

## 3. Assumptions to confirm

- `addEntity` expects EXACTLY one new node in the DOM after a menu action (including "Add Child": the parent must expand automatically).
- After **Cut**, the node disappears from the tree right away.
- Deleting a Script Controller from the section menu always shows a confirmation dialog.
- Removing `.first()` on singleton test IDs (`AnimatorPage`, `PrefabPage.itemByName`) can surface strict-mode errors if an ID is duplicated in the DOM. Fix the duplicate ID in the component; do not add `.first()` back.
- Slow asset uploads: raise the global `expect.timeout`, not a per-call one.
- Blueprint specs now run in the `blueprint` project. `npx playwright test --project=chromium` no longer includes them; run `--project=blueprint` (or no `--project`) to execute them.
- `VariablePage.createVariable`: if `variable-modal-expose-checkbox` is a wrapper element it is clicked, if it is a native checkbox it uses `setChecked(true)`. Confirm which one the component renders and keep only that branch.

## 4. Deliberately NOT changed (needs a separate PR with contract tests)

Shared helpers change additively only and must stay guarded by contract tests (11.1, 11.3). Remaining deviations:

- `PopupHelper.fillPromptAndSubmit/fillPromptAndCancel/confirmAction`: fuzzy `getByRole('dialog', { name }).or(getByRole('dialog'))` union and `hasText` fallbacks. Needs `aria-labelledby` on the dialog so it can be pinned by name.
- `PopupHelper.selectContextMenu`: closes a lingering menu with Escape (11.2 says to assert none is open), uses `dispatchEvent('click')`, no `MENU_OPEN_PROBE_MS` probe yet.
- `BaseControlHelper`: `locator('button', { hasText })` fallbacks; `clickSelectAction` uses `getByRole('menu').last()` and `menu.locator('button, li, div', { hasText })` (7.3 / 11.2).
- `VariablePage`: `modal` has a Tailwind-class fallback (`.fixed.inset-0`) and `itemRowByName` combines an `input[value=...]` filter with `data-variable-name` plus `.first()`. Both need the component contract to be confirmed first (`variable-modal`, `data-variable-name` on the row).
- Inspector spec: partial-text regexes (`/Restricted|Cannot add components/i`, `/Tile Palette|Tilemap/i`, ...) need exact text or test IDs from the components.
- Legacy inspector IDs (`editor-*-section`, `transform-*`, ...) are not migrated to 7.4 yet.
- `ensureProject` matches the Section 5.1 example, including the `getByRole('button', { name: /create|new/i })` union and `.first()`.
- `expect.timeout` / `actionTimeout` are `15_000` in the config (the Section 13 baseline is `8_000`). Lower them once uploads and engine boot are verified to be fast enough.

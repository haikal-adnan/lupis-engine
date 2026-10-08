================================================================================
END-TO-END (E2E) TESTING STANDARD
================================================================================

Stack: Playwright + Vue + Tailwind

This standard emphasizes Playwright's built-in features (auto-waiting, web-first
assertions, combined locators, built-in matchers), forbids manual/hardcoded
timeouts, and defines a testability contract between components and tests so the
suite stays fast, stable, and resistant to the failure patterns listed in
Section 14.


--------------------------------------------------------------------------------
1. PURPOSE
--------------------------------------------------------------------------------

End-to-End (E2E) tests verify the visual, functional, and user-facing workflows
of the application from a browser perspective.

Primary focuses include:

- Verifying complete user journeys through UI interactions.
- Validating state persistence and UI reactivity across user operations.
- Ensuring popups, modals, alerts, and context menus render and respond
  correctly.
- Abstracting direct DOM operations through structured Helper classes (Page
  Objects & Control Helpers).
- Leveraging Playwright's native auto-waiting and assertion engines for fast,
  resilient, and non-flaky execution.


--------------------------------------------------------------------------------
2. RULES
--------------------------------------------------------------------------------

E2E tests must follow these rules:

- Focus on User Perspective:
  Interact with the application using visual elements, buttons, inputs, and
  accessible roles (getByRole, getByText, getByLabel) rather than internal
  implementation state. Locator priority is defined in Section 7.

- Native Playwright Mechanics & No Hardcoded Timeouts:

  * Avoid Custom/Hardcoded Timeouts: Do not pass explicit { timeout } options
    into locator calls, assertions, or wait actions (e.g.,
    isVisible({ timeout: 5000 }), waitForURL({ timeout: 20000 })). Allow
    Playwright to use the global configuration defined in playwright.config.js.
    For a genuinely slow test, use test.slow() or test.setTimeout() once at the
    top of that test, with a comment explaining why.

  * Avoid page.waitForTimeout(): Never use artificial sleeps or static waits.

  * Leverage Auto-Waiting: Trust Playwright to automatically wait for elements
    to be actionable (visible, enabled, stable, receives events) before
    executing user actions (click(), fill(), selectOption()).

  * Use Web-First Assertions: Always prefer await expect(locator).toBeVisible(),
    await expect(page).toHaveURL(), or await expect(locator).toHaveText() over
    checking boolean evaluation flags.

  * Non-blocking State Checks: When checking for optional DOM elements (such as
    conditional dialogs or existence checks in helpers), use
    (await locator.count()) === 0 or combine locators instead of
    isVisible({ timeout }) to prevent artificial delay penalties.
    IMPORTANT: count() does not wait. Only use it after the page has settled,
    i.e. after a web-first assertion has confirmed that the page finished
    rendering the relevant area (see ensureProject in Section 5.1). Otherwise a
    still-loading Vue app looks identical to "element does not exist".

  * Locator Union & Filtering: Combine alternative locators using Playwright's
    built-in .or() and .filter() methods instead of manual polling loops or
    complex conditional branches.

- Description Language:
  Use clear English for test.describe() and test() block descriptions.

- Description Style:
  Do not start test() descriptions with "should".

- AAA Pattern:
  Structure test cases clearly using the Arrange-Act-Assert pattern:

  * Arrange: Set up preconditions, navigate to pages, or initialize test
    projects/helpers.
  * Act: Perform UI actions (click, fill, select, open dropdowns).
  * Assert: Verify visible DOM updates, alerts, URL changes, or element states
    using web-first assertions.

- Test Independence:
  Every test must run independently and be fully deterministic without relying
  on execution order or shared run-state. See Section 12.

- Helper Abstraction:
  Abstract common control operations and UI overlays into dedicated helper
  classes (BaseControlHelper, PopupHelper, ProjectHelper). Avoid raw locator
  repetition in spec files. Helpers must follow the contract in Section 11.

- Prefix Bad Paths:
  Prefix negative scenario test cases or validation failures with [Bad Path].

- Project Bypass Pattern:
  Skip redundant login or dashboard setups in feature tests by utilizing
  standard project initialization helpers (e.g., ensureProject) to navigate
  directly to the target environment.


--------------------------------------------------------------------------------
3. MINIMUM TEST REQUIREMENTS
--------------------------------------------------------------------------------

Every E2E test suite for a feature module must cover, at minimum, the following
scenarios:

3.1 Creation & Success Workflows
    Verify that creating a new entity or triggering a primary workflow updates
    the UI reactively and triggers success feedback (e.g., pop alerts or
    toasts).

3.2 Navigation & Active State Switching
    Verify that switching between items updates the active UI state, reflects
    correct control values, and synchronizes selection containers.

3.3 Mutation & Inline Editing
    Verify that modifying existing items (renaming, updating values) updates the
    rendered label and updates state across related UI controls.

3.4 Duplication & Copy Operations
    Verify that clone/duplicate operations produce a new item, assign
    appropriate default naming conventions (such as suffixes), and
    automatically set focus or active selection.

3.5 Deletion & Cleanup
    Verify that removing an item triggers confirmation dialogs, removes the
    target element from the DOM, and gracefully falls back to a default or
    remaining active item.

3.6 [Bad Path] Guard Rules & Boundary Constraints
    Verify that invalid actions (such as attempting to delete the last remaining
    item or submitting empty required fields) are blocked by UI validation
    alerts or disabled controls. Bad-path assertions must follow Section 10.


--------------------------------------------------------------------------------
4. HELPER & CONTROL ARCHITECTURE
--------------------------------------------------------------------------------

E2E tests rely on structured Helper layers to isolate selector logic from test
specifications.

4.1 Control Helpers (BaseControlHelper)

    Wraps common UI component primitives, including:
    - Custom inputs
    - Base selects
    - Scrubbable number fields
    - Color pickers
    - Context menus

    Architecture:
    Spec File -> BaseControlHelper -> Custom UI Component

4.2 Popup & Overlay Helpers (PopupHelper)

    Handles global overlays including:
    - Modal prompts
    - Alert banners
    - Confirmation dialogs
    - Fixed context menus

    Architecture:
    Spec File -> PopupHelper -> Modal / Alert Banners

4.3 Flow Helpers (ProjectHelper / DashboardHelper)

    Handles multi-step navigation routines, workspace provisioning, or page
    setup preconditions using Playwright native APIs before running
    feature-specific tests.

    Architecture:
    beforeEach -> ProjectHelper -> Pre-conditioned Target Page

4.4 Screen Page Objects (e.g. HierarchyPage)

    Complex screens (hierarchy, inspector) are encapsulated in a dedicated Page
    Object that owns locators, actions, and state snapshots. See Section 11.

    Architecture:
    Spec File -> HierarchyPage -> Screen Components


--------------------------------------------------------------------------------
5. TEST & HELPER STRUCTURE EXAMPLES
--------------------------------------------------------------------------------

5.1 Project Helper Pattern (ensureProject)

Demonstrates native locator checks (count()), union locators (.or()), a settle
check before the existence check, and native assertions without explicit
timeouts.

    import { expect } from '@playwright/test';
    import { BaseControlHelper } from '../components/BaseControlHelper.js';

    export async function ensureProject(page, { name, description = '' }) {
      const controls = new BaseControlHelper(page);

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // TODO: replace class-based selector with data-testid="project-card"
      const card = page.locator('.group.bg-card').filter({ hasText: name }).first();

      // Combine dual buttons using native Playwright .or() locator
      const createBtn = page
        .getByRole('button', { name: 'Create First Project' })
        .or(page.locator('button:has-text("New Project"), button:has-text("New")').filter({ visible: true }))
        .first();

      // Settle check: wait until the dashboard rendered EITHER an existing card
      // OR a create button. Without this, count() below can return 0 while the
      // Vue app is still loading, and a duplicate project would be created.
      await expect(card.or(createBtn).first()).toBeVisible();

      // Safe now: the page has settled, so count() reflects the real state
      if ((await card.count()) === 0) {
        await createBtn.click();

        // Web-first assertion relies on global config timeout
        await expect(page.locator('h3', { hasText: 'Buat Proyek Baru' })).toBeVisible();

        await controls.fillInput('Game Keren Saya', name);
        if (description) {
          await controls.fillInput('Deskripsi singkat tentang game Anda...', description);
        }

        await controls.clickButton('Buat');
      } else {
        await card.click();
      }

      // Native Playwright URL assertion with auto-retry
      await expect(page).toHaveURL(/\/editor\/.+/);

      const projectId = page.url().match(/\/editor\/([^/?#]+)/)?.[1];
      return { projectId };
    }

5.2 Feature Spec File

Demonstrates clean test specs adhering to AAA, auto-waiting, and helper
integration.

    import { test, expect } from '@playwright/test';
    import { BaseControlHelper } from './components/BaseControlHelper.js';
    import { PopupHelper } from './components/PopupHelper.js';
    import { ensureProject } from './helpers/dashboard.js';

    test.describe('Feature Management E2E', () => {
      let controls;
      let popup;

      test.beforeEach(async ({ page }, testInfo) => {
        controls = new BaseControlHelper(page);
        popup = new PopupHelper(page);

        // Arrange: unique workspace per test, jump directly into the editor
        await ensureProject(page, {
          name: `E2E ${testInfo.testId}`,
          description: 'Isolated project for browser testing',
        });
      });

      test('creates a new item and updates container reactively', async ({ page }) => {
        // Act: Trigger creation flow via UI
        await page.locator('button[title="Options"]').click();
        await page.locator('button', { hasText: 'New Item' }).click();

        await popup.fillPromptAndSubmit('New Item', 'Item Alpha', 'OK');

        // Assert: Verify alert and reactive text rendering
        await popup.expectPopAlert('Success');
        const container = page.locator('.workspace-container').first();
        await expect(container).toContainText('Item Alpha');
      });

      test('[Bad Path] prevents deletion when boundary limit is reached', async ({ page }) => {
        // Act: Attempt restricted action
        await page.locator('button[title="Options"]').click();
        await page.locator('button', { hasText: 'Delete Item' }).click();

        // Assert: Verify modal warning appears using web-first assertion
        await expect(page.getByRole('heading', { name: 'Cannot Delete' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
      });
    });

5.3 Stable Identity + State Comparison (hierarchy example)

Demonstrates Section 8 (re-locate by ID after a rename) and Section 10
(before/after comparison for a rejected action).

    test('creates a Prefab from an entity', async ({ page }) => {
      const hierarchy = new HierarchyPage(page);
      const popup = new PopupHelper(page);

      // Arrange: capture the stable ID BEFORE the name can change
      await hierarchy.addEntity('World Layer', 'Empty Entity');
      const node = hierarchy.nodeByName('Empty Entity');
      const nodeId = await node.getAttribute('data-node-id');

      // Act: this action renames the node
      await popup.selectContextMenu(node, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');

      // Assert: locate by ID, assert state attribute (not a Tailwind class)
      await expect(hierarchy.nodeById(nodeId)).toHaveAttribute('data-prefab', 'true');
    });

    test('[Bad Path] prevents moving an entity into its own descendant', async ({ page }) => {
      const hierarchy = new HierarchyPage(page);

      // Arrange
      const { parentId, childId } = await hierarchy.createParentWithChild();
      const before = await hierarchy.snapshot();

      // Act: invalid move
      await hierarchy.dragNode(parentId, childId);

      // Assert: structure is unchanged
      await expect.poll(() => hierarchy.snapshot()).toEqual(before);
    });


--------------------------------------------------------------------------------
6. QUALITY CHECKLIST
--------------------------------------------------------------------------------

E2E tests must:

- Interact with the app through UI controls and user-visible roles (getByRole,
  getByText, getByLabel).
- Follow the locator priority in Section 7.1 and never use Tailwind utility
  classes or partial name regex to find or verify elements.
- Encapsulate selector strategies and complex UI flows using helper classes
  (BaseControlHelper, PopupHelper, ProjectHelper, screen Page Objects).
- Eliminate hardcoded/custom { timeout } options and artificial
  page.waitForTimeout() delays.
- Use locator.count() for conditional checks only after the page has settled,
  and .or() / .filter() for alternative element matching.
- Rely on Playwright Web-First Assertions (expect(locator).toBeVisible(),
  expect(page).toHaveURL()) for automatic retries.
- Re-locate elements by stable ID when an action can change their text
  (Section 8).
- Avoid force: true, .catch(() => {}), and .first()/.nth() used to hide
  ambiguity (Section 9).
- Contain at least one assertion that would fail if the feature were broken.
- Compare state before and after in every [Bad Path] test (Section 10).
- Use helpers that assert their own postconditions and scope their locators to
  their container (Section 11).
- Maintain test independence, using a uniquely named workspace per test and not
  relying on state left by previous tests (Section 12).
- Include [Bad Path] coverage for modal validations, minimum boundary limits,
  and restricted user actions.
- Verify user feedback channels such as toast alerts, prompt modals, and state
  switchers.
- Use clean, descriptive English for test suite definitions without starting
  test() cases with "should".
- Pass the lint rules in Section 13 and show no flakiness under
  --repeat-each=10.


--------------------------------------------------------------------------------
7. LOCATOR STRATEGY & TESTABILITY CONTRACT
--------------------------------------------------------------------------------

7.1 Locator Priority

Choose the first option that works:

  1. getByRole / getByLabel / getByPlaceholder
  2. getByText, for static, user-visible text only
  3. getByTestId or data-* attributes, for elements with no accessible role
     (tree nodes, drop zones, icon-only controls)
  4. CSS classes: FORBIDDEN. Tailwind utility classes such as bg-blue-600/20,
     text-sky-400, or opacity-50 describe styling, not behavior.

7.2 Testability Contract for Components

Components that appear in E2E tests must expose identity and state as
attributes.

  Identity (used to FIND an element):
    data-node-id, data-node-name, data-node-type, data-section="world"

  State (used to VERIFY a condition):
    aria-selected, aria-expanded, aria-disabled,
    data-prefab, data-locked, data-visible

Rules:
- Prefer ARIA for state when a standard attribute exists. Use data-* only when
  none does.
- Overlays must use semantic roles:
    role="dialog" with aria-label for modals
    role="menu" / role="menuitem" for context menus
    role="alert" for toasts
  Helpers must locate overlays by role, not by structure such as
  div.fixed.inset-0.
- Naming convention: kebab-case, pattern <component>-<element>
  (e.g. scene-node, layer-menu-button).
- Use stable values (IDs from data), never values derived from render order or
  display text.
- Never expose tokens or personal data in attributes.
- New features ship with the attributes their tests need, in the same change.

7.3 Forbidden Locator Patterns

- Asserting visual state through classes, e.g. toHaveClass(/bg-blue-600/).
  Assert aria-selected="true" instead.
- Partial, case-insensitive name regex to identify a specific node, e.g.
  hasText: /Empty/i. It matches unrelated nodes and breaks when a name changes.
  Use an exact attribute match (data-node-name) or the node ID.
- .first() / .nth() used to silence a strict-mode violation. If a locator
  matches multiple elements, make it more specific. Use .first() only when the
  test intentionally targets "any one of N identical items", and say so in a
  comment.
- Broad selectors such as locator('button, div, span').filter(...). They can
  match a wrapper element instead of the target.


--------------------------------------------------------------------------------
8. STABLE IDENTITY RULE
--------------------------------------------------------------------------------

Playwright locators are lazy: they are re-evaluated on every use. A locator
built from a name or text stops matching the moment that text changes (rename,
prefab creation, status change).

Rule: if an action can change an element's text, capture its stable ID BEFORE
the action and re-locate by ID afterwards.

    // Arrange
    const node = page.getByTestId('scene-node').filter({ hasText: 'Empty Entity' });
    const nodeId = await node.getAttribute('data-node-id');

    // Act (renames the node)
    await popup.selectContextMenu(node, 'Use as Prefab');
    await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');

    // Assert: locate by ID, not by the old name
    const sameNode = page.locator(`[data-node-id="${nodeId}"]`);
    await expect(sameNode).toHaveAttribute('data-prefab', 'true');


--------------------------------------------------------------------------------
9. ACTIONABILITY & FORBIDDEN SHORTCUTS
--------------------------------------------------------------------------------

Forbidden practices and what to use instead:

- click({ force: true })
  Why forbidden: skips actionability checks, so a click can land on the wrong
  element and the test still passes.
  Use instead: fix the real blocker (hover first, scroll, wait for an overlay
  to close).

- .catch(() => {}) on actions or assertions
  Why forbidden: swallows real failures.
  Use instead: let the test fail, or assert the expected state.

- page.waitForTimeout(), waitForLoadState('networkidle')
  Why forbidden: guessing or unreliable.
  Use instead: a web-first assertion on the resulting UI state.

- expect(await x.isVisible()).toBe(true)
  Why forbidden: no auto-retry.
  Use instead: await expect(x).toBeVisible().

- Asserting an element that was already visible before the action
  Why forbidden: passes even if the action did nothing.
  Use instead: assert something that only changes if the action worked.

Exception policy for force: true: allowed only with an inline comment naming the
specific blocker and a linked issue. Any other use fails review.

9.1 Vue + Tailwind Specifics

- Hover-only controls (opacity-0 group-hover:opacity-100): Playwright treats
  opacity: 0 as visible. Always hover() the parent first, then click() without
  force.
- Teleported UI (dropdowns, modals, context menus) lives under body. Locate it
  from page, never from the component container.
- v-show vs v-if: v-show keeps the node in the DOM, so use not.toBeVisible().
  v-if removes it, so use toHaveCount(0).
- Drag and drop with drop zones (top / inside / bottom): dragTo drops at the
  center by default, which maps to "inside". Use targetPosition for the other
  zones, and assert the resulting parent or order, never the drop-indicator
  line.
- Reactivity is async: never read a value and compare it manually. Use
  web-first assertions or expect.poll.


--------------------------------------------------------------------------------
10. ASSERTION STRENGTH RULES
--------------------------------------------------------------------------------

Every test must contain at least one assertion that FAILS if the feature is
broken.

- No vacuous assertions. expect(layers.first()).toBeVisible(), or
  expect(node).toBeVisible() after a rejected action, proves nothing.
- Assert the outcome, not the existence of the element. A reorder test must
  assert the new order. A reparent test must assert the new parent.
- [Bad Path] tests must compare state before and after. A rejected operation
  must leave the structure unchanged:

    const before = await hierarchy.snapshot();   // [{ id, parentId, section, order }]
    await hierarchy.dragNode(parentId, childId); // invalid: move into own descendant
    await expect.poll(() => hierarchy.snapshot()).toEqual(before);

- Where the app shows a rejection message, assert the message AND the unchanged
  state.
- Prefer one behavior per test. A test with 3 acts and 6 asserts hides which
  behavior failed.


--------------------------------------------------------------------------------
11. HELPER CONTRACT
--------------------------------------------------------------------------------

Helpers are shared by many tests, so one wrong assumption fails many tests at
once.

Every helper method must:

  1. Assert its own postcondition. For example addLayer() returns only after the
     new layer is visible in the correct section.
  2. Scope its locators to the relevant container (section, dialog, menu), never
     the whole page, when duplicates are possible.
  3. Match the current UI. When a flow changes in the UI, update the helper in
     the same pull request.
  4. Not hide failures (no force, no catch, no fixed sleeps).
  5. Stay small and single-purpose. Compose small helpers instead of building
     one large method with optional branches.

Fan-out rule: if 2 or more tests fail with the same call stack, fix the helper
first and re-run before touching individual tests.

Page Object for complex screens:

    class HierarchyPage {
      constructor(page) { this.page = page; }
      nodeByName(name) { return this.page.locator(`[data-node-name="${name}"]`).first(); }
      nodeById(id)     { return this.page.locator(`[data-node-id="${id}"]`); }
      section(name)    { return this.page.locator(`[data-section="${name}"]`); }
      async snapshot() { /* evaluateAll: id, parentId, section, order */ }
    }


--------------------------------------------------------------------------------
12. TEST DATA & ISOLATION
--------------------------------------------------------------------------------

- Unique workspace per test. Never share a fixed project name across tests that
  may run in parallel:

    await ensureProject(page, { name: `E2E ${testInfo.testId}`, description: '...' });

- Tests must not assume a default state they did not create or verify (for
  example "exactly one World Layer exists"). Assert the precondition in Arrange,
  or create the data explicitly.
- Prefer Playwright fixtures (test.extend) over beforeEach plus mutable let
  variables, so setup is scoped per test and parallel-safe.
- Setup that is not the subject of the test (project, scene, seed entities)
  should use the fastest reliable path. Use the UI only for the flow being
  tested.
- Parallel execution is the default. Do not use serial mode to hide shared
  state. If tests interfere with each other, fix the isolation.


--------------------------------------------------------------------------------
13. AUTOMATED ENFORCEMENT
--------------------------------------------------------------------------------

Rules that are not enforced by tooling will drift. Add eslint-plugin-playwright
and enable at least:

  - playwright/no-wait-for-timeout
  - playwright/no-force-option
  - playwright/no-networkidle
  - playwright/prefer-web-first-assertions
  - playwright/no-nth-methods
  - playwright/no-conditional-in-test
  - playwright/expect-expect
  - playwright/missing-playwright-await
  - playwright/no-useless-not

Add a CI check that fails on "{ timeout:" inside tests/e2e (outside
playwright.config.js), since this standard bans it.

Recommended playwright.config.js baseline:

    export default defineConfig({
      forbidOnly: !!process.env.CI,
      fullyParallel: true,
      retries: process.env.CI ? 1 : 0,
      timeout: 30_000,
      expect: { timeout: 8_000 },
      use: {
        actionTimeout: 8_000,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    });


--------------------------------------------------------------------------------
14. FAILURE TRIAGE & MAINTENANCE
--------------------------------------------------------------------------------

14.1 Known Failure Patterns (and the section that prevents each)

  - A shared helper assumes a UI flow that no longer exists (e.g. waiting for a
    modal that was removed), failing every test that uses it.
    -> Section 11 (helper contract, fan-out rule)

  - A locator built from a node's name stops matching after the name changes
    (e.g. rename, "Use as Prefab").
    -> Section 8 (stable identity)

  - Assertions on Tailwind classes depend on unrelated state such as selection.
    -> Sections 7.1, 7.2 (state attributes instead of classes)

  - force: true clicks land on a wrapper element, so the test fails or passes
    for the wrong reason.
    -> Section 9 (forbidden shortcuts)

  - Bad-path tests only check that an element is still visible and pass even if
    the guard rule is broken.
    -> Section 10 (before/after comparison)

  - A helper checks existence with count() before the page has finished
    rendering, creating duplicate data.
    -> Section 2 (settle check) and Section 5.1

14.2 When a Test Fails, Classify Before Fixing

  1. Same stack in several tests? Fix the shared helper.
  2. Open the trace (npx playwright show-trace). Check whether the element
     existed, was covered, or had changed text.
  3. App bug or test bug? If the UI behavior is correct per spec, fix the test.
     If not, fix the app. Never loosen an assertion just to make it pass.
  4. Never "fix" a failure by adding a wait, force, or .first(). These hide the
     cause.

14.3 Maintenance Rules

- Any change to a Vue component that E2E tests touch requires running that
  module's E2E suite before merge.
- New features ship with the data-* / ARIA attributes their tests need, in the
  same change.
- Check flakiness before merging a new test:
    npx playwright test <file> --repeat-each=10
  Any intermittent failure blocks the merge.
- Business rules with many combinations (nesting limits, section boundaries,
  sort order) belong in unit or component tests. Keep E2E for critical user
  journeys plus the key bad paths.


--------------------------------------------------------------------------------
CORE PRINCIPLE
--------------------------------------------------------------------------------

E2E tests verify complete user workflows and visual interactions using resilient
helper abstractions, leveraging Playwright's native auto-waiting and web-first
assertions while avoiding explicit timeout overrides and fragile manual polling.
Tests bind to behavior and stable identity (roles, IDs, state attributes), never
to styling or display text, and every assertion must be able to fail when the
feature breaks.
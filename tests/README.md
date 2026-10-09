================================================================================
END-TO-END (E2E) TESTING STANDARD
================================================================================

Stack: Playwright + Vue + Tailwind

This standard emphasizes Playwright's built-in features (auto-waiting, web-first
assertions, combined locators, built-in matchers), forbids manual/hardcoded
timeouts, and defines a testability contract between components and tests so the
suite stays fast, stable, and resistant to the failure patterns listed in
Section 14.

It also defines the project layout, the shared fixtures, and the helper
contract tests (Sections 4.5, 4.6, 11) that keep a change made for one spec from
silently breaking another.


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
- Abstracting direct DOM operations through structured layers (Control Helpers,
  Page Objects, Flows) with a one-way dependency direction (Section 4.5).
- Leveraging Playwright's native auto-waiting and assertion engines for fast,
  resilient, and non-flaky execution.
- Protecting shared helpers with contract tests, so a helper changed for one
  feature cannot break another feature unnoticed (Section 11.3).


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

    The single allowed exception: the context-menu open probe in
    helpers/PopupHelper.js, expressed only through the named constant
    MENU_OPEN_PROBE_MS. It is a short probe that decides whether to fall back to
    a dispatched contextmenu event; it is not a wait for the UI to settle. No
    other explicit timeout is allowed anywhere in tests/e2e.

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
  Abstract common control operations and UI overlays into the dedicated layers
  of Section 4.5 (helpers/, pages/, flows/). Avoid raw locator repetition in
  spec files. Helpers must follow the contract in Section 11.

- Shared Fixtures:
  Spec files import test and expect from the shared fixtures.js (Section 4.6),
  not directly from @playwright/test, and receive helpers, page objects, and the
  isolated project through fixtures instead of beforeEach plus let variables.

- Prefix Bad Paths:
  Prefix negative scenario test cases or validation failures with [Bad Path].

- Project Bypass Pattern:
  Skip redundant login or dashboard setups in feature tests. The auto "project"
  fixture runs ensureProject (flows/dashboard.js) before every test, so each
  test starts inside its own editor workspace. Specs that test the dashboard or
  project creation themselves opt out (Section 4.6).


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

E2E tests rely on structured layers to isolate selector logic from test
specifications.

4.1 Control Helpers (BaseControlHelper)  -> helpers/

    Wraps common UI component primitives, including:
    - Custom inputs
    - Base selects
    - Scrubbable number fields
    - Color pickers
    - Context menus

    Architecture:
    Spec File -> BaseControlHelper -> Custom UI Component

4.2 Popup & Overlay Helpers (PopupHelper)  -> helpers/

    Handles global overlays including:
    - Modal prompts
    - Alert banners
    - Confirmation dialogs
    - Fixed context menus

    Architecture:
    Spec File -> PopupHelper -> Modal / Alert Banners

4.3 Flow Helpers (ensureProject, HierarchyCrudObject)  -> flows/

    Handle multi-step navigation routines, workspace provisioning, or setup
    preconditions using Playwright native APIs before running feature-specific
    tests.

    Architecture:
    project fixture (auto) -> ensureProject -> Pre-conditioned Target Page
    Spec File -> HierarchyCrudObject (setup only) -> Pre-conditioned Entities

4.4 Screen Page Objects (HierarchyPage, AssetPanelPage, DashboardPage)  -> pages/

    Complex screens and panels (hierarchy, assets, dashboard, inspector) are
    each encapsulated in one dedicated Page Object that owns locators, actions,
    and state snapshots. See Section 11.

    Architecture:
    Spec File -> HierarchyPage -> Screen Components

4.5 Folder Structure & Dependency Rules

    tests/
      e2e/
        contract/     Helper contract tests (Section 11.3), project "contract"
        flows/        Multi-step flows: dashboard.js (ensureProject),
                      hierarchy.js (HierarchyCrudObject facade)
        helpers/      Generic controls, no domain knowledge:
                      BaseControlHelper, PopupHelper
        pages/        One Page Object per screen/panel: HierarchyPage,
                      AssetPanelPage, DashboardPage
        specs/        Feature specs (*.spec.js)
        fixtures.js   Shared Playwright fixtures (test.extend), Section 4.6
      fixtures/       Static test data (e.g. files to upload), read-only
      playwright.config.js

    Dependency direction (one way only, never upward):

        spec  ->  fixtures / flows  ->  pages  ->  helpers

    - helpers/ never import pages/ or flows/.
    - pages/ may import helpers/, never flows/ or specs/.
    - flows/ may import pages/ and helpers/.
    - specs/ import from fixtures.js and, when needed, flows/. Contract specs
      import only from fixtures.js.

    Pure specs vs setup facades:
    - A spec that tests feature X is "pure": it drives X through its own Page
      Object and helpers only. It must not use a flow facade for X.
      Example: hierarchy-management.spec.js must not use flows/hierarchy.js.
    - Flow facades exist so that OTHER specs can set up X cheaply.
      Example: asset-management.spec.js uses hierarchyCrud to create the entity
      that an asset is applied to.

    Naming note: fixtures.js (Playwright fixtures) and tests/fixtures/ (data
    files) are different things. Do not put data files in e2e/ or fixture code
    in tests/fixtures/.

    After moving or renaming files, search for stale relative imports before
    running anything, for example:
        Get-ChildItem e2e -Recurse -Filter *.js | Select-String "components/"

4.6 Shared Fixtures (e2e/fixtures.js)

    fixtures.js extends Playwright's test object and is the only place where
    helpers, page objects, and the isolated project are wired together.

      Fixture          Kind    Purpose
      ---------------  ------  ----------------------------------------------
      controls         lazy    BaseControlHelper
      popup            lazy    PopupHelper
      hierarchy        lazy    HierarchyPage (depends on project)
      assets           lazy    AssetPanelPage (depends on project)
      dashboard        lazy    DashboardPage (no project dependency)
      hierarchyCrud    lazy    Flow facade, setup only (depends on project)
      projectOptions   option  { prefix, description } for the project name
      isolatedProject  option  default true; false opts out of project setup
      project          auto    Runs ensureProject before EVERY test, using
                               `${prefix} ${testInfo.testId}` as the name

    Rules:
    - Specs import { test, expect } from '../fixtures.js'.
    - Configure the workspace per spec with test.use({ projectOptions: {...} }).
    - Fixtures that touch the editor UI (hierarchy, assets, hierarchyCrud) must
      list `project` as a dependency, so ordering is guaranteed even when they
      are first used inside test.beforeEach.
    - Specs that test the dashboard or project creation themselves must set
      test.use({ isolatedProject: false }); otherwise the auto project fixture
      would create a project before the test starts and interfere with it.
      Such specs create their own data (UI for the flow under test, ensureProject
      for setup of unrelated steps).
    - New helper, page object, or flow: register it in fixtures.js. Do not
      instantiate it in beforeEach with a mutable let variable.

    Example (non-fixture access is a violation):

        import { test, expect } from '../fixtures.js';

        test('example', async ({ hierarchy, popup }) => { ... });


--------------------------------------------------------------------------------
5. TEST & HELPER STRUCTURE EXAMPLES
--------------------------------------------------------------------------------

5.1 Project Flow Pattern (ensureProject, flows/dashboard.js)

Demonstrates native locator checks (count()), union locators (.or()), a settle
check before the existence check, and native assertions without explicit
timeouts.

    import { expect } from '@playwright/test';
    import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

    export async function ensureProject(page, { name, description = '' }) {
      const controls = new BaseControlHelper(page);

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const card = page.locator(
        `[data-testid="project-card"][data-project-name="${name}"]`
      );

      // Combine dual buttons (empty state and header) using .or()
      const createBtn = page
        .getByTestId('empty-create-project-btn')
        .or(page.getByTestId('create-project-btn'))
        .or(page.getByRole('button', { name: /create|new/i }))
        .first();

      // Settle check: wait until the dashboard rendered EITHER an existing card
      // OR a create button. Without this, count() below can return 0 while the
      // Vue app is still loading, and a duplicate project would be created.
      await expect(card.or(createBtn).first()).toBeVisible();

      // Safe now: the page has settled, so count() reflects the real state
      if ((await card.count()) === 0) {
        await createBtn.click();

        const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
        await expect(modal).toBeVisible();

        await controls.fillInput('project-name-input', name, modal);
        if (description) {
          await controls.fillInput('project-desc-input', description, modal);
        }

        await controls.clickButton('submit-create-project-btn', modal);
      } else {
        await card.click();
      }

      // Native Playwright URL assertion with auto-retry
      await expect(page).toHaveURL(/\/editor\/.+/);

      const projectId = page.url().match(/\/editor\/([^/?#]+)/)?.[1];
      return { projectId };
    }

5.2 Feature Spec File

Demonstrates a clean spec adhering to AAA, auto-waiting, shared fixtures, and
the isolated project. No beforeEach, no let variables.

    import { test, expect } from '../fixtures.js';

    // The auto `project` fixture creates a uniquely named workspace per test.
    test.use({
      projectOptions: {
        prefix: 'Feature E2E',
        description: 'Isolated project for browser testing',
      },
    });

    test.describe('Feature Management E2E', () => {
      test('creates a new item and updates container reactively', async ({ page, popup }) => {
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

    test('creates a Prefab from an entity', async ({ hierarchy, popup }) => {
      // Arrange: capture the stable ID BEFORE the name can change
      const layer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layer, ['Add Entity', 'Empty Entity']);
      const node = hierarchy.nodeByName('Empty Entity');
      const nodeId = await node.getAttribute('data-node-id');

      // Act: this action renames the node
      await popup.selectContextMenu(node, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');

      // Assert: locate by ID, assert state attribute (not a Tailwind class)
      await expect(hierarchy.nodeById(nodeId)).toHaveAttribute('data-prefab', 'true');
    });

    test('[Bad Path] prevents moving an entity into its own descendant', async ({ hierarchy, popup }) => {
      // Arrange
      const layer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layer, ['Add Entity', 'Empty Entity']);
      const parent = hierarchy.nodeByName('Empty Entity');
      await popup.selectContextMenu(parent, ['Add Child', 'Sprite']);
      const child = hierarchy.nodeByName('Sprite');
      const before = await hierarchy.snapshot();

      // Act: invalid move
      await hierarchy.dragAndDropNodes(parent, child);

      // Assert: structure is unchanged
      await expect.poll(() => hierarchy.snapshot()).toEqual(before);
    });

5.4 Spec That Tests the Dashboard Itself

Opts out of the auto project fixture (Section 4.6). The flow under test goes
through the UI; unrelated setup uses ensureProject.

    import { test, expect } from '../fixtures.js';
    import { ensureProject } from '../flows/dashboard.js';

    test.use({ isolatedProject: false });

    test.describe('Project Management E2E', () => {
      test.beforeEach(async ({ dashboard }) => {
        await dashboard.goto();
      });

      test('renames an existing project via context menu', async ({ page, dashboard, popup }, testInfo) => {
        // Arrange: setup, not the subject of this test
        const initialName = `Old Name ${testInfo.testId}`;
        const updatedName = `New Name ${testInfo.testId}`;
        await ensureProject(page, { name: initialName });
        await dashboard.goto();
        const card = dashboard.card(initialName);

        // Act
        await popup.selectContextMenu(card, 'Rename');
        await popup.fillPromptAndSubmit('Rename Project', updatedName, 'Save');

        // Assert
        await expect(dashboard.card(updatedName)).toBeVisible();
        await expect(card).toHaveCount(0);
      });
    });


--------------------------------------------------------------------------------
6. QUALITY CHECKLIST
--------------------------------------------------------------------------------

E2E tests must:

- Interact with the app through UI controls and user-visible roles (getByRole,
  getByText, getByLabel).
- Follow the locator priority in Section 7.1 and never use Tailwind utility
  classes or partial name regex to find or verify elements.
- Encapsulate selector strategies and complex UI flows in the layers of
  Section 4.5 (BaseControlHelper, PopupHelper, flows, screen Page Objects) and
  respect the dependency direction.
- Import test and expect from fixtures.js and receive helpers through fixtures
  (Section 4.6). Specs that test the dashboard or project creation set
  isolatedProject: false.
- Keep pure specs pure: a spec for feature X does not use X's flow facade.
- Eliminate hardcoded/custom { timeout } options and artificial
  page.waitForTimeout() delays. The only exception is MENU_OPEN_PROBE_MS
  (Section 2).
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
- Change shared helper behavior only additively, and keep the helper contract
  tests green (Sections 11.1 and 11.3).
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
    data-node-id, data-node-name, data-node-type, data-section="world",
    data-menu-item (context menu items), data-project-name (project cards)

  State (used to VERIFY a condition):
    aria-selected, aria-expanded, aria-disabled,
    data-prefab, data-locked, data-visible

Rules:
- Prefer ARIA for state when a standard attribute exists. Use data-* only when
  none does.
- Overlays must use semantic roles:
    role="dialog" with aria-label for modals
    role="menu" / role="menuitem" for context menus (every submenu level is
    its own role="menu")
    role="alert" for toasts
  Helpers must locate overlays by role, not by structure such as
  div.fixed.inset-0.
- Context menu items expose data-menu-item="<label>" so helpers can match them
  exactly instead of by partial text.
- Panels that tests operate on (e.g. the asset panel) expose a data-testid
  instead of being found through layout classes.
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
  element and the test still passes, or hides a real overlay/positioning bug.
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
- Context menus are position: fixed. A menu opened near the viewport edge can
  be clipped, and Playwright then retries "element is outside of the viewport"
  until the test times out. This is an app or viewport problem: clamp the menu
  position inside the window, or use an adequate viewport in the config. Never
  fix it with force.
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
    await hierarchy.dragAndDropNodes(parent, child); // invalid: move into own descendant
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

11.1 Additive Change Rule

The behavior of an existing shared helper method is a contract with every spec
that uses it.

- Change a helper by ADDING a method or an optional parameter. Do not alter what
  an existing call does for existing callers.
- If a behavior change is unavoidable, run the whole suite
  (npx playwright test), not only the spec being worked on, before committing.
- A helper changed to satisfy one spec must not be validated by that spec alone.
  This is the source of the "fixed one spec, broke another" failures in
  Section 14.1.

11.2 Pre/Postconditions: Context Menu Helper

PopupHelper.selectContextMenu(target, pathOrLabel) is the reference for how a
helper states its contract:

- Precondition: no context menu is open from a previous action. The helper
  asserts this up front, so a leftover menu fails loudly at its source.
- Action: right-click the target (no force). If the menu does not open within
  the short probe (MENU_OPEN_PROBE_MS), dispatch a contextmenu event WITH the
  target's coordinates, not at (0,0).
- Multi-level paths: after hovering a parent item, assert that the next menu
  level is open (menu count increases) before selecting the next item.
- Item matching: exact via data-menu-item, falling back to the accessible name.
  Never match by partial text or through broad "button, div, span" selectors.
- Postcondition: after the last item is clicked, ALL menu levels are closed.
  Consecutive calls on the same target depend on this.
- An empty path ([]) opens the menu and intentionally leaves it open (used to
  inspect disabled items).

Other overlay helpers follow the same pattern: fillPromptAndSubmit and
confirmAction return only after their dialog is gone.

11.3 Helper Contract Tests (e2e/contract/)

Contract tests verify the behavior of shared helpers themselves, not product
features. They are a separate Playwright project that must pass before any
feature spec runs.

- Location: e2e/contract/*.spec.js, tagged @contract in describe titles.
- Project setup: the "contract" project runs first; the main project
  ("chromium") declares dependencies: ['contract']. If contract fails, feature
  specs are skipped, so a broken helper is visible as one failure in one place
  instead of many failures spread over features. Both projects share the same
  browser configuration.
- Minimum scenarios for the overlay/control helpers:
    * context menu, single level: item selected, menu closed, follow-up prompt
      can be submitted
    * context menu, multi-level: submenu opens, leaf selected, all levels closed
    * two consecutive context-menu calls on the same target
    * empty menu path leaves the menu open
    * prompt: submit and cancel
    * confirm: cancel keeps state, confirm applies the action
    * pop alert (add when a stable, cheap trigger exists)
- Keep scenarios minimal and independent of feature logic. Use the simplest
  stable UI available (e.g. the default World Layer node).
- Every time a helper bug is found, add the scenario that would have caught it.
- Debugging shortcuts:
    npx playwright test --project=contract            (contract only)
    npx playwright test e2e/specs/<file> --no-deps    (skip contract)
  Do not use --no-deps for pre-merge runs.


--------------------------------------------------------------------------------
12. TEST DATA & ISOLATION
--------------------------------------------------------------------------------

- Unique workspace per test. This is provided by the auto "project" fixture
  (Section 4.6), which names the project `${prefix} ${testInfo.testId}`. Never
  share a fixed project name across tests that may run in parallel. When a spec
  creates projects itself (isolatedProject: false), names must include
  testInfo.testId.
- Tests must not assume a default state they did not create or verify (for
  example "exactly one World Layer exists"). Assert the precondition in Arrange,
  or create the data explicitly.
- Use Playwright fixtures (fixtures.js) instead of beforeEach plus mutable let
  variables, so setup is scoped per test and parallel-safe. test.beforeEach is
  acceptable only for stateless steps that use fixtures (e.g.
  assets.ensureOpen(), dashboard.goto()).
- Setup that is not the subject of the test (project, scene, seed entities)
  should use the fastest reliable path (ensureProject, flow facades). Use the UI
  only for the flow being tested.
- Static data files (images, fonts, audio) live in tests/fixtures/ and are
  read-only. Tests upload copies; they never modify or delete the originals.
- Data-file paths currently resolve from process.cwd(). Run Playwright from the
  tests/ directory (and set the same WORKDIR in Docker/CI) so that
  fixtures/assets resolves correctly.
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

Enforce the dependency direction of Section 4.5 with no-restricted-imports, for
example:

  - specs/ and contract/: restrict importing test/expect from
    '@playwright/test' (use '../fixtures.js').
  - helpers/: restrict imports of '../pages/*' and '../flows/*'.
  - pages/: restrict imports of '../flows/*' and '../specs/*'.
  - specs/hierarchy-management.spec.js: restrict '../flows/hierarchy.js'
    (pure spec).

Add a CI check that fails on "timeout:" inside tests/e2e (outside
playwright.config.js), since this standard bans it. The check must ignore the
single documented exception (lines containing MENU_OPEN_PROBE_MS).

Recommended playwright.config.js baseline (project "contract" runs first and
shares the browser configuration with the main project):

    const chromiumUse = {
      ...devices['Desktop Chrome'],
      launchOptions: { args: [ /* same flags for both projects */ ] },
    };

    export default defineConfig({
      testDir: './e2e',
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
      projects: [
        {
          name: 'contract',
          testMatch: /[\\/]contract[\\/].*\.spec\.js$/,
          use: chromiumUse,
        },
        {
          name: 'chromium',
          testIgnore: /[\\/]contract[\\/]/,
          dependencies: ['contract'],
          use: chromiumUse,
        },
      ],
    });


--------------------------------------------------------------------------------
14. FAILURE TRIAGE & MAINTENANCE
--------------------------------------------------------------------------------

14.1 Known Failure Patterns (and the section that prevents each)

  - A shared helper assumes a UI flow that no longer exists (e.g. waiting for a
    modal that was removed), failing every test that uses it.
    -> Section 11 (helper contract, fan-out rule)

  - A helper is changed for one new spec and breaks an older spec that used it
    differently (e.g. the context menu helper changed for the asset specs broke
    hierarchy specs that use multi-level menus).
    -> Sections 11.1 (additive change) and 11.3 (contract tests)

  - A helper does not wait for its own overlay to close, so the next call
    targets the old, still-closing menu.
    -> Section 11.2 (postconditions)

  - A positional role query (getByRole('menu').first()/.nth()) points at the
    wrong menu or leftover popup.
    -> Sections 7.3 and 11.2 (exact match via data-menu-item, precondition)

  - A locator built from a node's name stops matching after the name changes
    (e.g. rename, "Use as Prefab").
    -> Section 8 (stable identity)

  - Assertions on Tailwind classes depend on unrelated state such as selection.
    -> Sections 7.1, 7.2 (state attributes instead of classes)

  - force: true clicks land on a wrapper element, so the test fails or passes
    for the wrong reason; or a clipped context menu makes click() retry
    "outside of the viewport" until the 30 s test timeout.
    -> Sections 9 and 9.1 (forbidden shortcuts, clipped menus)

  - Bad-path tests only check that an element is still visible and pass even if
    the guard rule is broken.
    -> Section 10 (before/after comparison)

  - A helper checks existence with count() before the page has finished
    rendering, creating duplicate data.
    -> Section 2 (settle check) and Section 5.1

  - The auto project fixture creates a project before a spec that tests project
    creation itself, interfering with it.
    -> Section 4.6 (isolatedProject: false)

  - Files were moved but relative imports or data-file paths still point at the
    old location, failing a whole spec at load time or on upload.
    -> Sections 4.5 (search for stale imports) and 12 (data-file paths)

14.2 When a Test Fails, Classify Before Fixing

  0. Run the contract project first (npx playwright test --project=contract).
     If it fails, fix the helper before looking at any feature spec.
  1. Same stack in several tests? Fix the shared helper.
  2. Open the trace (npx playwright show-trace). Check whether the element
     existed, was covered, had changed text, or was outside the viewport.
  3. App bug or test bug? If the UI behavior is correct per spec, fix the test.
     If not, fix the app. Never loosen an assertion just to make it pass.
  4. Never "fix" a failure by adding a wait, force, or .first(). These hide the
     cause.

14.3 Maintenance Rules

- Any change to a Vue component that E2E tests touch requires running that
  module's E2E suite before merge.
- Any change to helpers/, pages/, flows/, or fixtures.js requires running the
  WHOLE suite (contract + all specs) before merge, because these files are
  shared by every spec.
- A failing contract test blocks feature specs by design. Do not bypass it with
  --no-deps in pre-merge runs.
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
feature breaks. Shared helpers are contracts: they change additively, state
their own pre/postconditions, and are guarded by contract tests so that no spec
can break another.
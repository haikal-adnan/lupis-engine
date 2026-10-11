================================================================================
END-TO-END (E2E) TESTING STANDARD
================================================================================

Stack: Playwright + Vue + Tailwind

This standard emphasizes Playwright's built-in features (auto-waiting, web-first
assertions, combined locators, built-in matchers), forbids manual/hardcoded
timeouts, and defines a testability contract between components and tests so the
suite stays fast, stable, and resistant to the failure patterns listed in
Section 14.

It also defines the project layout, shared fixtures, helper contract tests
(Sections 4.5, 4.6, and 11), the test ID naming convention and its change
process (Sections 7.4 - 7.6), and the Engine Bus Monitoring Strategy
(Section 15) that keep a change made for one spec from silently breaking
another.


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
- Keeping test IDs consistent and predictable, so components and tests agree on
  one naming contract (Sections 7.4 - 7.6).
- Capturing and asserting asynchronous Engine Canvas synchronization payloads
  using isolated Event Bus Spies (Section 15).


--------------------------------------------------------------------------------
2. RULES
--------------------------------------------------------------------------------

E2E tests must follow these rules:

- Focus on User Perspective:
  Interact with the application using visual elements, buttons, inputs, and
  accessible roles (getByRole, getByText, getByLabel) rather than internal
  implementation state. Locator priority is defined in Section 7.

- Test ID Contract:
  data-testid values follow the naming convention in Section 7.4. Reusable
  components derive their inner test IDs from a base (Section 7.5). Specs and
  helpers only use test IDs that exist in the component contract; they never
  guess a derived ID. Renaming an ID follows Section 7.6.

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
    complex conditional branches. When encountering identical data-testid
    attributes, ALWAYS scope locators through their parent container.
    A union must never include a fallback that can match a different element
    than the primary locator (Section 7.3).

- Description Language:
  Use clear English for test.describe() and test() block descriptions.

- Description Style:
  Do not start test() descriptions with "should".

- AAA Pattern:
  Structure test cases clearly using the Arrange-Act-Assert pattern:
  * Arrange: Set up preconditions, navigate to pages, or initialize test
    projects/helpers/bus-spies.
  * Act: Perform UI actions (click, fill, select, open dropdowns).
  * Assert: Verify visible DOM updates, alerts, URL changes, element states,
    or event bus payloads using web-first assertions.

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

- Helper Immutability & Last-Resort Rule:
  Shared helpers in helpers/ represent atomic UI components. Changing a helper
  is a last resort. Resolve failures through Page Objects or container scoping
  before considering helper modifications. Changes must follow Section 11.1.

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

3.6 Engine Canvas Event Bus Synchronization
    Verify that updating core transform or engine properties dispatches accurate
    payloads over the event bus (window.bus or window.$bus) to synchronize the
    editor with WebGL (Section 15).

3.7 [Bad Path] Guard Rules & Boundary Constraints
    Verify that invalid actions (such as attempting to delete the last remaining
    item, duplicate script IDs, or submitting empty required fields) are blocked
    by UI validation alerts or disabled controls. Bad-path assertions must follow
    Section 10.


--------------------------------------------------------------------------------
4. HELPER & CONTROL ARCHITECTURE
--------------------------------------------------------------------------------

E2E tests rely on structured layers to isolate selector logic from test
specifications.

4.1 Control Helpers (BaseControlHelper) -> helpers/
    Wraps UI primitives (inputs, selects, scrubbable fields, color pickers, context menus).
    HOLY RULE: Helpers must remain generic, atomic, and strictly devoid of domain logic.
    Pass explicit container locators from Page Objects to eliminate selector collisions.
    Helpers receive test IDs from the caller; they never hardcode the test ID of a
    specific widget as a fallback (Section 11).

4.2 Popup & Overlay Helpers (PopupHelper) -> helpers/
    Handles global overlays (modal prompts, alert banners, confirmation dialogs, context menus).

4.3 Flow Helpers (ensureProject, HierarchyCrudObject) -> flows/
    Handles multi-step setup routines using native Playwright APIs before feature tests run.

4.4 Screen Page Objects (HierarchyPage, AssetPanelPage, etc.) -> pages/
    Encapsulates complex panels/screens. Targets internal inputs (e.g., .locator('input').first())
    when components use custom wrapper divs instead of altering atomic helpers.
    Page Objects resolve panels and sections by test ID through an explicit map
    (e.g. section('World') -> hierarchy-section-world) and THROW on an unknown name,
    instead of falling back to fuzzy role/class/text matching. Multi-step interactions
    on a panel (e.g. openSectionMenu: hover header -> click trigger -> return menu)
    live in the Page Object, not in specs.

4.5 Folder Structure & Dependency Rules

    tests/
      e2e/
        contract/     Helper contract tests, project "contract" (Section 11.3)
        flows/        Multi-step flows: dashboard.js, hierarchy.js
        helpers/      Generic controls: BaseControlHelper, PopupHelper
        pages/        Page Objects: HierarchyPage, AssetPanelPage, DashboardPage, InspectorPage
        specs/        Feature specs (*.spec.js)
        fixtures.js   Shared Playwright fixtures (test.extend), Section 4.6
      fixtures/       Static test data files (read-only)
      playwright.config.js

    Dependency direction (one way only, never upward):
        spec -> fixtures / flows -> pages -> helpers

    - helpers/ never import pages/ or flows/.
    - pages/ may import helpers/, never flows/ or specs/.
    - flows/ may import pages/ and helpers/.
    - specs/ import from fixtures.js and flows/. Contract specs import only from fixtures.js.
    - Pure specs (testing feature X) drive X via its Page Object, not its flow facade.

4.6 Shared Fixtures (e2e/fixtures.js)
    fixtures.js extends Playwright's test object. Specs import { test, expect } from '../fixtures.js'.
    Configured via test.use({ projectOptions: {...} }). Specs testing dashboard or project creation
    set test.use({ isolatedProject: false }).


--------------------------------------------------------------------------------
5. TEST & HELPER STRUCTURE EXAMPLES
--------------------------------------------------------------------------------

5.1 Project Flow Pattern (ensureProject, flows/dashboard.js)

    import { expect } from '@playwright/test';
    import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

    export async function ensureProject(page, { name, description = '' }) {
      const controls = new BaseControlHelper(page);
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const card = page.locator(`[data-testid="project-card"][data-project-name="${name}"]`);

      const createBtn = page
        .getByTestId('empty-create-project-btn')
        .or(page.getByTestId('create-project-btn'))
        .or(page.getByRole('button', { name: /create|new/i }))
        .first();

      await expect(card.or(createBtn).first()).toBeVisible();

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

      await expect(page).toHaveURL(/\/editor\/.+/);
      const projectId = page.url().match(/\/editor\/([^/?#]+)/)?.[1];
      return { projectId };
    }

5.2 Feature Spec File

    import { test, expect } from '../fixtures.js';

    test.use({
      projectOptions: {
        prefix: 'Feature E2E',
        description: 'Isolated project for browser testing',
      },
    });

    test.describe('Feature Management E2E', () => {
      test('creates a new item and updates container reactively', async ({ page, popup }) => {
        await page.locator('button[title="Options"]').click();
        await page.locator('button', { hasText: 'New Item' }).click();
        await popup.fillPromptAndSubmit('New Item', 'Item Alpha', 'OK');

        await popup.expectPopAlert('Success');
        const container = page.locator('.workspace-container').first();
        await expect(container).toContainText('Item Alpha');
      });

      test('[Bad Path] prevents deletion when boundary limit is reached', async ({ page }) => {
        await page.locator('button[title="Options"]').click();
        await page.locator('button', { hasText: 'Delete Item' }).click();

        await expect(page.getByRole('heading', { name: 'Cannot Delete' })).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
      });
    });

5.3 Stable Identity + State Comparison (hierarchy example)

    test('creates a Prefab from an entity', async ({ hierarchy, popup }) => {
      const layer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layer, ['Add Entity', 'Empty Entity']);
      const node = hierarchy.nodeByName('Empty Entity');
      const nodeId = await node.getAttribute('data-node-id');

      await popup.selectContextMenu(node, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');

      await expect(hierarchy.nodeById(nodeId)).toHaveAttribute('data-prefab', 'true');
    });

    test('[Bad Path] prevents moving an entity into its own descendant', async ({ hierarchy, popup }) => {
      const layer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layer, ['Add Entity', 'Empty Entity']);
      const parent = hierarchy.nodeByName('Empty Entity');
      await popup.selectContextMenu(parent, ['Add Child', 'Sprite']);
      const child = hierarchy.nodeByName('Sprite');
      const before = await hierarchy.snapshot();

      await hierarchy.dragAndDropNodes(parent, child);

      await expect.poll(() => hierarchy.snapshot()).toEqual(before);
    });

5.4 Spec That Tests the Dashboard Itself

    import { test, expect } from '../fixtures.js';
    import { ensureProject } from '../flows/dashboard.js';

    test.use({ isolatedProject: false });

    test.describe('Project Management E2E', () => {
      test.beforeEach(async ({ dashboard }) => {
        await dashboard.goto();
      });

      test('renames an existing project via context menu', async ({ page, dashboard, popup }, testInfo) => {
        const initialName = `Old Name ${testInfo.testId}`;
        const updatedName = `New Name ${testInfo.testId}`;
        await ensureProject(page, { name: initialName });
        await dashboard.goto();
        const card = dashboard.card(initialName);

        await popup.selectContextMenu(card, 'Rename');
        await popup.fillPromptAndSubmit('Rename Project', updatedName, 'Save');

        await expect(dashboard.card(updatedName)).toBeVisible();
        await expect(card).toHaveCount(0);
      });
    });

5.5 Section Menu Through a Page Object (derived test IDs)

    // pages/HierarchyPage.js
    const SECTION_IDS = {
      world: 'hierarchy-section-world',
      ui: 'hierarchy-section-ui',
      'user interface': 'hierarchy-section-ui',
    };

    section(name) {
      const id = SECTION_IDS[name.toLowerCase()];
      if (!id) throw new Error(`Unknown section '${name}'`);
      return this.page.getByTestId(id);
    }

    async openSectionMenu(name) {
      const id = SECTION_IDS[name.toLowerCase()];
      const section = this.section(name);
      await section.getByTestId(`${id}-header`).hover();
      await section.getByTestId(`${id}-menu-trigger`).click();
      const menu = this.page.getByTestId(`${id}-menu`);   // may be teleported
      await expect(menu).toBeVisible();
      return menu;
    }

    // spec
    const menu = await hierarchy.openSectionMenu('User Interface');
    await menu.getByTestId('hierarchy-ui-add-layer-button').click();


--------------------------------------------------------------------------------
6. QUALITY CHECKLIST
--------------------------------------------------------------------------------

E2E tests must:

- Interact with the app through UI controls and user-visible roles (getByRole, getByText, getByLabel).
- Follow locator priority (Section 7.1); never use Tailwind utility classes or partial name regex.
- Use test IDs that follow Section 7.4; reusable components derive child IDs from a
  base and never hardcode IDs that repeat per instance (Section 7.5).
- Scope role/state queries ([role="menu"], [role="dialog"], [aria-selected]) whenever
  more than one component can produce that role or state (Section 7.3).
- Encapsulate selector strategies in Section 4.5 layers and respect dependency direction.
- Import test/expect from fixtures.js; use isolatedProject: false when testing creation/dashboard.
- Keep pure specs pure without using setup flow facades for the tested feature.
- Eliminate custom { timeout } options and page.waitForTimeout(). (Exception: MENU_OPEN_PROBE_MS).
- Use count() only after settling; use .or() / .filter() for alternative element matching,
  never with a fallback that can match a different element.
- Rely on Playwright Web-First Assertions for automatic retries.
- Re-locate elements by stable ID when actions change their text (Section 8).
- Avoid force: true, .catch(() => {}), and ambiguity-hiding .first()/.nth() (Section 9).
- Contain at least one assertion that fails if the feature breaks; compare before/after in [Bad Path].
- Use helpers that assert postconditions and scope locators to containers (Section 11).
- Change shared helpers additively and keep contract tests green (Sections 11.1, 11.3).
- Rename test IDs only through the process in Section 7.6.
- Maintain test independence using unique workspace names per test (Section 12).
- Include [Bad Path] coverage for validations, boundary limits, and restricted actions.
- Verify feedback channels (toasts, modals, state switchers) and write clear English descriptions.
- Pass Section 13 lint rules and show zero flakiness under --repeat-each=10.


--------------------------------------------------------------------------------
7. LOCATOR STRATEGY & TESTABILITY CONTRACT
--------------------------------------------------------------------------------

7.1 Locator Priority
  1. getByRole / getByLabel / getByPlaceholder
  2. getByText (static, user-visible text only)
  3. getByTestId or data-* attributes (for elements with no accessible role)
  4. CSS classes: FORBIDDEN for Tailwind utility classes (e.g. bg-blue-600, opacity-50).

7.2 Testability Contract for Components
  Identity attributes: data-node-id, data-node-name, data-node-type, data-section, data-menu-item, data-project-name.
  State attributes: aria-selected, aria-expanded, aria-disabled, data-prefab, data-locked, data-visible.
  Structural hooks: data-element (static, never derived; see Section 7.5).
  Rules: Prefer ARIA for state. Overlays must use semantic roles (role="dialog", role="menu", role="alert").
  Test IDs follow Section 7.4. Use stable IDs, never values derived from render order.

7.3 Forbidden Locator Patterns
  - Visual state via CSS classes (toHaveClass).
  - Partial name regex matching (hasText: /Empty/i). Use exact attributes or IDs.
  - Using .first()/.nth() to bypass strict-mode violations.
  - Broad selectors like locator('button, div, span').filter(...).
  - Fuzzy fallbacks in a union. Examples:
        .or(page.locator('.group\\/node', { hasText: name }))
        .or(section.locator('button'))
    The first can match a different node whose text merely contains the name
    (e.g. "World" matches "World Layer"); the second can click an unrelated
    button and still pass. A Page Object resolves ONE contract (a test ID plus
    identity attributes). If the contract is missing, add it to the component.
  - Unscoped role/state selectors when several components share them:
      * [role="menu"] also matches dropdowns (scene options, section menus), not
        only context menus. Scope to the component's test ID (Section 11.2).
      * [aria-selected="true"] also matches selected hierarchy rows. Asserting an
        "active tab" with the unscoped selector passes vacuously because the
        node you just clicked satisfies it. Exclude the other component:
            page.locator('[aria-selected="true"]:not([data-testid="hierarchy-node"])')
        or, better, give the tab its own test ID.

7.4 Test ID Naming Convention
  Format (lowercase kebab-case):

      <feature>-<area>-<element>[-<kind>]

  feature   Owning panel/module: hierarchy, inspector, assets, dashboard, ...
  area      Sub-region or domain object: scene, world, ui, search, node, tree.
  element   The thing: select, options, add-layer, open-editor, lock, ...
  kind      One of the suffixes below, when it clarifies the element.

  Kind suffixes:
      -button        clickable control
      -input         text/number input (-select for selects, -toggle for switches)
      -menu          dropdown or context menu container
      -tree, -container, -viewport, -content    structural containers
      -empty-state   placeholder shown when a collection is empty
      -header, -root

  Specific rules:
  - Menu actions: <feature>-<area>-action-<verb>
        hierarchy-scene-action-new / -rename / -duplicate / -delete
  - Pairing: an input "<x>-input" pairs with its clear control "<x>-clear-button"
        hierarchy-search-input <-> hierarchy-search-clear-button
    (BaseControlHelper.clearSearch relies on this pairing.)
  - Section scoping: a section root "<feature>-section-<name>" owns its derived
    IDs "-header", "-menu-trigger", "-menu", "-content" (Section 7.5).
  - Singleton IDs are unique on the page at any moment.
  - Collection IDs (rows/items that repeat) share one ID and are told apart by
    identity attributes, not by suffixing an index:
        hierarchy-node        + data-node-id / data-node-name
        context-menu-item     + data-menu-item
  - Never encode state in the ID (no "-active", "-open"); use ARIA/data-* state.
  - Never encode render order or position.

  Legacy: inspector IDs (editor-*-section, object-*, transform-*, physics-*, ...)
  predate this convention. Migrate them as a dedicated change (Section 7.6),
  not mixed into feature work. New inspector IDs follow Section 7.4.

7.5 Test IDs in Reusable Components
  Reusable components (PropertySection, BaseSelect, BaseContextMenu, BaseDropdown,
  ...) are instantiated many times. Their test IDs must not collide.

  a) Derive, do not hardcode. A component that has inner parts takes a base and
     derives from it. PropertySection resolves its base in this order:
         prop testId  >  caller's data-testid attribute  >  'property-section'
     and renders:  <base> (root), <base>-header, <base>-menu-trigger,
                   <base>-menu, <base>-content.

  b) Attribute fallthrough overrides the root ID. A data-testid passed to a
     component replaces the root element's own data-testid. Consequences:
       - Do not pass data-testid to a component whose root already has a
         meaningful ID unless you intend to rename that root. (Example of the
         bug: <SceneTree data-testid="scene-tree"> silently replaced the
         intended root ID, so the original ID never appeared in the DOM.)
       - When a component derives children from a base, pass the base with the
         explicit prop (test-id="hierarchy-section-world"), not with a
         fallthrough attribute, so the intent is visible in the template.

  c) The base may be owned by a wrapper. A feature component can wrap a section
     in its own element that carries the feature test ID while the section
     inside still uses the default base. Example: the Object inspector exposes
     editor-object-section on a wrapper, but the inner PropertySection's
     trigger is property-section-menu-trigger, NOT
     editor-object-section-menu-trigger. Never guess a derived ID. Confirm it
     in the trace/DOM, or pass test-id explicitly in the feature component.

  d) Structural hooks as the safe fallback. When the derived ID is uncertain or
     owned elsewhere, locate by the static structural hook inside a scoped
     container:
         objectSection.locator('[data-element="section-menu-trigger"]').first()
     data-element values are fixed by the component and are not renamed with
     test IDs. They are a test hook only; never style against them. The
     .first() here is justified only because the container may hold several
     sections; scope tighter when possible.

  e) Teleported content (dropdowns, context menus, selects) lives outside its
     trigger's container. Locate it from page, by its own test ID, not from the
     component container.

7.6 Changing or Renaming a Test ID
  A test ID is part of the testability contract. Changing it follows this
  process, in a single PR:

  1. Search every consumer: grep tests/e2e (specs, pages, flows, helpers,
     contract) for the old ID, including IDs built by string templates and IDs
     passed as arguments (clickSelectAction('...'), fillSearch('...')).
  2. Rename the component and ALL consumers together. Do not keep the old ID
     alive through a .or() fallback; it hides future breakage.
  3. For reusable components, also search for derived IDs (the old static
     "section-menu-trigger" style IDs) and update them (Section 7.5).
  4. Put an old -> new mapping table in the PR description.
  5. Run the contract project first, then the full suite (Section 14.3).
  6. Look for assertions that became vacuous because a locator now matches more
     (or less) than before (Section 7.3, aria-selected example).


--------------------------------------------------------------------------------
8. STABLE IDENTITY RULE
--------------------------------------------------------------------------------

Playwright locators re-evaluate on every use. If an action changes an element's text (rename, prefab conversion), capture its stable ID BEFORE the action and re-locate by ID afterwards.

    const node = page.getByTestId('hierarchy-node').filter({ hasText: 'Empty Entity' });
    const nodeId = await node.getAttribute('data-node-id');

    await popup.selectContextMenu(node, 'Use as Prefab');
    await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');

    const sameNode = page.locator(`[data-testid="hierarchy-node"][data-node-id="${nodeId}"]`);
    await expect(sameNode).toHaveAttribute('data-prefab', 'true');


--------------------------------------------------------------------------------
9. ACTIONABILITY & FORBIDDEN SHORTCUTS
--------------------------------------------------------------------------------

- click({ force: true }): Banned. Skips checks and hides overlay bugs. Exception allowed only with inline comment & issue link.
- .catch(() => {}): Banned. Swallows failures.
- page.waitForTimeout(), waitForLoadState('networkidle'): Banned. Use web-first assertions.
- expect(await x.isVisible()).toBe(true): Banned. Use await expect(x).toBeVisible().

9.1 Vue + Tailwind Specifics
- Hover-only controls: hover() parent first, then click() without force.
- Teleported UI: locate from page, not component container.
- Context menus: position: fixed. Clamp position inside window or use adequate viewport; never fix clipping with force.
- v-show vs v-if: v-show uses not.toBeVisible(); v-if uses toHaveCount(0).
- Drag & Drop: default dragTo drops at center ("inside"). Use targetPosition for other zones.
- Async Reactivity: avoid manual value comparison; use web-first assertions or expect.poll.
- Optional elements gated by v-if (e.g. a clear button shown only when the field
  has a value): use (await locator.count()) > 0 after the page settled, then
  assert visibility with expect; do not use a point-in-time isVisible() probe.


--------------------------------------------------------------------------------
10. ASSERTION STRENGTH RULES
--------------------------------------------------------------------------------

- No vacuous assertions (asserting mere visibility after complex operations proves nothing).
- A locator that can match something unrelated makes its assertion vacuous.
  Check that the locator would NOT match before the action under test.
- Assert explicit outcomes (new order after reorder, new parent after reparenting).
- [Bad Path] tests must compare state before and after using snapshot comparisons:

    const before = await hierarchy.snapshot();
    await hierarchy.dragAndDropNodes(parent, child);
    await expect.poll(() => hierarchy.snapshot()).toEqual(before);

- Assert rejection messages alongside unchanged states. Keep one behavior per test.


--------------------------------------------------------------------------------
11. HELPER CONTRACT & IMMUTABILITY
--------------------------------------------------------------------------------

Helper methods must:
  1. Assert their own postcondition.
  2. Scope locators to relevant containers (dialog, menu, section).
  3. Match current UI state.
  4. Avoid hiding failures (no force, catch, or sleeps).
  5. Stay small and single-purpose.
  6. Receive test IDs from the caller. A generic helper never hardcodes the test
     ID of a specific widget as a fallback (e.g. clickSelectAction must not fall
     back to a Scene Options button): a wrong argument would silently click the
     wrong control. Callers pass the ID explicitly:
         clickSelectAction('hierarchy-scene-options-button', 'New Scene')
  7. Document any naming pairing it relies on (clearSearch derives
     "<x>-clear-button" from "<x>-input", Section 7.4).

11.1 Additive Change Rule
  Change helpers by ADDING methods or optional parameters. Never break existing callers. Run the full test suite when modifying shared helpers.

11.2 Pre/Postconditions: Context Menu Helper
  PopupHelper.selectContextMenu states its contract as:
  - Precondition: Asserts no context menu is already open.
  - Action: Right-clicks target; falls back to dispatched event with coordinates if probe fails.
  - Multi-level: Asserts next menu level is open before selecting sub-items.
  - Matching: Exact match via data-menu-item or accessible name.
  - Postcondition: Asserts ALL menu levels are closed after selection.
  - Scope: context menus are located by their own test IDs
    (context-menu for each level, context-menu-item + data-menu-item for items),
    never by [role="menu"]:visible. Dropdowns (scene options, section menus) also
    use role="menu" and would corrupt level counting.
  - Disabled items: selecting a disabled item leaves the menu open, so the
    postcondition does not hold. Tests of disabled items open the menu and
    assert aria-disabled / data-disabled on the item
    (popup.contextMenuItem(label)) instead of calling selectContextMenu.

11.3 Helper Contract Tests (e2e/contract/)
  Dedicated test suite in e2e/contract/*.spec.js tagged @contract. The "contract" project runs before feature specs ("chromium"). A helper failure stops feature specs early, isolating infrastructure breakage.


--------------------------------------------------------------------------------
12. TEST DATA & ISOLATION
--------------------------------------------------------------------------------

- Unique workspace per test: provided by auto project fixture (${prefix}${testInfo.testId}).
- Explicit preconditions: never assume default state; assert or seed required data.
- Fixtures over beforeEach: use fixtures.js to scope setup per test and support parallel runs.
- Speed optimization: use ensureProject or flow facades for non-tested setup steps.
- Static assets: stored in tests/fixtures/ (read-only). Run Playwright from tests/ directory.
- Parallel by default: serial mode is forbidden for hiding shared state bugs.


--------------------------------------------------------------------------------
13. AUTOMATED ENFORCEMENT
--------------------------------------------------------------------------------

Enforce standard via eslint-plugin-playwright rules:
  - playwright/no-wait-for-timeout, no-force-option, no-networkidle
  - playwright/prefer-web-first-assertions, no-nth-methods, no-conditional-in-test
  - playwright/expect-expect, missing-playwright-await, no-useless-not

Enforce dependency direction in Section 4.5 using no-restricted-imports.
CI check must fail on "timeout:" inside tests/e2e (excluding MENU_OPEN_PROBE_MS).

Recommended test ID check (CI script): collect every literal data-testid in
src/**/*.vue (static values and the documented derived patterns), then fail when
a literal getByTestId('...') in tests/e2e references an ID that no longer exists.
Dynamic IDs (template strings) are excluded and covered by Section 7.6 review.
This catches renames that left a consumer behind before the suite runs.

Baseline playwright.config.js setup:

    const chromiumUse = {
      ...devices['Desktop Chrome'],
      launchOptions: { args: [] },
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
        { name: 'contract', testMatch: /[\\/]contract[\\/].*\.spec\.js$/, use: chromiumUse },
        { name: 'chromium', testIgnore: /[\\/]contract[\\/]/, dependencies: ['contract'], use: chromiumUse },
      ],
    });


--------------------------------------------------------------------------------
14. FAILURE TRIAGE & MAINTENANCE
--------------------------------------------------------------------------------

14.1 Known Failure Patterns
  - Outdated helper flow assumptions -> Section 11 (Fan-out rule).
  - Helper modifications breaking older specs -> Sections 11.1 & 11.3.
  - Helper missing overlay close checks -> Section 11.2.
  - Positional role queries targeting wrong menus -> Sections 7.3 & 11.2.
  - Locators breaking on text/name changes -> Section 8.
  - Assertions bound to CSS classes -> Sections 7.1 & 7.2.
  - Force clicks or clipped context menus timing out -> Sections 9 & 9.1.
  - Weak bad-path checks passing on broken rules -> Section 10.
  - Premature count() calls on unrendered pages -> Sections 2 & 5.1.
  - Auto project fixture interfering with dashboard tests -> Section 4.6.
  - Stale relative import paths -> Sections 4.5 & 12.
  - Unpolled engine bus assertions -> Section 15.
  - "element(s) not found" on an ID that looks right: a derived test ID that was
    guessed from the wrong base (wrapper vs inner component) -> Section 7.5(c).
  - A root test ID that never appears in the DOM: overridden by a data-testid
    passed to the component (attribute fallthrough) -> Section 7.5(b).
  - A reusable component's static test ID now missing after a refactor to derived
    IDs (e.g. section-menu-trigger) -> Sections 7.5 & 7.6.
  - An assertion that always passes after a UI change: role/state selector now
    matches another component (e.g. aria-selected on hierarchy rows) -> Sections
    7.3 & 10.
  - Wrong element clicked without an error: fuzzy .or() fallback or a hardcoded
    widget fallback in a helper -> Sections 7.3 & 11.
  - Menu level counts off by one: [role="menu"] matching dropdowns as well as
    context menus -> Section 11.2.

14.2 Classification Rules
  0. Run contract project first (npx playwright test --project=contract).
  1. Same stack across tests? Fix shared helper.
  2. Inspect trace logs (npx playwright show-trace).
  3. App bug vs test bug: fix app if UI is incorrect; never loosen assertions.
  4. Never add sleeps, force options, or .first() to patch test failures.
  5. "Not found" on a test ID: inspect the real DOM in the trace and compare with
     the component source before editing the spec. Fix the contract
     (Section 7.5/7.6), do not stack another fallback.

14.3 Maintenance Rules
  - Run module E2E suite on Vue component updates.
  - Run full suite (contract + specs) on helper, page, flow, or fixture changes.
  - Ensure new features ship with required data-* / ARIA attributes in the same PR.
  - Test ID renames follow Section 7.6 and are never split across PRs.
  - Check flakiness pre-merge using --repeat-each=10.


--------------------------------------------------------------------------------
15. ENGINE CANVAS EVENT BUS MONITORING (SPY BUS PATTERN)
--------------------------------------------------------------------------------

15.1 Context & Requirement
The editor interacts with WebGL via an async Event Bus (window.bus / window.$bus). Tests monitor payloads without heavy canvas visual diffing.

15.2 Implementation Pattern
Install an isolated Bus Spy in test setup after UI settles, without explicit timeout overrides or swallowed errors:

    async function installBusSpy(page) {
      await page.evaluate(() => {
        if (window.__capturedEngineEvents) return;
        window.__capturedEngineEvents = [];

        const targetBus = window.bus || window.$bus;
        if (!targetBus) throw new Error('Engine event bus is not available');

        const originalEmit = targetBus.emit.bind(targetBus);
        targetBus.emit = (event, ...args) => {
          if (
            event === 'editor:entity:update-component' ||
            event === 'editor:layer:update'
          ) {
            window.__capturedEngineEvents.push(
              JSON.parse(JSON.stringify(args[0]))
            );
          }
          return originalEmit(event, ...args);
        };
      });
    }

15.3 Verification Standard
Use expect.poll web-first assertions to verify async bus events:

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          componentName: 'Transform',
          path: 'x',
          value: 250.75,
        }),
      ])
    );

15.4 Bus Spy Isolation Rules
  - Install spy per test; clear prior captured events before running actions.
  - Capture only relevant events and preserve original emit behavior.
  - Assert specific payload fields instead of generic emission events.
  - No timeout overrides or swallowed errors during spy installation.


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
can break another. Test IDs are contracts too: they follow one naming
convention, reusable components derive them from a base instead of hardcoding
them, and they change only together with every consumer. Asynchronous Engine
Canvas synchronization is validated through isolated, pollable Event Bus Spies.
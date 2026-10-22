# Writing a New Blueprint Test

This guide explains how to add a runtime test for a visual-script (Blueprint) node, based on the
existing specs in `e2e/specs/blueprint/`. It follows the E2E Testing Standard in `README.md`.

## 1. How a blueprint test works

A blueprint test is **declarative**. The spec describes a scenario (variables, nodes, connections and the
log the engine must print). `BlueprintTestRunner` (`e2e/flows/blueprint.js`) executes it:

| Step | What the runner does | Stage label in errors |
|---|---|---|
| 1. Build graph | Opens the entity's script graph, creates variables, spawns nodes, configures the Inspector, binds variables, connects edges, saves | `GRAPH CONFIG ERROR` |
| 2. Boot preview | Starts log capture, clicks Play, waits for the preview popup and the engine to be ready | `PREVIEW BOOT ERROR` |
| 3. Evaluate logic | Waits (with `expect.poll`) until the engine log `expectedLog` from `expectedSource` is received by the editor | `LOGIC VALUE ERROR` |

The runner always closes the preview popup, even when an assertion fails. The preview is only verified by
the data it sends back (engine logs and scene payload), not tested any deeper.

Every blueprint test therefore ends the same way: a `uiNotification` node prints a known message and the
spec expects that message.

## 2. Where things live

```
e2e/
├── specs/blueprint/        <- specs live here (blueprint-low-level.spec.js, blueprint-mid-level.spec.js, blueprint-high-level.spec.js)
├── flows/blueprint.js      <- BlueprintTestRunner (scenario executor)
├── flows/nodeGraph.js      <- NodeGraphCrudObject: openGraphForEntity, spawnDirect, connectDirect
├── flows/nodeInspector.js  <- NodeInspectorCrudObject: ports, values, modifiers
├── flows/variables.js      <- VariableCrudObject: createVariable, updateRawJson
├── pages/PreviewPage.js    <- log capture, popup, expectLog
└── fixtures.js             <- exposes `blueprintRunner` (already wired)
```

Blueprint specs run in the dedicated Playwright project `blueprint` (larger timeouts for the WebGL boot).
You do not configure any timeout in the spec.

## 3. Minimal template

```js
import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint <Topic> E2E',
    description: 'E2E runtime logic evaluation for <topic> nodes in engine preview',
  },
});

test.describe('Blueprint <Topic> E2E Testing', () => {
  test('<verb in present tense> <node> <expected behavior>', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: '<Short Label>',
      entityName: '<Topic>Entity1',
      scriptName: '<Topic>Script1',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: '<Topic> works', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: '<Topic> works',
    });
  });
});
```

Import only `test` from `../../fixtures.js` (never from `@playwright/test`). Each test gets its own isolated
project through the automatic fixture, so tests are independent and can run in parallel.

## 4. Scenario reference (`runTest` options)

| Field | Required | Description |
|---|---|---|
| `testName` | yes | Label used in step titles and error messages |
| `entityName`, `scriptName` | no | Defaults `TestEntity` / `TestScript`. Use a unique, readable name per test |
| `variables` | no | `[{ name, type, value, isExposed, scope, rawJson }]` |
| `nodes` | yes | `[{ id, type, label, pos, dynamicInputs, dynamicOutputs, topLevelData, inspectorValues }]` |
| `variableBindings` | no | `[{ nodeId, portId, varName, modifier }]` |
| `connections` | yes | `[{ source, sourceHandle, target, targetHandle, modifier }]` |
| `expectedLog` | yes | Exact message the engine must log |
| `expectedSource` | no | Log source, default `'Notification'` |

### Variables
- `type`: `string`, `number`, `boolean`, `list`, `map`.
- Primitives use `value`. Collections use `rawJson` (applied through the Raw JSON editor), e.g.
  `{ name: 'fruitList', type: 'list', rawJson: ['Apple', 'Banana'] }`.
- `scope` defaults to `'Local'`; use `'Global'` for project variables. `isExposed: true` shows it in the panel.

### Nodes
- `id` is **your** scenario key (used by `variableBindings` and `connections`). The runner maps it to the real node ID.
- `type` is the node type from the node library (`eventGameStart`, `variableGet`, `logicAnd`, `uiNotification`, ...).
- `pos` is only layout. Keep nodes about 250px apart so nothing overlaps.
- `inspectorValues`: `{ <portId>: { value, type } }` where `type` is `string`, `number`, `boolean`, or
  `select` (dropdown, value is the visible option text, e.g. `'Equal (==)'`).
- `dynamicInputs` / `dynamicOutputs`: arrays of property names added from the Inspector dropdown
  (e.g. `dynamicOutputs: ['Position X']` on `getTransform`, `dynamicInputs: ['Name', 'Tag']` on `setObject`).
- `topLevelData`: node-level fields, `{ key: value }` or `{ key: { value, type: 'number' } }`.

### Variable bindings
- Without `portId`: selects the variable on a **Variable Get/Set node** (`{ nodeId: 'var1', varName: 'score' }`).
- With `portId`: switches that input port to Variable mode and binds it
  (`{ nodeId: 'math', portId: 'a', varName: 'score', modifier: { label: 'Add', value: 5 } }`).

### Connections
- `sourceHandle` / `targetHandle` are port IDs. They differ per node (`execOut`, `out`, `execIn`,
  `v0`, `result`, `message`, ...). Copy them from an existing spec that uses the same node, or read them from
  the node definition. A wrong handle fails in the graph step with a clear error.
- Optional edge `modifier`: `{ operation: '<label>', value, isNumber }` applied in the Edge Inspector.

> `topLevelData`, port-level `modifier` and edge `modifier` are supported by the runner but are not used by
> the current specs. Run such a scenario once and confirm the labels before relying on it.

## 5. Step-by-step: adding a test for a new node

1. **Pick the tier spec based on the 3-Tier Testing Pyramid (`docs/visual-scripting.md`):**
   - `blueprint-low-level.spec.js` (Tier 3: Low-Level / Atomic & Primitive Nodes — direct engine subsystem facades: entity lifecycle, transform, physics, solid collision, layer)
   - `blueprint-mid-level.spec.js` (Tier 2: Mid-Level / Logic & Utility Nodes — pure math, distance, compare/branch, strings, lists, maps, path navigation, loops)
   - `blueprint-high-level.spec.js` (Tier 1: High-Level Nodes — plug-and-play controllers and customizable gameplay templates: `platformerController`, `topDownController`, `volumeSliderManager`, `collectableItem`, `platformerCombat`, `enemyChaser`)
2. **Find a similar existing test** and copy it as a template.
3. **Design the smallest graph** that proves one behavior: `eventGameStart` -> (your node) -> `uiNotification`.
4. **Make the result observable.** The message printed by `uiNotification` must depend on the behavior under
   test. Either connect the value into the message port (`variableGet` -> `message`) or gate the notification behind a
   `branch` so it only prints when the condition is met.
5. **Choose a unique `expectedLog`.** A static message must not be reachable through any other path.
   For branch tests, use different messages per path (`'Greater Success'` vs `'False Branch Executed'`).
6. **Run it alone**, then repeat to check for flakiness:
   ```
   npx playwright test e2e/specs/blueprint/blueprint-mid-level.spec.js -g "your test title"
   npx playwright test e2e/specs/blueprint/blueprint-mid-level.spec.js -g "your test title" --repeat-each=10
   ```
7. **Run the standard check** before committing: `node scripts/check-standard.mjs`.

## 6. Naming conventions

- Test title: present tense, no `should`, no numbering. Example: `evaluates logicAnd with two boolean variables (true AND true)`.
- `[Bad Path]` prefix for tests that expect rejection or the false branch.
- `describe` name: `Blueprint <Topic> E2E Testing`.
- `testName`: short label, shown in step titles and errors (`Boolean AND Test`).
- `entityName` / `scriptName`: unique per test inside a file so reports are easy to read.
- Messages and comments are English. No Indonesian text in titles, comments or test data.

## 7. Rules that keep blueprint tests stable

- **No explicit timeouts and no sleeps** (`{ timeout }`, `waitForTimeout`). Slow boot is handled by the `blueprint` project.
- **One behavior per test.** Do not chain unrelated assertions in one graph.
- **Do not depend on test order or shared state.** Every test builds its own project, entity and script.
- **Never loosen an expectation to make a test pass.** If the log is wrong, the node, the graph or the engine is wrong.
- **Assert the exact message.** Avoid regexes or "contains" for `expectedLog`.
- **No `.first()`, `.nth()`, `.catch()` or `if` in a spec.** If you need a new interaction, add it to a flow or page object.
- **Use the contract, not selectors.** If an element has no test ID, add one in the component instead of using CSS classes.

## 8. Extending the runner (new kind of setup)

If a node needs configuration the scenario schema cannot express:

1. Add the low-level interaction to the page object (`pages/NodeInspectorPage.js` or `pages/NodeGraphPage.js`)
   with a postcondition (`await expect(...)`).
2. Expose it in the flow (`flows/nodeInspector.js` or `flows/nodeGraph.js`) as a small, reusable method.
3. Call it from the matching private method of `BlueprintTestRunner` (`#createVariables`, `#spawnNodes`,
   `#bindVariables`, `#connectEdges`) behind a new optional scenario field. Existing specs must keep working unchanged.
4. Document the field in section 4 of this guide and cover it with one new spec.

## 9. Debugging a failing blueprint test

| Symptom | Likely cause | What to check |
|---|---|---|
| `GRAPH CONFIG ERROR` mentioning a port or handle | Wrong `portId` / `sourceHandle` / `targetHandle` | Copy the IDs from the node definition or a spec using the same node |
| `GRAPH CONFIG ERROR` on a select/dropdown | Option text differs from the UI | `value` for `select` must match the visible option text exactly |
| `PREVIEW BOOT ERROR` | Preview popup blocked or engine failed to boot | Open the trace; use `previewPage.collectPopupErrors(popup)` while debugging |
| `LOGIC VALUE ERROR` (log never arrives) | Graph is built but logic does not reach the notification | Check the execution chain (`execOut` / `execIn` edges), variable bindings and the branch condition; use `previewPage.dumpRuntimeState(popup)` to inspect compiled nodes and edges |
| Wrong value in the log | Variable not bound, wrong default value or wrong node parameter | Verify `variableBindings` and `inspectorValues` |

Use the HTML report (`npx playwright show-report`): each of the three stages is a separate step, and the
original error is attached as the `cause` of the stage error.

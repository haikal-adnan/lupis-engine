import { test, expect } from '../fixtures.js';

/**
 * CONTRACT TESTS for the shared helpers (PopupHelper, BaseControlHelper).
 *
 * Purpose: if a helper changes and breaks its basic behavior, the failure shows up HERE
 * (project "contract") instead of being scattered across feature specs. Feature specs only run
 * when this project passes.
 *
 * Rule: only test helper behavior (menu, prompt, confirm), never feature logic.
 * Keep scenarios as simple as possible and add a new scenario every time
 * a helper bug is discovered.
 */
const SCENE_OPTIONS = 'hierarchy-scene-options-button';

test.use({
  projectOptions: {
    prefix: 'Contract E2E',
    description: 'Isolated workspace for helper contract tests',
  },
});

test.describe('@contract PopupHelper.selectContextMenu', () => {
  test('single-level menu: item is selected, menu closes, next prompt can be submitted', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');
    await expect(layer).toBeVisible();
    const nodeId = await layer.getAttribute('data-node-id');

    await popup.selectContextMenu(layer, 'Rename Layer');
    await expect(popup.activeMenus).toHaveCount(0);

    await popup.fillPromptAndSubmit('Rename Layer', 'Contract Layer', 'Rename');
    await expect(hierarchy.nodeById(nodeId)).toHaveAttribute('data-node-name', /Contract[ _]Layer/);
  });

  test('nested menu: submenu opens, leaf item is selected, all levels close', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    // addEntity locks the new node by data-node-id; the menu postcondition is checked afterwards
    const created = await hierarchy.addEntity(popup, layer, ['Add Entity', 'Empty Entity']);
    await expect(popup.activeMenus).toHaveCount(0);
    await expect(created).toBeVisible();
  });

  test('two consecutive calls on the same node do not interfere with each other', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    const first = await hierarchy.addEntity(popup, layer, ['Add Entity', 'Empty Entity']);
    const second = await hierarchy.addEntity(popup, layer, ['Add Entity', 'Sprite']);

    // Two distinct nodes, and both still exist
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    await expect(first).not.toHaveAttribute('data-node-id', await second.getAttribute('data-node-id'));
  });

  test('empty path opens the menu and leaves it open', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, []);

    await expect(popup.activeMenus).toHaveCount(1);
    await expect(popup.activeMenus).toBeVisible();
  });
});

test.describe('@contract PopupHelper prompt & confirm', () => {
  test('fillPromptAndCancel closes the dialog without side effects', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, 'Rename Layer');
    await popup.fillPromptAndCancel('Rename Layer');

    await expect(hierarchy.nodeByName('World Layer')).toBeVisible();
  });

  test('confirmAction: cancel keeps the state, confirm applies the action', async ({ popup, hierarchy, controls }) => {
    await hierarchy.createScene(controls, popup, 'Contract Scene');

    // Section 11 point 6: the caller passes the trigger test ID explicitly
    await controls.clickSelectAction(SCENE_OPTIONS, 'Delete Scene');
    await popup.confirmAction(/scene/i, { action: 'cancel' });
    await expect(hierarchy.sceneSelect).toContainText(/Contract[ _]Scene/);

    await controls.clickSelectAction(SCENE_OPTIONS, 'Delete Scene');
    await popup.confirmAction(/scene/i, { action: 'confirm' });
    await expect(hierarchy.sceneSelect).not.toContainText('Contract_Scene');
  });
});

test.describe('@contract BaseControlHelper.clickSelectAction', () => {
  // Regression test for a past bug: clickSelectAction used to carry a hardcoded
  // `.or(scope.getByTestId('scene-options-button'))` fallback inside its trigger
  // locator. For a generic helper that is wrong: when the requested label/test ID
  // did not exist, it silently fell back to the Scene Options button (if it happened
  // to be in scope) and the test passed while clicking the wrong element.
  //
  // This test guarantees that a trigger that does NOT exist in scope makes the call
  // FAIL loudly instead of silently falling back to some other button.
  test('[Bad Path] trigger with a test ID that is not in scope must fail instead of falling back to another button', async ({ page, controls, hierarchy }) => {
    // The Scene Options button does exist on the page (outside the layer section scope),
    // which makes this the most representative scenario for the old bug above.
    await expect(hierarchy.sceneSelect).toBeVisible();

    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    // 'Nonexistent Trigger Label' intentionally matches nothing inside the worldLayer
    // scope. Before the fix, Playwright could fall through to the Scene Options button
    // outside this scope and open its menu instead of failing. The scope is limited to
    // worldLayer so this assertion really tests scope isolation, not just a wrong label.
    await expect(
      controls.clickSelectAction('Nonexistent Trigger Label', 'Some Action', worldLayer)
    ).rejects.toThrow();

    // The Scene Options menu must NOT open as a side effect of a wrong fallback.
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

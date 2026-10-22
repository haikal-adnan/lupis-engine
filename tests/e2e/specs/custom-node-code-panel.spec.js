// lokasi: tests/e2e/specs/custom-node-code-panel.spec.js
import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Custom Node & Code Panel E2E',
    description: 'Comprehensive test suite for creating Custom Nodes, configuring roles/ports, and editing logic via the Code Panel',
  },
});

test.describe('Custom Node & Code Panel E2E Testing Suite', () => {
  test.beforeEach(async ({ nodeGraphCrud }) => {
    await nodeGraphCrud.openGraphForEntity({
      entityName: 'CustomNodeTestEntity',
      scriptName: 'CustomNodeMainScript',
    });
  });

  // =========================================================================
  // 1. CREATE CUSTOM NODE VIA LIBRARY, CONFIGURE ROLES & PORTS
  // =========================================================================
  test('creates a custom node directly from library, updates role, renames and manages custom ports', async ({
    nodeGraph,
    nodeLibrary,
    nodeInspector,
  }) => {
    // 1. Add Custom Node via library button
    await nodeLibrary.addCustomNodeViaLibrary();

    const customNodes = nodeGraph.nodesByType('customScript');
    await expect(customNodes).toHaveCount(1);

    const customNode = customNodes.first();
    const nodeId = await customNode.getAttribute('data-node-id');
    await nodeGraph.selectNodeById(nodeId);

    // 2. Verify Custom Badge and initial properties in inspector
    await expect(nodeInspector.customBadge).toBeVisible();
    await expect(nodeInspector.titleInput).toHaveValue('Custom Node');

    // 3. Customize Header
    await nodeInspector.setHeaderTitle('Player Velocity Calculator');
    await nodeInspector.setHeaderColor('#8B5CF6');
    await nodeInspector.setHeaderDescription('Calculates player velocity vector with custom script');
    await expect(nodeInspector.titleInput).toHaveValue('Player Velocity Calculator');

    // 4. Test Role Switching (Action -> Pure -> Action)
    // Pure role should eliminate execution ports (execIn, execOut)
    await nodeInspector.setNodeRole('pure');
    await expect(nodeInspector.inputPortRowById('execIn')).toHaveCount(0);
    await expect(nodeInspector.outputPortRowById('execOut')).toHaveCount(0);

    // Switch back to Action role (should restore execIn and execOut)
    await nodeInspector.setNodeRole('action');
    await expect(nodeInspector.inputPortRowById('execIn')).toBeVisible();
    await expect(nodeInspector.outputPortRowById('execOut')).toBeVisible();

    // 5. Add Custom Dynamic Ports
    await nodeInspector.addDynamicInputPort();
    const addedPortId = await nodeInspector.inputPortIdAt(-1);
    await expect(addedPortId).toBeTruthy();

    // Rename the port to speedMultiplier
    await nodeInspector.renameInputPort(addedPortId, 'speedMultiplier');
    await expect(
      nodeInspector.inputPortRowById('speedMultiplier').getByTestId('node-inspector-input-port-label-input')
    ).toHaveValue('speedMultiplier');

    // Change Data Type via port menu dropdown
    await nodeInspector.changePortDataType('speedMultiplier', 'number', 'input');
    await expect(
      nodeInspector.inputPortRowById('speedMultiplier')
    ).toContainText('number');

    // Remove the custom port
    const initialCount = await nodeInspector.inputPortRows.count();
    await nodeInspector.removeInputPort('speedMultiplier');
    await expect(nodeInspector.inputPortRows).toHaveCount(initialCount - 1);
  });

  // =========================================================================
  // 2. CODE PANEL EDITING, SYNTAX VALIDATION & RESET CODE
  // =========================================================================
  test('opens Code Panel for custom node, edits script with syntax validation, and resets code', async ({
    nodeGraph,
    nodeLibrary,
    nodeInspector,
    codePanel,
  }) => {
    // 1. Create Custom Node
    await nodeLibrary.addCustomNodeViaLibrary();
    const customNode = nodeGraph.nodesByType('customScript').first();
    const nodeId = await customNode.getAttribute('data-node-id');
    await nodeGraph.selectNodeById(nodeId);

    // 2. Open Code Editor from Inspector Header Menu
    await nodeInspector.openCodePanelFromHeader();

    // 3. Verify Code Panel is open and displays correct indicators
    await codePanel.ensureReady();
    await expect(codePanel.bottomNodeTitle).toContainText('Custom Node');
    await expect(codePanel.customIndicator).toBeVisible();
    await expect(codePanel.statusSynced).toBeVisible();
    await expect(codePanel.statusWarnings).toBeVisible();

    // 4. Verify real-time syntax error validation on invalid code
    const brokenCode = 'function invalid() {\n  const x =\n';
    await codePanel.setCode(brokenCode);
    await expect(codePanel.statusSyntaxError).toBeVisible();

    // 5. Edit logic code setting outputs.execOut, resolving all issues
    const validLogic =
      '// Custom execution logic\n' +
      'outputs.execOut = true;\n' +
      'return;\n';

    await codePanel.setCode(validLogic);
    await expect(codePanel.statusNoIssues).toBeVisible();

    // 6. Reset Code to template
    await codePanel.resetCode();
    await expect(codePanel.textarea).toHaveValue(/return;/);
    await expect(codePanel.statusWarnings).toBeVisible();

    // 7. Close Code Tab and return to graph canvas
    await codePanel.closeCodeTab();
    await expect(nodeGraph.canvas).toBeVisible();
  });

  // =========================================================================
  // 3. CONVERT SYSTEM NODE TO CUSTOM NODE & UNLOCK IN CODE PANEL
  // =========================================================================
  test('converts system node to custom node, unlocks code editing, and reverts to preset', async ({
    nodeGraph,
    nodeInspector,
    codePanel,
  }) => {
    // 1. Spawn a system math node
    const nodeId = await nodeGraph.spawnNodeViaStore('mathMultiply', 'Multiply', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    // Verify system node is not custom initially
    await expect(nodeInspector.customBadge).toHaveCount(0);

    // 2. Double click node on graph to open Code Editor
    const nodeEl = nodeGraph.nodeById(nodeId);
    await nodeEl.dblclick();

    // Verify Code Panel indicates read-only system node
    await codePanel.ensureReady();
    await expect(codePanel.systemIndicator).toBeVisible();
    await expect(codePanel.textarea).toHaveAttribute('readonly', '');

    // 3. Click Unlock in CodePanel to convert node to Custom Node
    await codePanel.unlockToCustom();
    await expect(codePanel.customIndicator).toBeVisible();
    await expect(codePanel.textarea).not.toHaveAttribute('readonly', '');

    // Close Code Editor tab
    await codePanel.closeCodeTab();

    // 4. In Inspector, verify node now has Custom Badge
    await nodeGraph.selectNodeById(nodeId);
    await expect(nodeInspector.customBadge).toBeVisible();

    // 5. Revert back to preset blueprint
    await nodeInspector.revertToPreset();
    await expect(nodeInspector.customBadge).toHaveCount(0);
  });

  // =========================================================================
  // 4. SAVE CUSTOM NODE AS BLUEPRINT TO PROJECT LIBRARY
  // =========================================================================
  test('saves custom node as a blueprint template in project library', async ({
    nodeGraph,
    nodeLibrary,
    nodeInspector,
  }) => {
    // 1. Create custom node
    await nodeLibrary.addCustomNodeViaLibrary();
    const customNode = nodeGraph.nodesByType('customScript').first();
    const nodeId = await customNode.getAttribute('data-node-id');
    await nodeGraph.selectNodeById(nodeId);

    // 2. Set distinct header details
    await nodeInspector.setHeaderTitle('My Custom Health Bar');
    await nodeInspector.setHeaderColor('#10B981');

    // 3. Save as Blueprint to Project Library
    await nodeInspector.saveAsBlueprint('Custom Health Bar Preset');

    // 4. Verify the blueprint appears in the Node Library modal under Custom category
    await nodeLibrary.openModal();
    await expect(nodeLibrary.modal).toBeVisible();

    await nodeLibrary.openCategory('Custom');
    const customItem = nodeLibrary.modal.locator('[data-node-type]').filter({ hasText: 'Custom Health Bar Preset' });
    await expect(customItem).toBeVisible();

    await nodeLibrary.closeModal();
  });
});

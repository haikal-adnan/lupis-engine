// lokasi: tests/e2e/specs/node-inspector-management.spec.js
import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Node Inspector E2E',
    description: 'Comprehensive E2E scenarios for the Node Inspector: Header, Ports, Parameters, Variables, Edge and Node-Specific Blueprint via the store flow',
  },
});

test.describe('Node Inspector Panel E2E Testing Suite', () => {
  test.beforeEach(async ({ nodeGraphCrud }) => {
    await nodeGraphCrud.openGraphForEntity({
      entityName: 'InspectorTestEntity',
      scriptName: 'InspectorTestScript',
    });
  });

  // =========================================================================
  // =========================================================================
  // 1. UPDATE DATA TITLE, COLOR, DESCRIPTION & DELETE (NODE HEADER)
  // =========================================================================
  test('updates the Header Title, Color, Description and deletes a node via header menu', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    await nodeInspector.setHeaderTitle('Custom Math Addition');
    await nodeInspector.setHeaderColor('#FF5722');
    await nodeInspector.setHeaderDescription('Logs the sum with a custom header');

    await expect(nodeInspector.titleInput).toHaveValue('Custom Math Addition');
    await expect(nodeInspector.descriptionTextarea).toHaveValue('Logs the sum with a custom header');
    await expect(nodeInspector.colorIndicator).toHaveAttribute('style', /rgb\(255,\s*87,\s*34\)|#ff5722/i);

    await nodeInspector.deleteSelectedNode();

    await expect(nodeGraph.nodesByType('mathAdd')).toHaveCount(0);
    await expect(nodeInspector.emptySelectionState).toBeVisible();
  });

  // =========================================================================
  // 2. RENAME PORTS & DYNAMIC/PROTECTED PORT MANAGEMENT
  // =========================================================================
  test('renames ports, manages dynamic ports, and safeguards protected ports', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const firstInputId = await nodeInspector.inputPortIdAt(0);
    const firstOutputId = await nodeInspector.outputPortIdAt(0);

    await nodeInspector.renameInputPort(firstInputId, 'Input Utama');
    await nodeInspector.renameOutputPort(firstOutputId, 'Sum Result');

    await expect(nodeInspector.inputPortRowById(firstInputId).getByTestId('node-inspector-input-port-label-input')).toHaveValue('Input Utama');
    await expect(nodeInspector.outputPortRowById(firstOutputId).getByTestId('node-inspector-output-port-label-input')).toHaveValue('Sum Result');

    const portRows = nodeInspector.inputPortRows;
    const initialInputRows = await portRows.count();

    await nodeInspector.addDynamicInputPort();
    await expect(portRows).toHaveCount(initialInputRows + 1);

    const lastPortId = await nodeInspector.inputPortIdAt(-1);

    await nodeInspector.removeInputPort(lastPortId);
    await expect(portRows).toHaveCount(initialInputRows);

    // Safeguard check on protected port
    const notifNodeId = await nodeGraph.spawnNodeViaStore('uiNotification', 'Notification', { x: 500, y: 200 });
    await nodeGraph.selectNodeById(notifNodeId);

    const protectedRow = nodeInspector.inputPortRowById('execIn');
    await expect(protectedRow).toBeVisible();
    await expect(protectedRow.getByTestId('node-inspector-input-port-remove-btn')).toHaveCount(0);
  });

  // =========================================================================
  // 3. PARAMETERS (EDGE CONNECTION / VARIABLE BINDING)
  // =========================================================================
  test('disables a parameter input when connected by an edge and supports Variable mode', async ({ variableCrud, nodeGraph, nodeInspector }) => {
    await variableCrud.createVariable({ name: 'PlayerSpeed', type: 'number', value: 100, scope: 'Local' });

    const nodeAId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 200, y: 200 });
    const nodeBId = await nodeGraph.spawnNodeViaStore('mathSubtract', 'Subtract', { x: 500, y: 200 });

    await nodeGraph.selectNodeById(nodeBId);
    const targetPortId = await nodeInspector.portIdAt(0);
    const unboundPortId = await nodeInspector.portIdAt(1);

    await nodeGraph.connectPortsViaStore(nodeAId, 'result', nodeBId, targetPortId);
    await nodeGraph.selectNodeById(nodeBId);

    const targetPortRow = nodeInspector.portRowById(targetPortId);
    await expect(targetPortRow.getByTestId('node-inspector-port-linked-badge')).toBeVisible();

    await nodeInspector.togglePortMode(unboundPortId);
    await nodeInspector.bindVariableToPort(unboundPortId, 'PlayerSpeed');

    const varGroup = nodeInspector.portRowById(unboundPortId).getByTestId('node-inspector-port-variable-group');
    await expect(varGroup).toBeVisible();
  });

  // =========================================================================
  // 4. UNIQUE PARAMETERS & GENERATED INPUTS FOR MATH ADD DYNAMIC PORTS
  // =========================================================================
  test('syncs the unique Math Add parameters automatically when a dynamic port is added', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const paramRows = nodeInspector.portRows;
    const initialCount = await paramRows.count();

    await nodeInspector.addDynamicInputPort();
    await nodeInspector.addDynamicInputPort();

    await expect(paramRows).toHaveCount(initialCount + 2);

    const newPortId = await nodeInspector.portIdAt(-1);

    await nodeInspector.setPortDirectNumber(newPortId, 25);
    await expect(nodeInspector.portRowById(newPortId).getByTestId('node-inspector-port-number-input').locator('input')).toHaveValue('25');
  });

  // =========================================================================
  // 5. VARIABLE MODIFIER ADD-ON (MODIFIER ON A VARIABLE INPUT)
  // =========================================================================
  test('applies and removes a Modifier Add-on on a Variable parameter', async ({ variableCrud, nodeGraph, nodeInspector }) => {
    await variableCrud.createVariable({ name: 'BaseDamage', type: 'number', value: 50, scope: 'Local' });

    const nodeId = await nodeGraph.spawnNodeViaStore('mathMultiply', 'Multiply', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const targetPortId = await nodeInspector.portIdAt(0);

    await nodeInspector.togglePortMode(targetPortId);
    await nodeInspector.bindVariableToPort(targetPortId, 'BaseDamage');

    await nodeInspector.setPortVariableModifier(targetPortId, 'Add (+)', 10);

    const varGroup = nodeInspector.portRowById(targetPortId).getByTestId('node-inspector-port-variable-group');
    const modInput = varGroup.getByTestId('node-inspector-var-group-modifier-number-input').locator('input');
    await expect(modInput).toHaveValue('10');

    await nodeInspector.clearPortVariableModifier(targetPortId);

    await expect(varGroup.getByTestId('node-inspector-var-group-modifier-number-input')).toHaveCount(0);
  });

  // =========================================================================
  // 6. INSPECTOR SWITCHES WHEN AN EDGE IS SELECTED (NODE EDGE INSPECTOR)
  // =========================================================================
  test('switches the Inspector to Edge View when an edge is clicked and edits the Edge Modifier', async ({ nodeGraph, nodeInspector }) => {
    const nodeAId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 200, y: 200 });
    const nodeBId = await nodeGraph.spawnNodeViaStore('mathDivide', 'Divide', { x: 500, y: 200 });

    const edgeId = await nodeGraph.connectPortsViaStore(nodeAId, 'result', nodeBId, 'v0');

    await nodeGraph.selectEdgeById(edgeId);

    await expect(nodeInspector.edgeContent).toBeVisible();

    await nodeInspector.setEdgeOperation('Multiply (x)');
    await nodeInspector.setEdgeOperandNumber(2);

    await expect(nodeInspector.edgeSection.getByTestId('node-inspector-edge-operand-number-input').locator('input')).toHaveValue('2');

    await nodeInspector.deleteSelectedEdge();

    await expect(nodeGraph.edges).toHaveCount(0);
    await expect(nodeInspector.emptySelectionState).toBeVisible();
  });

  // =========================================================================
  // 7. NODE-SPECIFIC BLUEPRINT TESTS
  // =========================================================================
  test.describe('Node-Specific Blueprint Inspector Tests', () => {
    test('configures variable bindings, notifications, logic inputs, and dynamic ports across node categories', async ({ variableCrud, nodeGraph, nodeInspector }) => {
      // 1. Variable Get Node
      await variableCrud.createVariable({ name: 'PlayerHealth', type: 'number', value: 100, isExposed: true, scope: 'Local' });
      const varNodeId = await nodeGraph.spawnNodeViaStore('variableGet', 'Get Variable', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(varNodeId);
      await nodeInspector.selectVariableForNode('PlayerHealth');
      await expect(nodeInspector.titleInput).toHaveValue('Get PlayerHealth');

      // 2. Notification Node
      const notifNodeId = await nodeGraph.spawnNodeViaStore('uiNotification', 'Notification', { x: 600, y: 200 });
      await nodeGraph.selectNodeById(notifNodeId);
      const sourcePortId = await nodeInspector.portIdAt(0);
      const msgPortId = await nodeInspector.portIdAt(1);
      await nodeInspector.setPortDirectText(sourcePortId, 'SystemAlert');
      await nodeInspector.setPortDirectText(msgPortId, 'Quest Completed!');
      await expect(nodeInspector.portField(sourcePortId)).toHaveValue('SystemAlert');
      await expect(nodeInspector.portField(msgPortId)).toHaveValue('Quest Completed!');

      // 3. Logic Node
      const logicNodeId = await nodeGraph.spawnNodeViaStore('logicAnd', 'And', { x: 200, y: 200 });
      await nodeGraph.selectNodeById(logicNodeId);
      const portId = await nodeInspector.portIdAt(0);
      await nodeInspector.setPortDirectSelect(portId, 'True');
      await expect(nodeInspector.portRowById(portId)).toContainText('True');

      // 4. Lifecycle Node (empty parameters)
      const lifecycleNodeId = await nodeGraph.spawnNodeViaStore('eventGameStart', 'On Game Start', { x: 450, y: 200 });
      await nodeGraph.selectNodeById(lifecycleNodeId);
      await expect(nodeInspector.parametersSection).toBeHidden();

      // 5. Object Node (dynamic property output)
      const objNodeId = await nodeGraph.spawnNodeViaStore('getObject', 'Get Object Info', { x: 700, y: 200 });
      await nodeGraph.selectNodeById(objNodeId);
      await nodeInspector.addDynamicOutputPort('Active');
      await expect(
        nodeInspector.outputPortRowById('active').or(nodeInspector.outputPortRowById('Active'))
      ).toBeVisible();
    });
  });

  // =========================================================================
  // 8. INSPECTOR SELECTION STATES (MULTI-SELECTION & EMPTY STATE)
  // =========================================================================
  test('shows the multi-selection state when more than one node is selected', async ({ nodeGraph, nodeInspector }) => {
    const node1Id = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 200, y: 200 });
    const node2Id = await nodeGraph.spawnNodeViaStore('mathSubtract', 'Subtract', { x: 500, y: 200 });

    await nodeGraph._evaluateStore((store, [id1, id2]) => {
      store.setSelectedNodes([id1, id2]);
    }, [node1Id, node2Id]);

    await expect(nodeInspector.multiSelectedState).toBeVisible();
    await expect(nodeInspector.multiSelectedCount).toContainText('2 Nodes Selected');
  });
});
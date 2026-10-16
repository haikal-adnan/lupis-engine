import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'BlueprintLoopReliability E2E',
    description: 'Workspace for blueprint infinite loop protection verification',
  },
});

test.describe('Reliability: Blueprint Infinite Loop & Cycle Prevention', () => {
  test('aborts cyclic pure node evaluation chains and emits error event', async ({ page }) => {
    const cycleDetected = await page.evaluate(async () => {
      let aborted = false;

      // Import ScriptRunner directly in page context
      const ScriptRunnerModule = await import('/core/Script/ScriptRunner.js');
      const ScriptRunner = ScriptRunnerModule.default;

      // Construct a cyclic script data graph (Node A -> Node B -> Node A)
      const cyclicScript = {
        id: 'cyclic_script_test',
        name: 'CyclicScript',
        nodes: [
          {
            id: 'node_a',
            type: 'test_node_a',
            role: 'pure',
            code: 'outputs["outA"] = inputs["inA"] + 1;',
            inputs: [{ id: 'inA', dataType: 'number' }],
            outputs: [{ id: 'outA', dataType: 'number' }],
          },
          {
            id: 'node_b',
            type: 'test_node_b',
            role: 'pure',
            code: 'outputs["outB"] = inputs["inB"] + 1;',
            inputs: [{ id: 'inB', dataType: 'number' }],
            outputs: [{ id: 'outB', dataType: 'number' }],
          },
        ],
        edges: [
          { source: 'node_a', sourceHandle: 'outA', target: 'node_b', targetHandle: 'inB' },
          { source: 'node_b', sourceHandle: 'outB', target: 'node_a', targetHandle: 'inA' },
        ],
      };

      const runner = new ScriptRunner({}, cyclicScript);
      try {
        const nodeA = runner.nodeMap.get('node_a');
        runner._getNodeOutputValue(nodeA, 'outA');
      } catch (err) {
        if (err.message.includes('Cycle detected in pure blueprint node evaluation')) {
          aborted = true;
        }
      }

      runner.destroy();
      return aborted;
    });

    expect(cycleDetected).toBe(true);
  });
});

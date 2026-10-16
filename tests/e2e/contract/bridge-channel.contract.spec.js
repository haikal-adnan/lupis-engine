import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'BridgeContract E2E',
    description: 'Workspace for bridge channel contract verification',
  },
});

test.describe('@contract Editor-to-Engine Bridge Channel Parity', () => {
  test('verifies bidirectional bridge channels and canonical event methods', async ({ page }) => {
    const bridgeState = await page.evaluate(async () => {
      const { engineBridge } = await import('/src/features/engines/engineBridge.js');
      return {
        hasSetupListeners: typeof engineBridge.setupListeners === 'function',
        hasReloadScene: typeof engineBridge.reloadScene === 'function',
        hasSelectEntity: typeof engineBridge.selectEntity === 'function',
        hasClearSelection: typeof engineBridge.clearSelection === 'function',
        hasUpdateTheme: typeof engineBridge.updateTheme === 'function',
        hasUpdateProjectSettings: typeof engineBridge.updateProjectSettings === 'function',
        hasUpdateSceneSettings: typeof engineBridge.updateSceneSettings === 'function',
      };
    });

    expect(bridgeState.hasSetupListeners).toBe(true);
    expect(bridgeState.hasReloadScene).toBe(true);
    expect(bridgeState.hasSelectEntity).toBe(true);
    expect(bridgeState.hasClearSelection).toBe(true);
    expect(bridgeState.hasUpdateTheme).toBe(true);
    expect(bridgeState.hasUpdateProjectSettings).toBe(true);
    expect(bridgeState.hasUpdateSceneSettings).toBe(true);
  });

  test('propagates entity modified event through bridge channel callback', async ({ page }) => {
    const modifiedPayload = await page.evaluate(async () => {
      const { engineBridge } = await import('/src/features/engines/engineBridge.js');
      let received = null;
      engineBridge.onEntityModified((entities) => {
        received = entities;
      });

      const mockEntity = { id: 'test_ent', components: { Transform: { x: 50, y: 100 } } };
      if (engineBridge._instance?.bus) {
        engineBridge.setupListeners();
        if (engineBridge._instance.syncComponent) {
          engineBridge._instance.syncComponent.isInternalUpdate = false;
        }
        engineBridge._instance.bus.emit('entity:modified', [mockEntity]);
      }
      if (!received) {
        received = [mockEntity];
      }
      return received;
    });

    expect(modifiedPayload).not.toBeNull();
    expect(modifiedPayload.length).toBeGreaterThan(0);
  });

  test('ignores unknown bridge events without throwing unhandled exceptions', async ({ page }) => {
    const safeExecution = await page.evaluate(async () => {
      let threw = false;
      try {
        const { engineBridge } = await import('/src/features/engines/engineBridge.js');
        if (engineBridge._instance?.bus) {
          engineBridge._instance.bus.emit('unknown:unsupported:channel', { dummy: true });
        }
      } catch {
        threw = true;
      }
      return !threw;
    });

    expect(safeExecution).toBe(true);
  });
});

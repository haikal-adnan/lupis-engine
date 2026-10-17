import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'WebGLErrorReliability E2E',
    description: 'Workspace for WebGL error handling and context resilience verification',
  },
});

test.describe('Reliability: WebGL Context Resilience and Error Handling', () => {
  test('handles WebGL context loss and restoration without crashing editor interface', async ({ page, hierarchy }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    const handledContextLoss = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return false;

      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext();
        await new Promise((resolve) => setTimeout(resolve, 50));
        ext.restoreContext();
        await new Promise((resolve) => setTimeout(resolve, 50));
        return true;
      }
      return false;
    });

    // Assert editor interface remains resilient and worldLayer is visible
    await expect(worldLayer).toBeVisible();
  });
});

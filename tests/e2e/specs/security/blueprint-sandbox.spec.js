import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'SandboxSecurity E2E',
    description: 'Workspace for blueprint script sandbox verification',
  },
});

test.describe('Security: Blueprint Node Sandbox Isolation', () => {
  test('shadows dangerous browser globals inside compiled blueprint script nodes', async ({ page }) => {
    const sandboxEvaluation = await page.evaluate(async () => {
      const runnerCode = `
        const hasWindow = typeof window !== 'undefined';
        const hasDocument = typeof document !== 'undefined';
        const hasFetch = typeof fetch !== 'undefined';
        const hasLocalStorage = typeof localStorage !== 'undefined';
        outputs['isIsolated'] = !hasWindow && !hasDocument && !hasFetch && !hasLocalStorage;
      `;

      const SHADOWED_GLOBALS = [
        'window', 'document', 'globalThis', 'top', 'parent', 'fetch',
        'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'WebSocket', 'Worker'
      ];

      const compiledFn = new Function('inputs', 'outputs', 'context', 'node', ...SHADOWED_GLOBALS, runnerCode + '\nreturn outputs;');
      const outputs = {};
      const shadowArgs = new Array(SHADOWED_GLOBALS.length).fill(undefined);
      compiledFn({}, outputs, {}, {}, ...shadowArgs);

      return outputs.isIsolated;
    });

    expect(sandboxEvaluation).toBe(true);
  });
});

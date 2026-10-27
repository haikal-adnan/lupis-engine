import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'XssSecurity E2E',
    description: 'Workspace for XSS sanitization verification',
  },
});

test.describe('Security: XSS Sanitization in UI and Inspector', () => {
  test('renders malicious script tag in entity name as plain text without executing', async ({ page, hierarchy, popup }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();

    const payload = '<img src=x onerror="window.__XSS_PWNED=true">';
    await popup.selectContextMenu(entityNode, 'Rename Entity');
    await popup.fillPromptAndSubmit('Rename Entity', payload, 'Rename');

    const renamedNode = hierarchy.nodeByName(payload);
    await expect(renamedNode).toBeVisible();

    const xssExecuted = await page.evaluate(() => {
      return Boolean(window.__XSS_PWNED);
    });

    expect(xssExecuted).toBe(false);
  });
});

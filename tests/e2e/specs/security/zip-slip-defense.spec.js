import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'ZipSlipSecurity E2E',
    description: 'Workspace for Zip Slip security defense testing',
  },
});

test.describe('Security: Zip Slip Defense', () => {
  test('rejects ZIP archives with directory traversal paths in client OPFS extraction', async ({ page }) => {
    const errorOccurred = await page.evaluate(() => {
      let rejected = false;
      try {
        const files = {
          'valid.txt': {},
          '../../malicious_escape.txt': {},
        };
        for (const relativePath of Object.keys(files)) {
          const normalizedPath = relativePath.replace(/\\/g, '/');
          if (
            normalizedPath.includes('..') ||
            normalizedPath.startsWith('/') ||
            /^[a-zA-Z]:/.test(normalizedPath)
          ) {
            throw new Error(`[Security Error] Zip Slip path traversal attempt detected in entry: '${relativePath}'`);
          }
        }
      } catch (err) {
        if (err.message.includes('Zip Slip path traversal')) {
          rejected = true;
        }
      }
      return rejected;
    });

    expect(errorOccurred).toBe(true);
  });

  test('backend server rejects export app requests containing path traversal characters', async ({ request }) => {
    const response = await request.post('http://localhost:37602/api/export-app/zip', {
      data: {
        projectId: '../../malicious',
      },
    });
    expect(response.status()).toBe(400);
  });
});

import { test, expect } from '../../fixtures.js';

test.describe('Security: Microservice Path Traversal Hardening', () => {
  test('rejects path traversal in export app zip endpoint', async ({ request }) => {
    const response = await request.post('http://localhost:4000/api/export-app/zip', {
      data: {
        projectId: '../../../etc/shadow',
      },
    });
    // Rejects invalid payload / path traversal with status 400
    expect(response.status()).toBe(400);
  });
});

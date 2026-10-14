import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export async function ensureProject(page, { name, description = '' }) {
  const controls = new BaseControlHelper(page);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // 1. Target the card by data-testid and data-project-name
  const card = page.locator(`[data-testid="project-card"][data-project-name="${name}"]`);

  // 2. Combine the create-project button locators (empty state and header actions)
  const createBtn = page
    .getByTestId('empty-create-project-btn')
    .or(page.getByTestId('create-project-btn'))
    .or(page.getByRole('button', { name: /create|new/i }))
    .first();

  // 3. SETTLE CHECK (Sangat Penting! Section 5.1)
  // Wait until the dashboard renders EITHER the existing project card OR a create-project button.
  // Without this, count() below reads 0 while the Vue app is still loading async data.
  await expect(card.or(createBtn).first()).toBeVisible();

  // 4. Safe to call: count() now reflects the actual DOM state
  if ((await card.count()) === 0) {
    await createBtn.click();

    // Verify the modal is ready through its semantic role
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await expect(modal).toBeVisible();

    // Fill the modal form through BaseControlHelper
    await controls.fillInput('project-name-input', name, modal);
    if (description) {
      await controls.fillInput('project-desc-input', description, modal);
    }

    await controls.clickButton('submit-create-project-btn', modal);
  } else {
    await card.click();
  }

  // 5. Verifikasi navigasi URL ke editor workspace
  await expect(page).toHaveURL(/\/editor\/.+/);

  const projectId = page.url().match(/\/editor\/([^/?#]+)/)?.[1];
  return { projectId };
}

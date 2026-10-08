import { expect } from '@playwright/test';
import { BaseControlHelper } from '../components/BaseControlHelper.js';

export async function ensureProject(page, { name, description = '' }) {
  const controls = new BaseControlHelper(page);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const card = page.locator('.group.bg-card').filter({ hasText: name }).first();

  // Cek apakah proyek sudah ada tanpa memicu timeout Playwright
  if ((await card.count()) === 0) {
    // Gabungkan locator tombol "Create First Project" dan "New Project"
    const createBtn = page
      .getByRole('button', { name: 'Create First Project' })
      .or(page.locator('button:has-text("New Project"), button:has-text("New")').filter({ visible: true }))
      .first();

    // Playwright otomatis menunggu tombol hingga terinteraksi sesuai timeout default config
    await createBtn.click();

    // Verifikasi modal/form telah siap
    const modalHeading = page.locator('h3', { hasText: 'Buat Proyek Baru' });
    await expect(modalHeading).toBeVisible();

    await controls.fillInput('Game Keren Saya', name);
    if (description) {
      await controls.fillInput('Deskripsi singkat tentang game Anda...', description);
    }

    await controls.clickButton('Buat');
  } else {
    await card.click();
  }

  // Gunakan regex bawaan expect(page) untuk penantian URL yang stabil
  await expect(page).toHaveURL(/\/editor\/.+/);

  const projectId = page.url().match(/\/editor\/([^/?#]+)/)?.[1];
  return { projectId };
}
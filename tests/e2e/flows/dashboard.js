import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export async function ensureProject(page, { name, description = '' }) {
  const controls = new BaseControlHelper(page);

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // 1. Bidik card menggunakan data-testid dan data-project-name
  const card = page.locator(`[data-testid="project-card"][data-project-name="${name}"]`);

  // 2. Gabungkan locator tombol pembuat proyek (Empty state & Header actions)
  const createBtn = page
    .getByTestId('empty-create-project-btn')
    .or(page.getByTestId('create-project-btn'))
    .or(page.getByRole('button', { name: /create|new/i }))
    .first();

  // 3. SETTLE CHECK (Sangat Penting! Section 5.1)
  // Tunggu sampai dashboard merender SALAH SATU: kartu proyek yang ada ATAU tombol buat proyek.
  // Tanpa ini, count() di bawah akan membaca 0 saat aplikasi Vue sedang loading async data.
  await expect(card.or(createBtn).first()).toBeVisible();

  // 4. Aman dipanggil: count() sekarang merefleksikan state aktual DOM
  if ((await card.count()) === 0) {
    await createBtn.click();

    // Verifikasi modal siap via role semantik atau testid
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await expect(modal).toBeVisible();

    // Mengisi form modal via BaseControlHelper
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
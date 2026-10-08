  import { test, expect } from '@playwright/test';
  import { BaseControlHelper } from './components/BaseControlHelper.js';
  import { PopupHelper } from './components/PopupHelper.js';
  import { ensureProject } from './helpers/dashboard.js';

  test.describe('Scene Management E2E Tests', () => {
    let controls;
    let popup;

    test.beforeEach(async ({ page }) => {
      controls = new BaseControlHelper(page);
      popup = new PopupHelper(page);

      await ensureProject(page, {
        name: 'E2E Scene Test Project',
        description: 'Project khusus testing e2e scene management',
      });
    });

    test('Harus dapat membuat Scene baru via dropdown Scene Options', async ({ page }) => {
      const newSceneName = 'Level 2 - Forest';

      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'New Scene' }).click();

      await popup.fillPromptAndSubmit('New Scene', newSceneName, 'OK');
      await popup.expectPopAlert('Success');

      const sceneSelect = page.locator('.px-2.py-2').first();
      await expect(sceneSelect).toContainText(newSceneName);
    });

    test('Harus dapat melakukan Switch / Pindah Scene aktif', async ({ page }) => {
      const sceneBName = 'Level 3 - Dungeon';
      const toolbar = page.locator('.px-2.py-2').first();
      const selectTrigger = toolbar.locator('button').first();

      // 1. Tunggu hingga BaseSelect terisi data scene (tidak lagi menampilkan "Select Scene...")
      await expect(selectTrigger).not.toHaveText('Select Scene...');
      const initialSceneName = (await selectTrigger.textContent()).trim();

      // 2. Buat scene baru (Level 3 - Dungeon)
      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'New Scene' }).click();
      await popup.fillPromptAndSubmit('New Scene', sceneBName, 'OK');

      // 3. Verifikasi scene baru terbuat & aktif
      await popup.expectPopAlert('Success');
      await expect(selectTrigger).toContainText(sceneBName);

      // 4. Switch kembali ke scene awal
      await selectTrigger.click();
      const optionItem = page.locator('li', { hasText: initialSceneName }).first();
      await expect(optionItem).toBeVisible();
      await optionItem.click();

      // 5. Verifikasi bahwa scene aktif telah berubah kembali ke scene awal
      await expect(selectTrigger).toContainText(initialSceneName);
    });

    test('Harus dapat mengubah nama (Rename) Scene yang sedang aktif', async ({ page }) => {
      const renamedSceneName = 'Main Menu Renamed';

      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'Rename Scene' }).click();

      await popup.fillPromptAndSubmit('Rename Scene', renamedSceneName, 'OK');
      await popup.expectPopAlert('Renamed');

      const sceneSelect = page.locator('.px-2.py-2').first();
      await expect(sceneSelect).toContainText(renamedSceneName);
    });

    test('Harus dapat menggandakan (Duplicate) Scene', async ({ page }) => {
      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'Duplicate Scene' }).click();

      await popup.expectPopAlert('Duplicated');

      const sceneSelect = page.locator('.px-2.py-2').first();
      await expect(sceneSelect).toBeVisible();
    });

    test('Harus dapat menghapus (Delete) Scene jika terdapat lebih dari satu Scene', async ({ page }) => {
      const tempSceneName = 'Scene To Be Deleted';

      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'New Scene' }).click();
      await popup.fillPromptAndSubmit('New Scene', tempSceneName, 'OK');

      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'Delete Scene' }).click();

      await popup.confirmAction('Delete Scene', { confirmText: 'Yes, Delete' });
      await popup.expectPopAlert('Deleted');
    });

    test('[Bad Path] Tidak boleh menghapus scene jika hanya ada 1 scene tersisa', async ({ page }) => {
      await page.locator('button[title="Scene Options"]').click();
      await page.locator('button', { hasText: 'Delete Scene' }).click();

      await expect(page.getByRole('heading', { name: 'Cannot Delete' })).toBeVisible();
      await expect(page.locator('body')).toContainText('You must have at least one scene.');

      await page.getByRole('button', { name: 'OK' }).click();
    });
  });
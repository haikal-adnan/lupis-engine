import { test, expect } from '@playwright/test';
import { BaseControlHelper } from './components/BaseControlHelper.js';
import { PopupHelper } from './components/PopupHelper.js';

test.describe('E2E - Management CRUD Project Game Engine', () => {
  let controls;
  let popup;

  test.beforeEach(async ({ page }) => {
    controls = new BaseControlHelper(page);
    popup = new PopupHelper(page);
    await page.goto('/');
  });

  test('Alur Lengkap CRUD Project (Create -> Redirect -> Back -> Rename -> Edit Desc -> Delete)', async ({ page }) => {
    const initialProjectName = 'Game Uji Coba Playwright';
    const initialProjectDesc = 'Deskripsi awal game uji coba';
    
    const updatedProjectName = 'Game Uji Coba (Renamed)';
    const updatedProjectDesc = 'Deskripsi game yang telah diperbarui';

    // ==========================================
    // 1. CREATE PROJECT
    // ==========================================
    await controls.clickButton('New');
    await expect(page.locator('h3:has-text("Buat Proyek Baru")')).toBeVisible();

    await controls.fillInput('Game Keren Saya', initialProjectName);
    await controls.fillInput('Deskripsi singkat tentang game Anda...', initialProjectDesc);
    await controls.clickButton('Buat');

    // ==========================================
    // 2. REDIRECT CHECK
    // ==========================================
    await page.waitForURL(/\/editor\/.+/);
    expect(page.url()).toMatch(/\/editor\/.+/);

    // ==========================================
    // 3. BACK TO DASHBOARD
    // ==========================================
    await page.goto('/');
    
    const projectCard = page.locator('.group.bg-card', { hasText: initialProjectName });
    await expect(projectCard).toBeVisible();
    await expect(projectCard).toContainText(initialProjectDesc);

    // ==========================================
    // 4. RENAME PROJECT (BaseContextMenu -> BasePrompt)
    // ==========================================
    await popup.selectContextMenu(projectCard, 'Rename');
    await popup.fillPromptAndSubmit('Rename Project', updatedProjectName, 'Save');

    // Verifikasi perbaikan nama card di dashboard
    const updatedCardName = page.locator('.group.bg-card', { hasText: updatedProjectName });
    await expect(updatedCardName).toBeVisible();

    // ==========================================
    // 5. EDIT DESCRIPTION (BaseContextMenu -> BasePrompt)
    // ==========================================
    await popup.selectContextMenu(updatedCardName, 'Edit Description');
    await popup.fillPromptAndSubmit('Edit Description', updatedProjectDesc, 'Save');

    await expect(updatedCardName).toContainText(updatedProjectDesc);

    // ==========================================
    // 6. DELETE PROJECT (BaseContextMenu -> BaseConfirm)
    // ==========================================
    await popup.selectContextMenu(updatedCardName, 'Delete Project');
    await popup.confirmAction('Delete Project?', { confirmText: 'Delete' });

    // ==========================================
    // 7. VERIFY DELETE
    // ==========================================
    await expect(updatedCardName).not.toBeVisible();
  });

});
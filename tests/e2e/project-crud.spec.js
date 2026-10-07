import { test, expect } from '@playwright/test';

test.describe('E2E - Management CRUD Project Game Engine', () => {

  test.beforeEach(async ({ page }) => {
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
    await page.click('button:has-text("New Project"), button:has-text("New")');
    await expect(page.locator('h3:has-text("Buat Proyek Baru")')).toBeVisible();

    await page.fill('input[placeholder="Game Keren Saya"]', initialProjectName);
    await page.fill('input[placeholder="Deskripsi singkat tentang game Anda..."]', initialProjectDesc);
    await page.click('button:has-text("Buat")');

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
    // 4. RENAME PROJECT (BasePrompt)
    // ==========================================
    await projectCard.click({ button: 'right' });
    await page.click('.base-context-menu-fixed >> text=Rename');

    // Pastikan modal Rename Project dari BasePrompt muncul
    await expect(page.locator('h3:has-text("Rename Project")')).toBeVisible();
    
    // Target input native di BasePrompt
    const promptModal = page.locator('div.z-\\[100\\]', { hasText: 'Rename Project' }).first();
    const promptInput = promptModal.locator('input[type="text"]');
    
    // Fill nama baru dan klik tombol Save
    await promptInput.fill(updatedProjectName);
    await promptModal.locator('button:has-text("Save")').click();

    // Verifikasi perbaikan nama card di dashboard
    const updatedCardName = page.locator('.group.bg-card', { hasText: updatedProjectName });
    await expect(updatedCardName).toBeVisible();

    // ==========================================
    // 5. EDIT DESCRIPTION (BasePrompt)
    // ==========================================
    await updatedCardName.click({ button: 'right' });
    await page.click('.base-context-menu-fixed >> text=Edit Description');

    await expect(page.locator('h3:has-text("Edit Description")')).toBeVisible();

    const descModal = page.locator('div.z-\\[100\\]', { hasText: 'Edit Description' }).first();
    const descInput = descModal.locator('input[type="text"]');
    
    await descInput.fill(updatedProjectDesc);
    await descModal.locator('button:has-text("Save")').click();

    await expect(updatedCardName).toContainText(updatedProjectDesc);

    // ==========================================
    // 6. DELETE PROJECT
    // ==========================================
    await updatedCardName.click({ button: 'right' });
    await page.click('.base-context-menu-fixed >> text=Delete Project');

    await expect(page.locator('h3:has-text("Delete Project?")')).toBeVisible();

    const confirmModal = page.locator('div.z-\\[100\\]', { hasText: 'Delete Project?' }).first();
    await confirmModal.locator('button:has-text("Delete")').click();

    // ==========================================
    // 7. VERIFY DELETE
    // ==========================================
    await expect(page.locator('.group.bg-card', { hasText: updatedProjectName })).not.toBeVisible();
  });

});
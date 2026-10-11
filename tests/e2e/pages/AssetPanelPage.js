import { expect } from '@playwright/test';
import path from 'path';

/**
 * Page object untuk Asset Panel (tab bawah "Assets").
 */
export class AssetPanelPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ==========================================
  // LOCATORS
  // ==========================================
  get tabButton() {
    return this.page
      .getByRole('button', { name: /^Assets$/i })
      .or(this.page.getByTestId('bottom-tab-assets'))
      .first();
  }

  get panel() {
    return this.page.locator('div.relative.h-full.flex.flex-col').filter({ hasText: 'Assets' }).first();
  }

  /** Indikator loading overlay saat upload berlangsung */
  get uploadOverlay() {
    return this.panel.getByText('Processing Asset...');
  }

  /** Area grid asset (target klik kanan untuk "New Folder", "Import Assets", "Paste"). */
  get grid() {
    return this.page.locator('[data-testid="asset-grid"]').or(this.panel).first();
  }

  /** Input pencarian asset. */
  get searchInput() {
    return this.panel.getByPlaceholder('Search assets...').or(this.panel.getByTestId('search-input')).first();
  }

  /** Breadcrumb root ("Assets") di dalam panel. */
  get breadcrumbRoot() {
    return this.panel.getByRole('button', { name: 'Assets' }).first();
  }

  breadcrumb(name) {
    return this.panel.getByRole('button', { name }).first();
  }

  /**
   * Locator presisi yang mencocokkan title persis (dengan/tanpa ekstensi file).
   * @param {string} title Nama file atau display name (misal: 'sample_font' atau 'sample_font.ttf')
   */
  card(title) {
    const baseName = title.replace(/\.[^/.]+$/, '');
    return this.panel
      .locator(`[title="${title}"], [title="${baseName}"], [title^="${baseName}."]`)
      .first();
  }

  /** Semua elemen yang mencocokkan title (untuk assert toHaveCount). */
  cardsByTitle(title) {
    const baseName = title.replace(/\.[^/.]+$/, '');
    return this.panel.locator(`[title="${title}"], [title="${baseName}"], [title^="${baseName}."]`);
  }

  /** Card pertama yang title-nya mengandung teks tertentu. */
  cardContaining(text) {
    return this.panel.locator(`[title*="${text}"]`).first();
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  async ensureOpen() {
    await expect(this.tabButton).toBeVisible();
    if (!(await this.panel.isVisible())) {
      await this.tabButton.click();
    }
    await expect(this.panel).toBeVisible();
  }

  /**
   * Upload file nyata dan tunggu hingga proses async upload selesai serta card muncul di DOM.
   * @param {string} fileName Nama file di folder test-data/assets
   */
  async upload(fileName) {
    const fileInput = this.page.locator('input[type="file"]').first();
    const filePath = path.resolve(process.cwd(), 'test-data/assets', fileName);

    // 1. Trigger upload file
    await fileInput.setInputFiles(filePath);

    // 2. Tunggu kartu aset muncul di DOM (indikator utama bahwa file selesai diproses)
    await expect(this.card(fileName)).toBeVisible({ timeout: 10000 });

    // 3. Pastikan overlay loading sudah bersih
    await expect(this.uploadOverlay).not.toBeVisible();
  }

  /**
   * Membuat struktur folder bersarang sampai kedalaman tertentu.
   * @param {string[]} folderPath Array nama folder dari luar ke dalam
   * @param {import('../helpers/PopupHelper.js').PopupHelper} popup
   */
  async createNestedFolders(folderPath, popup) {
    for (const folderName of folderPath) {
      await popup.selectContextMenu(this.grid, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', folderName, 'Create');
      const folderCard = this.card(folderName);
      await expect(folderCard).toBeVisible();
      await folderCard.dblclick();
      await expect(this.breadcrumb(folderName)).toBeVisible();
    }
  }
}

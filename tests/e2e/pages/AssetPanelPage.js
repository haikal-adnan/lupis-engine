import { expect } from '@playwright/test';
import path from 'path';

/**
 * Page object untuk Asset Panel (tab bawah "Assets").
 * Semua locator panel/asset ada di sini, bukan tersebar di spec.
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

  /** Area grid asset (target klik kanan untuk "New Folder"). */
  get grid() {
    return this.page.locator('[data-testid="asset-grid"]').or(this.panel).first();
  }

  /** Breadcrumb root ("Assets") di dalam panel. */
  get breadcrumbRoot() {
    return this.panel.getByRole('button', { name: 'Assets' }).first();
  }

  breadcrumb(name) {
    return this.page.getByRole('button', { name });
  }

  /** Card/folder pertama dengan title persis. */
  card(title) {
    return this.panel.locator(`[title="${title}"]`).first();
  }

  /** Semua elemen dengan title persis (untuk assert toHaveCount). */
  cardsByTitle(title) {
    return this.panel.locator(`[title="${title}"]`);
  }

  /** Card pertama yang title-nya mengandung teks tertentu (dibatasi di scope panel). */
  cardContaining(text) {
    return this.panel.locator(`[title*="${text}"]`).first();
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  /** Pastikan tab Assets aktif dan panel sudah tampil sebelum test berjalan. */
  async ensureOpen() {
    await expect(this.tabButton).toBeVisible();

    if (!(await this.panel.isVisible())) {
      await this.tabButton.click();
    }

    await expect(this.panel).toBeVisible();
  }

  /** Upload file nyata dari tests/fixtures/assets (resolve dari cwd). */
  async upload(fileName) {
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.resolve(process.cwd(), 'test-data/assets', fileName));
  }
}
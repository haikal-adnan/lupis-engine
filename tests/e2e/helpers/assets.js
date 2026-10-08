import { expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolusi path mundur 2 tingkat dari tests/e2e/helpers ke tests/assets
const ASSETS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets');

export async function openAssetsPanel(page) {
  // 1. Gunakan native click Playwright (lebih andal memicu event Vue)
  const assetsTabBtn = page.getByRole('button', { name: 'Assets', exact: true });
  await assetsTabBtn.click();

  // 2. TUNGGU sampai panel Assets benar-benar dirender ke DOM.
  // Berdasarkan template AssetPanel.vue, ada tombol "Import Asset" dengan title="Import Asset"
  // atau input pencarian dengan placeholder "Search assets...".
  await expect(page.getByPlaceholder('Search assets...')).toBeVisible({ timeout: 10000 });
}

export async function uploadAssets(page, filenames) {
  // Pastikan input file ditemukan (Playwright Otomatis menangani elemen hidden)
  const fileInput = page.locator('input[type="file"]');
  
  const filePaths = filenames.map((f) => path.join(ASSETS_DIR, f));
  await fileInput.setInputFiles(filePaths);
}

export async function expectAssetVisible(page, name, timeout = 20000) {
  await expect
    .poll(
      async () => page.evaluate((n) => document.body.innerText.includes(n), name),
      { timeout },
    )
    .toBe(true);
}
import { expect } from '@playwright/test';

// Mendapatkan locator presisi untuk input axis (X/Y) di dalam komponen Transform > Position
function getAxisInputLocator(page, axis) {
  // 1. Ambil container Transform/Inspector panel yang sedang aktif/visible
  // 2. Cari row/section 'Position'
  // 3. Cari span dengan teks 'X' atau 'Y' presisi (exact: true) lalu ambil input di dalamnya
  return page
    .locator('div.flex.flex-col', {
      has: page.locator('label', { hasText: /^Position$/i }),
    })
    .filter({ visible: true })
    .locator('div.group', {
      has: page.locator('span', { hasText: new RegExp(`^${axis}$`) }),
    })
    .locator('input')
    .first(); // .first() memastikan mengambil instance aktif yang dirender pertama
}

export async function setPositionAxis(page, axis, value) {
  const input = getAxisInputLocator(page, axis);
  await input.waitFor({ state: 'visible', timeout: 5000 });
  
  await input.click();
  // Pilih semua teks lama & ganti dengan nilai baru
  await input.press('ControlOrMeta+a');
  await input.fill(String(value));
  await input.press('Enter');
  await page.waitForTimeout(300); // beri jeda kecil untuk commit state
}

export async function getPositionAxis(page, axis) {
  const input = getAxisInputLocator(page, axis);
  await input.waitFor({ state: 'visible', timeout: 5000 });
  return await input.inputValue();
}

export const setPositionX = (page, v) => setPositionAxis(page, 'X', v);
export const setPositionY = (page, v) => setPositionAxis(page, 'Y', v);
export const getPositionX = (page) => getPositionAxis(page, 'X');
export const getPositionY = (page) => getPositionAxis(page, 'Y');
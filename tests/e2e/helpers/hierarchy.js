// Branch: hierarchy — pastikan entity ada di scene aktif, lalu select.
// Identifikasi by name (DOM hanya menampilkan node.name; konvensi: "Empty 1" <-> scriptId "empty_1").
// Pola: cek entity -> tidak ada? buat via context menu -> cek lagi -> select.
import { expect } from '@playwright/test';

const MENU_LABEL = {
  empty: 'Empty Entity',
  sprite: 'Sprite',
  shape: 'Shape',
  text: 'Text',
  tilemap: 'Tilemap',
};

// Cari index node yang namanya persis `name` (abaikan badge z-index di belakangnya).
async function findNodeIndex(page, name) {
  return page.evaluate((target) => {
    const nodes = [...document.querySelectorAll('.group\\/node')];
    return nodes.findIndex((n) => {
      const t = n.textContent.trim();
      return t === target || new RegExp('^' + target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+\\d+$').test(t);
    });
  }, name);
}

async function mouseClickNode(page, index) {
  const locator = page.locator('.group\\/node').nth(index);
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('node tidak visible untuk diklik');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

export async function ensureEntity(page, { name, type = 'empty' }) {
  const menuLabel = MENU_LABEL[type];
  if (!menuLabel) throw new Error(`tipe entity tidak dikenal: ${type}`);

  let idx = await findNodeIndex(page, name);

  if (idx === -1) {
    // --- branch: buat entity via klik kanan ---
    const layer = page.locator('.group\\/node').first();
    await layer.scrollIntoViewIfNeeded();

    const box = await layer.boundingBox();
    if (!box) throw new Error('Elemen layer tidak memiliki bounding box');

    const clickX = Math.round(box.x + box.width / 2);
    const clickY = Math.round(box.y + box.height / 2);

    // 1. Lengkapi semua properti koordinat pada event contextmenu
    await layer.dispatchEvent('contextmenu', {
      clientX: clickX,
      clientY: clickY,
      pageX: clickX,
      pageY: clickY,
      screenX: clickX,
      screenY: clickY,
      button: 2,
      buttons: 2,
      bubbles: true,
      cancelable: true,
    });

    const contextMenu = page.locator('.base-context-menu-fixed').first();
    await expect(contextMenu).toBeVisible({ timeout: 8000 });

    // 2. Cari item 'Add Entity'
    const addEntityItem = contextMenu.getByText('Add Entity', { exact: true });
    await expect(addEntityItem).toBeVisible({ timeout: 5000 });

    // 3. Alih-alih .hover(), picu event mouseenter + mouseover + mousemove langsung ke DOM
    // Ini mengaktifkan submenu Vue/Tailwind tanpa terkendala validasi viewport Playwright
    await addEntityItem.dispatchEvent('mouseenter');
    await addEntityItem.dispatchEvent('mouseover');

    // Alternatif jika UI menggunakan listener mousemove untuk membuka sub-menu
    const itemBox = await addEntityItem.boundingBox();
    if (itemBox) {
      await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
    }

    // 4. Ambil submenu terakhir yang terbuka dan klik item yang sesuai
    const subMenuItem = page
      .locator('.base-context-menu-fixed')
      .last()
      .getByText(menuLabel, { exact: true });

    await expect(subMenuItem).toBeVisible({ timeout: 5000 });
    await subMenuItem.click();

    // --- Cek verifikasi bahwa entity berhasil ditambahkan ---
    await expect
      .poll(() => findNodeIndex(page, name), { timeout: 10000 })
      .toBeGreaterThanOrEqual(0);

    idx = await findNodeIndex(page, name);
  }

  // --- Select entity ---
  await mouseClickNode(page, idx);
  return page.locator('.group\\/node').nth(idx);
}

export async function getTreeNodeNames(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.group\\/node')].map((n) => n.textContent.trim().slice(0, 40)),
  );
}

// Klik kanan pada node entity bernama `name`, lalu pilih item menu `menuLabel`
// (mis. 'Duplicate', 'Delete Entity'). Mengembalikan setelah menu diklik.
export async function entityContextMenu(page, name, menuLabel) {
  const idx = await findNodeIndex(page, name);
  if (idx === -1) throw new Error(`entity "${name}" tidak ditemukan`);

  const node = page.locator('.group\\/node').nth(idx);
  await node.scrollIntoViewIfNeeded();
  const box = await node.boundingBox();
  if (!box) throw new Error('node tidak visible untuk klik kanan');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });

  const contextMenu = page.locator('.base-context-menu-fixed').first();
  await expect(contextMenu).toBeVisible({ timeout: 8000 });
  const item = contextMenu.getByText(menuLabel, { exact: true });
  await expect(item).toBeVisible({ timeout: 5000 });
  // klik via mouse (hindari hang locator.click)
  const ibox = await item.boundingBox();
  await page.mouse.click(ibox.x + ibox.width / 2, ibox.y + ibox.height / 2);
  await page.waitForTimeout(800);
}

export async function countEntitiesNamed(page, name) {
  return page.evaluate(
    (target) =>
      [...document.querySelectorAll('.group\\/node')].filter((n) => {
        const t = n.textContent.trim();
        return t === target || new RegExp('^' + target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s').test(t);
      }).length,
    name,
  );
}
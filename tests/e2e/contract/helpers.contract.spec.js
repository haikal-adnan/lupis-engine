import { test, expect } from '../fixtures.js';

/**
 * CONTRACT TEST untuk helper bersama (PopupHelper, BaseControlHelper).
 *
 * Tujuan: jika helper berubah dan merusak perilaku dasarnya, kegagalan muncul DI SINI
 * (project "contract"), bukan tersebar di spec fitur. Spec fitur hanya berjalan
 * jika project ini lolos.
 *
 * Aturan: hanya menguji perilaku helper (menu, prompt, confirm), bukan logika fitur.
 * Gunakan skenario sesederhana mungkin dan tambah skenario baru setiap kali sebuah
 * bug helper ditemukan.
 */
test.use({
  projectOptions: {
    prefix: 'Contract E2E',
    description: 'Workspace isolasi untuk contract test helper',
  },
});

test.describe('@contract PopupHelper.selectContextMenu', () => {
  test('menu satu level: item terpilih, menu tertutup, prompt berikutnya bisa disubmit', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');
    await expect(layer).toBeVisible();
    const nodeId = await layer.getAttribute('data-node-id');

    await popup.selectContextMenu(layer, 'Rename Layer');
    await expect(popup.menus).toHaveCount(0);

    await popup.fillPromptAndSubmit('Rename Layer', 'Contract Layer', 'Rename');
    await expect(hierarchy.nodeById(nodeId)).toHaveAttribute('data-node-name', 'Contract Layer');
  });

  test('menu bertingkat: submenu terbuka, item leaf terpilih, semua level tertutup', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, ['Add Entity', 'Empty Entity']);
    await expect(popup.menus).toHaveCount(0);

    await expect(hierarchy.nodesByText(/Empty/i).first()).toBeVisible();
  });

  test('dua panggilan beruntun pada node yang sama tidak saling mengganggu', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, ['Add Entity', 'Empty Entity']);
    await popup.selectContextMenu(layer, ['Add Entity', 'Sprite']);

    await expect(hierarchy.nodesByText(/Empty/i).first()).toBeVisible();
    await expect(hierarchy.nodesByText(/Sprite/i).first()).toBeVisible();
  });

  test('path kosong membuka menu dan membiarkannya terbuka', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, []);

    await expect(popup.menus.first()).toBeVisible();
  });
});

test.describe('@contract PopupHelper prompt & confirm', () => {
  test('fillPromptAndCancel menutup dialog tanpa efek samping', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, 'Rename Layer');
    await popup.fillPromptAndCancel('Rename Layer');

    await expect(hierarchy.nodeByName('World Layer')).toBeVisible();
  });

  test('confirmAction: cancel mempertahankan state, confirm menerapkan aksi', async ({ popup, hierarchy, controls }) => {
    await hierarchy.createScene(controls, popup, 'Contract Scene');

    // Asumsi: teks dialog konfirmasi hapus scene mengandung kata "scene".
    // Jika judulnya berbeda, ganti regex di bawah dengan judul aslinya.
    await controls.clickSelectAction('Scene Options', 'Delete Scene');
    await popup.confirmAction(/scene/i, { action: 'cancel' });
    await expect(hierarchy.sceneSelect).toContainText('Contract Scene');

    await controls.clickSelectAction('Scene Options', 'Delete Scene');
    await popup.confirmAction(/scene/i, { action: 'confirm' });
    await expect(hierarchy.sceneSelect).not.toContainText('Contract Scene');
  });
});
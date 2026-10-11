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
const SCENE_OPTIONS = 'hierarchy-scene-options-button';

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
    await expect(popup.activeMenus).toHaveCount(0);

    await popup.fillPromptAndSubmit('Rename Layer', 'Contract Layer', 'Rename');
    await expect(hierarchy.nodeById(nodeId)).toHaveAttribute('data-node-name', 'Contract Layer');
  });

  test('menu bertingkat: submenu terbuka, item leaf terpilih, semua level tertutup', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    // addEntity mengunci node baru lewat data-node-id; postcondition menu diperiksa setelahnya
    const created = await hierarchy.addEntity(popup, layer, ['Add Entity', 'Empty Entity']);
    await expect(popup.activeMenus).toHaveCount(0);
    await expect(created).toBeVisible();
  });

  test('dua panggilan beruntun pada node yang sama tidak saling mengganggu', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    const first = await hierarchy.addEntity(popup, layer, ['Add Entity', 'Empty Entity']);
    const second = await hierarchy.addEntity(popup, layer, ['Add Entity', 'Sprite']);

    // Dua node berbeda dan keduanya tetap ada
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    await expect(first).not.toHaveAttribute('data-node-id', await second.getAttribute('data-node-id'));
  });

  test('path kosong membuka menu dan membiarkannya terbuka', async ({ popup, hierarchy }) => {
    const layer = hierarchy.nodeByName('World Layer');

    await popup.selectContextMenu(layer, []);

    await expect(popup.activeMenus).toHaveCount(1);
    await expect(popup.activeMenus).toBeVisible();
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

    // Section 11 poin 6: caller mengirim test ID trigger secara eksplisit
    await controls.clickSelectAction(SCENE_OPTIONS, 'Delete Scene');
    await popup.confirmAction(/scene/i, { action: 'cancel' });
    await expect(hierarchy.sceneSelect).toContainText('Contract Scene');

    await controls.clickSelectAction(SCENE_OPTIONS, 'Delete Scene');
    await popup.confirmAction(/scene/i, { action: 'confirm' });
    await expect(hierarchy.sceneSelect).not.toContainText('Contract Scene');
  });
});

test.describe('@contract BaseControlHelper.clickSelectAction', () => {
  // Regresi untuk bug yang pernah ada: clickSelectAction sebelumnya punya
  // fallback hardcode `.or(scope.getByTestId('scene-options-button'))` di
  // dalam locator trigger-nya. Itu generic helper — kalau label/testid yang
  // diminta salah, helper akan diam-diam fallback ke tombol Scene Options
  // kalau kebetulan ada di scope yang sama, dan test tetap lolos padahal
  // mengklik elemen yang salah.
  //
  // Test ini memastikan: trigger yang benar-benar TIDAK ADA di scope harus
  // membuat pemanggilan GAGAL dengan jelas, bukan diam-diam fallback ke
  // tombol lain yang kebetulan ada.
  test('trigger dengan testid yang tidak ada di scope harus gagal, bukan fallback ke tombol lain', async ({ page, controls, hierarchy }) => {
    // Scene Options button memang ada di halaman (di luar scope layer section),
    // jadi ini skenario paling representatif untuk bug lama di atas.
    await expect(hierarchy.sceneSelect).toBeVisible();

    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    // 'Nonexistent Trigger Label' sengaja tidak match apa pun di dalam scope
    // worldLayer. Sebelum perbaikan, bug ini bisa membuat Playwright jatuh ke
    // tombol Scene Options di luar scope ini dan membuka menu Scene Options
    // alih-alih gagal. Scope di sini dibatasi ke worldLayer agar assersi ini
    // benar-benar menguji isolasi scope, bukan sekadar label yang salah.
    await expect(
      controls.clickSelectAction('Nonexistent Trigger Label', 'Some Action', worldLayer)
    ).rejects.toThrow();

    // Scene Options menu TIDAK boleh ikut kebuka akibat fallback yang salah.
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

import { expect } from '@playwright/test';

// Peta nama section -> testid PropertySection (lihat SceneTree.vue)
const SECTION_IDS = {
  world: 'hierarchy-section-world',
  ui: 'hierarchy-section-ui',
  'user interface': 'hierarchy-section-ui',
};

export class HierarchyPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ==========================================
  // LOCATORS - SCENE MANAGEMENT
  // ==========================================
  get sceneSelect() {
    return this.page.getByTestId('hierarchy-scene-select');
  }

  get sceneOptionsButton() {
    return this.page.getByTestId('hierarchy-scene-options-button');
  }

  // ==========================================
  // LOCATORS - HIERARCHY & LAYERS
  // ==========================================
  _sectionId(name) {
    const id = SECTION_IDS[name.toLowerCase()];
    if (!id) throw new Error(`Section '${name}' tidak dikenal. Pilihan: World, User Interface`);
    return id;
  }

  section(name) {
    return this.page.getByTestId(this._sectionId(name));
  }

  get nodes() {
    return this.page.getByTestId('hierarchy-node');
  }

  nodeByName(name) {
    const safe = name.replace(/"/g, '\\"');
    return this.page.locator(`[data-testid="hierarchy-node"][data-node-name="${safe}"]`).first();
  }

  nodeById(id) {
    return this.page.locator(`[data-testid="hierarchy-node"][data-node-id="${id}"]`);
  }

  // ==========================================
  // ACTIONS - SCENE MANAGEMENT
  // ==========================================
  async switchScene(sceneName) {
    await expect(this.sceneSelect).toBeVisible();

    // 1. Trigger click pada select button
    const triggerBtn = this.sceneSelect.getByRole('combobox').or(this.sceneSelect.locator('button')).first();
    await triggerBtn.click();

    // 2. Pastikan dropdown menu ter-teleport dan terbuka
    const dropdown = this.page.getByTestId('select-dropdown');
    await expect(dropdown).toBeVisible();

    // 3. Pilih option berdasarkan teks
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionItem = dropdown
      .getByTestId('select-option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(sceneName)}\\s*$`, 'i') })
      .or(dropdown.getByRole('option', { name: sceneName }))
      .first();

    await expect(optionItem).toBeVisible();
    await optionItem.click();

    // 4. Assert active scene berhasil berganti
    await expect(this.sceneSelect).toContainText(sceneName);
  }

  async createScene(controls, popup, sceneName) {
    await controls.clickSelectAction('hierarchy-scene-options-button', 'New Scene');
    await popup.fillPromptAndSubmit('New Scene', sceneName, 'OK');
    await expect(this.sceneSelect).toContainText(sceneName);
  }

  async deleteCurrentScene(controls, popup) {
    await expect(this.sceneSelect).toBeVisible();
    const currentSceneName = (await this.sceneSelect.textContent()).trim();

    // Trigger action Delete Scene dari dropdown
    await controls.clickSelectAction('hierarchy-scene-options-button', 'Delete Scene');

    // Tangani BaseConfirm Dialog secara presisi
    const confirmModal = this.page.getByTestId('base-confirm');
    await expect(confirmModal).toBeVisible();

    const confirmBtn = confirmModal.getByTestId('confirm-action-button');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Pastikan dialog tertutup
    await expect(confirmModal).toHaveCount(0);

    // Assert scene terhapus dari select
    await expect(this.sceneSelect).not.toContainText(currentSceneName);
  }

  // ==========================================
  // ACTIONS - HIERARCHY & LAYERS
  // ==========================================

  /**
   * Hover header section -> klik trigger menu (titik tiga) -> kembalikan locator menu.
   * Menu dicari lewat page (bukan section) karena BaseDropdown bisa me-teleport kontennya.
   */
  async openSectionMenu(sectionName) {
    const id = this._sectionId(sectionName);
    const section = this.section(sectionName);
    await section.scrollIntoViewIfNeeded();
    await section.getByTestId(`${id}-header`).hover();

    const trigger = section.getByTestId(`${id}-menu-trigger`);
    await expect(trigger).toBeVisible();
    await trigger.click();

    const menu = this.page.getByTestId(`${id}-menu`);
    await expect(menu).toBeVisible();
    return menu;
  }

  async addLayerToSection(popup, sectionName = 'World', layerName = 'New Layer') {
    const kind = this._sectionId(sectionName).replace('hierarchy-section-', ''); // 'world' | 'ui'
    const menu = await this.openSectionMenu(sectionName);
    await menu.getByTestId(`hierarchy-${kind}-add-layer-button`).click();

    // Tanpa .first(): jika ada dua "New Layer", strict mode harus gagal, bukan menyembunyikan ambiguitas.
    const created = this.section(sectionName)
      .locator('[data-testid="hierarchy-node"][data-node-name="New Layer"]');
    await expect(created).toBeVisible();

    if (layerName !== 'New Layer') {
      await popup.selectContextMenu(created, 'Rename Layer');
      await popup.fillPromptAndSubmit('Rename Layer', layerName, 'Rename');
      await expect(this.nodeByName(layerName)).toBeVisible();
    }
  }

  /** Himpunan data-node-id yang ada saat ini (dipakai sebagai "before" untuk expectNewNode). */
  async nodeIds() {
    let previous = null;
    await expect
      .poll(async () => {
        const ids = (await this.snapshot()).map((n) => n.id).sort().join('|');
        const stable = ids === previous;
        previous = ids;
        return stable;
      })
      .toBe(true);

    return new Set((await this.snapshot()).map((n) => n.id));
  }

  /**
   * Menunggu TEPAT satu node baru dibanding `beforeIds`, lalu mengembalikan locator-nya
   * berdasarkan data-node-id (Section 8). Tidak bergantung pada nama default atau
   * regex teks parsial (Section 7.3). Postcondition: node baru terlihat.
   */
  async expectNewNode(beforeIds) {
    let newId = null;
    await expect
      .poll(async () => {
        const added = (await this.snapshot()).filter((n) => !beforeIds.has(n.id));
        newId = added.length === 1 ? added[0].id : null;
        return added.length;
      })
      .toBe(1);

    const created = this.nodeById(newId);
    await expect(created).toBeVisible();
    return created;
  }

  /**
   * Membuat entity lewat context menu (mis. ['Add Entity', 'Sprite'] atau
   * ['Add Child', 'Sprite']) dan mengembalikan node barunya via identitas stabil.
   */
  async addEntity(popup, targetNode, menuPath) {
    const beforeIds = await this.nodeIds();
    await popup.selectContextMenu(targetNode, menuPath);
    return this.expectNewNode(beforeIds);
  }

  async dragAndDropNodes(sourceLocator, targetLocator) {
    await sourceLocator.scrollIntoViewIfNeeded();
    await targetLocator.scrollIntoViewIfNeeded();
    await sourceLocator.dragTo(targetLocator);
  }

  /**
   * Snapshot identitas seluruh node (id, name, parent, section) untuk perbandingan
   * before/after (Section 10). Hanya memakai atribut kontrak (Section 7.2); tidak ada
   * fallback ke textContent karena ikut menangkap badge/ikon dan membuat poll flaky.
   */
  async snapshot() {
    return await this.page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-testid="hierarchy-node"]'));
      return nodes.map((node) => ({
        id: node.getAttribute('data-node-id'),
        name: node.getAttribute('data-node-name'),
        parentId: node.getAttribute('data-parent-id') || null,
        section: node.closest('[data-section]')?.getAttribute('data-section') || null,
      }));
    });
  }
}

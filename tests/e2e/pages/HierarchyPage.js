import { expect } from '@playwright/test';

// Map section name -> testid PropertySection (see SceneTree.vue)
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
    if (!id) throw new Error(`Unknown section '${name}'. Options: World, User Interface`);
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

    // 1. Click the select button
    const triggerBtn = this.sceneSelect.getByRole('combobox').or(this.sceneSelect.locator('button')).first();
    await triggerBtn.click();

    // 2. Make sure the teleported dropdown menu is open
    const dropdown = this.page.getByTestId('select-dropdown');
    await expect(dropdown).toBeVisible();

    // 3. Choose the option by its text
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionItem = dropdown
      .getByTestId('select-option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(sceneName)}\\s*$`, 'i') })
      .or(dropdown.getByRole('option', { name: sceneName }))
      .first();

    await expect(optionItem).toBeVisible();
    await optionItem.click();

    // 4. Assert the active scene changed
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

    // Trigger the Delete Scene action from the dropdown
    await controls.clickSelectAction('hierarchy-scene-options-button', 'Delete Scene');

    // Handle the BaseConfirm dialog precisely
    const confirmModal = this.page.getByTestId('base-confirm');
    await expect(confirmModal).toBeVisible();

    const confirmBtn = confirmModal.getByTestId('confirm-action-button');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Make sure the dialog is closed
    await expect(confirmModal).toHaveCount(0);

    // Assert the scene is gone from the select
    await expect(this.sceneSelect).not.toContainText(currentSceneName);
  }

  // ==========================================
  // ACTIONS - HIERARCHY & LAYERS
  // ==========================================

  /**
   * Hover the section header -> click the menu trigger (three dots) -> return the menu locator.
   * The menu is located from the page (not the section) because BaseDropdown may teleport its content.
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

    // No .first(): if two "New Layer" items exist, strict mode must fail instead of hiding the ambiguity.
    const created = this.section(sectionName)
      .locator('[data-testid="hierarchy-node"][data-node-name="New Layer"]');
    await expect(created).toBeVisible();

    if (layerName !== 'New Layer') {
      await popup.selectContextMenu(created, 'Rename Layer');
      await popup.fillPromptAndSubmit('Rename Layer', layerName, 'Rename');
      await expect(this.nodeByName(layerName)).toBeVisible();
    }
  }

  /** Set of data-node-id values currently present (used as the "before" state for expectNewNode). */
  async nodeIds() {
    let previous = null;
    await expect
      .poll(async () => {
        const ids = (await this.snapshot()).map((n) => n.id).sort().join('|');
        const stable = ids !== '' && ids === previous;
        previous = ids;
        return stable;
      })
      .toBe(true);

    return new Set((await this.snapshot()).map((n) => n.id));
  }

  /**
   * Waits for EXACTLY one new node compared with `beforeIds`, then returns its locator
   * by data-node-id (Section 8). It does not depend on the default name or on
   * partial text regex (Section 7.3). Postcondition: the new node is visible.
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
   * Creates an entity through the context menu (e.g. ['Add Entity', 'Sprite'] or
   * ['Add Child', 'Sprite']) and returns the new node through its stable identity.
   */
  async addEntity(popup, targetNode, menuPath) {
    await expect(targetNode).toBeVisible();
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
   * Identity snapshot of every node (id, name, parent, section) for
   * before/after comparison (Section 10). Uses contract attributes only (Section 7.2); no
   * textContent fallback, because it also captures badges/icons and makes the poll flaky.
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

import { expect } from '@playwright/test';

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
    return this.page.getByTestId('scene-select');
  }

  get sceneOptionsButton() {
    return this.page.getByTestId('scene-options-button');
  }

  // ==========================================
  // LOCATORS - HIERARCHY & LAYERS
  // ==========================================
  section(name) {
    return this.page
      .getByRole('region', { name })
      .or(this.page.locator(`[data-section="${name.toLowerCase()}"]`))
      .or(this.page.locator('.group\\/section').filter({ hasText: name }))
      .first();
  }

  nodeByName(name) {
    return this.page
      .locator(`[data-node-name="${name}"]`)
      .or(this.page.locator('.group\\/node', { hasText: name }))
      .first();
  }

  nodeById(id) {
    return this.page.locator(`[data-node-id="${id}"]`);
  }

  nodesByText(pattern) {
    return this.page.locator('[data-node-name]').or(this.page.locator('.group\\/node')).filter({ hasText: pattern });
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
    await controls.clickSelectAction('Scene Options', 'New Scene');
    await popup.fillPromptAndSubmit('New Scene', sceneName, 'OK');
    await expect(this.sceneSelect).toContainText(sceneName);
  }

  async deleteCurrentScene(controls, popup) {
    await expect(this.sceneSelect).toBeVisible();
    const currentSceneName = (await this.sceneSelect.textContent()).trim();

    // Trigger action Delete Scene dari dropdown
    await controls.clickSelectAction('Scene Options', 'Delete Scene');

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
  async addLayerToSection(popup, sectionName = 'World', layerName = 'New Layer') {
    const sectionContainer = this.section(sectionName);
    await sectionContainer.scrollIntoViewIfNeeded();

    const header = sectionContainer.locator('> div').first();
    await header.hover();

    const addBtn = sectionContainer
      .getByRole('button', { name: /add layer/i })
      .or(sectionContainer.locator('button'))
      .first();
    await addBtn.click();

    const isUI = /user interface|ui/i.test(sectionName);
    const option = this.page.getByRole('button', { name: isUI ? /^Add UI Layer$/i : /^Add World Layer$/i });
    await expect(option).toBeVisible();
    await option.click();

    const created = sectionContainer
      .locator('[data-node-name="New Layer"]')
      .or(sectionContainer.locator('.group\\/node', { hasText: 'New Layer' }))
      .first();
    await expect(created).toBeVisible();

    if (layerName !== 'New Layer') {
      await popup.selectContextMenu(created, 'Rename Layer');
      await popup.fillPromptAndSubmit('Rename Layer', layerName, 'Rename');
      await expect(this.nodeByName(layerName)).toBeVisible();
    }
  }

  async dragAndDropNodes(sourceLocator, targetLocator) {
    await sourceLocator.scrollIntoViewIfNeeded();
    await targetLocator.scrollIntoViewIfNeeded();
    await sourceLocator.dragTo(targetLocator);
  }

  async snapshot() {
    return await this.page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-node-id]'));
      return nodes.map((node) => ({
        id: node.getAttribute('data-node-id'),
        name: node.getAttribute('data-node-name') || node.textContent?.trim(),
        parentId: node.getAttribute('data-parent-id') || null,
        section: node.closest('[data-section]')?.getAttribute('data-section') || null,
      }));
    });
  }
}


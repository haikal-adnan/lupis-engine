import { expect } from '@playwright/test';

export class HierarchyPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // Locators
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

  // Actions
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

    const created = sectionContainer.locator('[data-node-name="New Layer"]').or(sectionContainer.locator('.group\\/node', { hasText: 'New Layer' })).first();
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

  /**
   * Mengambil snapshot struktur hirarki untuk perbandingan Before/After pada [Bad Path]
   */
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
import { expect } from '@playwright/test';

export class VariablePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.manageBtn = page.getByTestId('variable-panel-manage-btn');
    this.modal = page.locator('.fixed.inset-0').filter({ hasText: 'Variables' });

    this.globalScopeBtn = page.getByTestId('variable-modal-scope-global-btn');
    this.localScopeBtn = page.getByTestId('variable-modal-scope-local-btn');
    
    // Direct target ke elemen input internal di dalam BaseSearchInput
    this.searchInput = page.getByTestId('variable-modal-search-input').locator('input');
    
    this.addBtn = page.getByTestId('variable-modal-add-btn');
    this.closeBtn = page.getByTestId('variable-modal-close-btn');

    this.rawEditorBtn = page.getByTestId('variable-modal-raw-editor-btn');
    this.rawJsonTextarea = page.getByTestId('variable-modal-raw-json-textarea');
    this.rawJsonApplyBtn = page.getByTestId('variable-modal-raw-json-apply-btn');
  }

  async openManager() {
    await this.manageBtn.scrollIntoViewIfNeeded();
    await expect(this.manageBtn).toBeVisible();
    await this.manageBtn.click();
    await expect(this.modal).toBeVisible();
  }

  async closeManager() {
    await this.closeBtn.click();
    await expect(this.modal).toBeHidden();
  }

  async switchModalScope(scope = 'Local') {
    if (scope === 'Global') {
      await this.globalScopeBtn.click();
    } else {
      await this.localScopeBtn.click();
    }
  }

  /**
   * Mengambil elemen baris variabel berdasarkan atribut data-variable-name atau nilai input nama
   */
  itemRowByName(name) {
    return this.modal
      .locator(`[data-testid="variable-modal-item-row"][data-variable-name="${name}"]`)
      .or(
        this.modal.getByTestId('variable-modal-item-row').filter({
          has: this.page.locator(`input[value="${name}"]`)
        })
      )
      .locator('nth=0');
  }

  /**
   * Mengambil elemen baris variabel exposed pada Property Inspector panel
   */
  panelItemRow(name, scope) {
    return this.page
      .locator(`[data-testid="variable-panel-item-row"][data-variable-name="${name}"][data-scope="${scope}"]`)
      .locator('nth=0');
  }

  async createVariable({ name = 'NewVar', type = 'string', isExposed = false, scope = 'Local' }) {
    await this.switchModalScope(scope);
    await this.addBtn.click();

    const lastRow = this.modal.getByTestId('variable-modal-item-row').locator('nth=-1');
    await expect(lastRow).toBeVisible();

    const nameInput = lastRow.getByTestId('variable-modal-name-input');
    await nameInput.fill(name);
    await nameInput.blur();

    if (type !== 'string') {
      const typeSelect = lastRow.getByTestId('variable-modal-type-select');
      await typeSelect.click();
      const option = this.page.getByTestId('select-option').filter({ hasText: new RegExp(`^\\s*${type}\\s*$`, 'i') }).locator('nth=0');
      await option.click();
    }

    if (isExposed) {
      const exposeCheckbox = lastRow.getByTestId('variable-modal-expose-checkbox');
      await exposeCheckbox.check();
    }

    return lastRow;
  }
}
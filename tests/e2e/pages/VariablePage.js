import { expect } from '@playwright/test';

export class VariablePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.manageBtn = page.getByTestId('variable-panel-manage-btn');
    this.modal = page.getByTestId('variable-modal')
      .or(page.locator('.fixed.inset-0').filter({ hasText: 'Variables' }))
      .first();

    this.globalScopeBtn = page.getByTestId('variable-modal-scope-global-btn');
    this.localScopeBtn = page.getByTestId('variable-modal-scope-local-btn');
    
    // Target langsung elemen input internal di dalam komponen BaseSearchInput
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

  itemRowByName(name) {
    return this.modal
      .getByTestId('variable-modal-item-row')
      .filter({
        has: this.page.locator(`[data-testid="variable-modal-name-input"][value="${name}"], input[value="${name}"]`)
      })
      .or(
        this.modal.locator(`[data-testid="variable-modal-item-row"][data-variable-name="${name}"]`)
      )
      .first();
  }

  panelItemRow(name, scope) {
    return this.page
      .locator(`[data-testid="variable-panel-item-row"][data-variable-name="${name}"][data-scope="${scope}"]`)
      .or(this.page.locator(`[data-testid="variable-panel-item-row"][data-variable-name="${name}"]`))
      .first();
  }

  async createVariable({ name = 'NewVar', type = 'string', isExposed = false, scope = 'Local' }) {
    await this.switchModalScope(scope);
    await this.addBtn.click();

    const lastRow = this.modal.getByTestId('variable-modal-item-row').last();
    await expect(lastRow).toBeVisible();

    const nameInput = lastRow.getByTestId('variable-modal-name-input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);
    await nameInput.blur();

    if (type !== 'string') {
      const typeSelect = lastRow.getByTestId('variable-modal-type-select').first();
      const isSelect = await typeSelect.evaluate(el => el.tagName.toLowerCase() === 'select').catch(() => false);
      
      if (isSelect) {
        await typeSelect.selectOption({ label: type }).catch(async () => {
          await typeSelect.selectOption(type);
        });
      } else {
        await typeSelect.click();
        const option = this.page.getByTestId('select-option')
          .filter({ hasText: new RegExp(`^\\s*${type}\\s*$`, 'i') })
          .first();
        await option.click();
      }
    }

    if (isExposed) {
      const exposeCheckbox = lastRow.getByTestId('variable-modal-expose-checkbox');
      await exposeCheckbox.check().catch(async () => await exposeCheckbox.click());
    }

    return lastRow;
  }
}
// lokasi: tests/e2e/pages/CodePanelPage.js
import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export class CodePanelPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.controls = new BaseControlHelper(page);
  }

  get textarea() {
    return this.page.locator('textarea.code-textarea');
  }

  get resetBtn() {
    return this.page.getByTestId('codepanel-reset-code-btn');
  }

  get bottomNodeTitle() {
    return this.page.getByTestId('codepanel-bottom-node-title');
  }

  get customIndicator() {
    return this.page.getByTestId('codepanel-custom-node-indicator');
  }

  get systemIndicator() {
    return this.page.getByTestId('codepanel-system-node-indicator');
  }

  get unlockBtn() {
    return this.page.getByTestId('codepanel-unlock-btn');
  }

  get statusSynced() {
    return this.page.getByText('Synced').first();
  }

  get statusSaving() {
    return this.page.getByText('Saving...').first();
  }

  get statusNoIssues() {
    return this.page.getByText('No Issues').first();
  }

  get statusSyntaxError() {
    return this.page.getByText('Syntax Error').first();
  }

  get statusWarnings() {
    return this.page.getByText(/Warnings \(\d+\)/).first();
  }

  async ensureReady() {
    await expect(this.textarea).toBeVisible();
  }

  async setCode(code) {
    await expect(this.textarea).toBeVisible();
    await this.textarea.fill(code);
  }

  async resetCode() {
    await expect(this.resetBtn).toBeVisible();
    await this.resetBtn.click();
    const confirmModal = this.page.getByTestId('base-confirm');
    await expect(confirmModal).toBeVisible();
    await confirmModal.getByTestId('confirm-action-button').click();
    await expect(confirmModal).toHaveCount(0);
  }

  async unlockToCustom() {
    await expect(this.unlockBtn).toBeVisible();
    await this.unlockBtn.click();
    const confirmModal = this.page.getByTestId('base-confirm');
    await expect(confirmModal).toBeVisible();
    await confirmModal.getByTestId('confirm-action-button').click();
    await expect(confirmModal).toHaveCount(0);
    await expect(this.customIndicator).toBeVisible();
  }

  async closeCodeTab() {
    const activeCodeTab = this.page.locator('[data-testid="base-tab"][aria-selected="true"]');
    await expect(activeCodeTab).toBeVisible();
    const closeBtn = activeCodeTab.getByTestId('close-tab-button');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
  }
}

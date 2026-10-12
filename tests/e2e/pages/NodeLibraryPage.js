import { expect } from '@playwright/test';

export class NodeLibraryPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Sidebar
    this.openModalBtn = page.getByTestId('node-library-open-modal-btn');
    this.sidebarSearchInput = page.getByTestId('node-library-sidebar-search-input');
    this.sidebarSearchClearBtn = page.getByTestId('node-library-sidebar-search-clear-button');
    this.sidebarNoResults = page.getByTestId('node-library-sidebar-no-results');
    this.sidebarSearchResults = page.getByTestId('node-library-sidebar-search-results');
    this.sidebarSearchItems = this.sidebarSearchResults.getByTestId('node-library-sidebar-search-item');

    // Modal
    this.modal = page.getByTestId('node-library-modal');
    this.modalCloseBtn = page.getByTestId('node-library-modal-close-btn');
    this.modalSearchInput = page.getByTestId('node-library-modal-search-input');
    this.modalSearchClearBtn = page.getByTestId('node-library-modal-search-clear-button');
    this.modalBackBtn = page.getByTestId('node-library-modal-back-btn');
    this.modalNoResults = page.getByTestId('node-library-modal-no-results');
    this.modalCategoryCards = this.modal.getByTestId('node-library-modal-category-card');

    this.modalCategoryItems = this.modal.getByTestId('node-library-modal-category-items');
    this.modalSearchResults = this.modal.getByTestId('node-library-modal-search-results');
    this.modalItems = this.modalCategoryItems.or(this.modalSearchResults).locator('[data-node-type]');
  }

  // ==========================================
  // MODAL
  // ==========================================
  async openModal() {
    await this.openModalBtn.scrollIntoViewIfNeeded();
    await this.openModalBtn.click();
    await expect(this.modal).toBeVisible();
  }

  async closeModal() {
    await this.modalCloseBtn.click();
    await expect(this.modal).toBeHidden();
  }

  async searchInModal(query) {
    await this.modalSearchInput.fill(query);
    await expect(this.modalSearchInput).toHaveValue(query);
  }

  async clearModalSearch() {
    if ((await this.modalSearchClearBtn.count()) > 0) {
      await this.modalSearchClearBtn.click();
    } else {
      await this.modalSearchInput.fill('');
    }
    await expect(this.modalSearchInput).toHaveValue('');
  }

  async ensureCategoryList() {
    if ((await this.modalSearchInput.inputValue()) !== '') {
      await this.clearModalSearch();
    }
    const anyCard = this.modalCategoryCards.first();
    await expect(this.modalBackBtn.or(anyCard)).toBeVisible();

    if ((await this.modalBackBtn.count()) > 0) {
      await this.modalBackBtn.click();
    }
    await expect(anyCard).toBeVisible();
  }

  async openCategory(categoryLabel) {
    await this.ensureCategoryList();

    const card = this.modal.locator(
      `[data-testid="node-library-modal-category-card"][data-category-label="${categoryLabel}" i]`
    );

    try {
      await expect(card).toBeVisible();
    } catch (error) {
      const available = await this.modalCategoryCards.evaluateAll((els) =>
        els.map((el) => el.dataset.categoryLabel)
      );
      throw new Error(
        `Kategori "${categoryLabel}" tidak ditemukan. Label yang tersedia: [${available.join(', ')}]`,
        { cause: error }
      );
    }

    await card.click();
    await expect(this.modalBackBtn).toBeVisible();
  }

  /** Locator item node di dalam modal (daftar kategori maupun hasil search). */
  modalItemByType(nodeType) {
    return this.modalItems.and(this.page.locator(`[data-node-type="${nodeType}"]`)).first();
  }

  async firstModalItemLabel() {
    const item = this.modalItems.first();
    await expect(item).toBeVisible();
    return item.getAttribute('data-node-label');
  }

  modalItemByLabel(label) {
    return this.modalItems.filter({ hasText: label }).first();
  }

  modalRecentItemByType(nodeType) {
    return this.modal
      .locator(`[data-testid="node-library-modal-recent-item"][data-node-type="${nodeType}"]`)
      .first();
  }

  // ==========================================
  // SIDEBAR
  // ==========================================
  async searchInSidebar(query) {
    await this.sidebarSearchInput.fill(query);
    await expect(this.sidebarSearchInput).toHaveValue(query);
  }

  async clearSidebarSearch() {
    if ((await this.sidebarSearchClearBtn.count()) > 0) {
      await this.sidebarSearchClearBtn.click();
    } else {
      await this.sidebarSearchInput.fill('');
    }
    await expect(this.sidebarSearchInput).toHaveValue('');
  }

  sidebarSearchItemByType(nodeType) {
    return this.sidebarSearchResults
      .locator(`[data-testid="node-library-sidebar-search-item"][data-node-type="${nodeType}"]`)
      .first();
  }

  sidebarRecentItemByType(nodeType) {
    return this.page
      .locator(`[data-testid="node-library-sidebar-recent-item"][data-node-type="${nodeType}"]`)
      .first();
  }

  /** Hasil search sidebar yang berasal dari satu grup (label grup tampil di tiap item). */
  sidebarSearchItemsInGroup(groupLabel) {
    return this.sidebarSearchItems.filter({
      has: this.page.getByText(groupLabel, { exact: true }),
    });
  }

  /** Search sidebar memakai label grup (pasti ada hasilnya), lalu double-click item ke-`index`. Mengembalikan type. */
  async addFromSidebarGroup(groupLabel, index = 0) {
    await this.searchInSidebar(groupLabel);
    const item = this.sidebarSearchItemsInGroup(groupLabel).nth(index);
    await expect(item).toBeVisible();

    const type = await item.getAttribute('data-node-type');
    await item.dblclick();
    return type;
  }

  /** Semua node type dari satu grup pada hasil search sidebar. */
  async sidebarGroupTypes(groupLabel) {
    await this.searchInSidebar(groupLabel);
    const items = this.sidebarSearchItemsInGroup(groupLabel);
    await expect(items.first()).toBeVisible();
    return items.evaluateAll((els) => els.map((el) => el.dataset.nodeType));
  }

  /** Buka modal -> kategori -> double-click item pertama -> tunggu modal lepas. Mengembalikan type. */
  async addFirstFromModalCategory(categoryLabel) {
    await this.openModal();
    await this.openCategory(categoryLabel);

    const item = this.modalItems.first();
    await expect(item).toBeVisible();
    const type = await item.getAttribute('data-node-type');

    await item.dblclick();
    await expect(this.modal).toBeHidden();
    return type;
  }
}
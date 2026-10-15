/**
 * Page object for the Dashboard (project list).
 * Locators and navigation only; flow actions (create/open project) live in flows/dashboard.js.
 */
export class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  get createModal() {
    return this.page.getByRole('dialog', { name: 'New Project' });
  }

  card(name) {
    return this.page.locator(`[data-testid="project-card"][data-project-name="${name}"]`);
  }

  cardDescription(name) {
    return this.card(name).getByTestId('project-description');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }
}

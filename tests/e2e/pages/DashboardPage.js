/**
 * Page object untuk Dashboard (daftar project).
 * Hanya locator dan navigasi; aksi alur (buat/buka project) ada di flows/dashboard.js.
 */
export class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  get createModal() {
    return this.page.getByRole('dialog', { name: 'Buat Proyek Baru' });
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

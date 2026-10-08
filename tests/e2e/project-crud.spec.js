import { test, expect } from '@playwright/test';
import { BaseControlHelper } from './components/BaseControlHelper.js';
import { PopupHelper } from './components/PopupHelper.js';

test.describe('Project Management E2E', () => {
  let controls;
  let popup;

  test.beforeEach(async ({ page }) => {
    controls = new BaseControlHelper(page);
    popup = new PopupHelper(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('creates a new project and redirects to editor workspace', async ({ page }, testInfo) => {
    // Arrange
    const projectName = `E2E Game ${testInfo.testId}`;
    const projectDesc = 'Isolated test project for creation workflow';

    // Act
    await controls.clickButton('create-project-btn');
    
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await expect(modal).toBeVisible();

    await controls.fillInput('project-name-input', projectName, modal);
    await controls.fillInput('project-desc-input', projectDesc, modal);
    await controls.clickButton('submit-create-project-btn', modal);

    // Assert
    await expect(page).toHaveURL(/\/editor\/.+/);
  });

  test('renders created project card on dashboard with accurate metadata', async ({ page }, testInfo) => {
    // Arrange
    const projectName = `Dashboard Card ${testInfo.testId}`;
    const projectDesc = 'Metadata validation on dashboard';

    await controls.clickButton('create-project-btn');
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });

    await controls.fillInput('project-name-input', projectName, modal);
    await controls.fillInput('project-desc-input', projectDesc, modal);
    await controls.clickButton('submit-create-project-btn', modal);

    await expect(page).toHaveURL(/\/editor\/.+/);

    // Act
    await page.goto('/');

    // Assert
    const card = page.locator(`[data-testid="project-card"][data-project-name="${projectName}"]`);
    await expect(card).toBeVisible();
    await expect(card.getByTestId('project-description')).toHaveText(projectDesc);
  });

  test('renames an existing project via context menu', async ({ page }, testInfo) => {
    // Arrange
    const initialName = `Old Name ${testInfo.testId}`;
    const updatedName = `New Name ${testInfo.testId}`;

    await controls.clickButton('create-project-btn');
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await controls.fillInput('project-name-input', initialName, modal);
    await controls.clickButton('submit-create-project-btn', modal);
    await expect(page).toHaveURL(/\/editor\/.+/);

    await page.goto('/');
    const card = page.locator(`[data-testid="project-card"][data-project-name="${initialName}"]`);
    await expect(card).toBeVisible();

    // Act
    await popup.selectContextMenu(card, 'Rename');
    await popup.fillPromptAndSubmit('Rename Project', updatedName, 'Save');

    // Assert
    const updatedCard = page.locator(`[data-testid="project-card"][data-project-name="${updatedName}"]`);
    await expect(updatedCard).toBeVisible();
    await expect(card).toHaveCount(0);
  });

  test('updates project description via context menu', async ({ page }, testInfo) => {
    // Arrange
    const projectName = `Desc Update ${testInfo.testId}`;
    const newDesc = 'Updated description content via E2E test';

    await controls.clickButton('create-project-btn');
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await controls.fillInput('project-name-input', projectName, modal);
    await controls.clickButton('submit-create-project-btn', modal);
    await expect(page).toHaveURL(/\/editor\/.+/);

    await page.goto('/');
    const card = page.locator(`[data-testid="project-card"][data-project-name="${projectName}"]`);

    // Act
    await popup.selectContextMenu(card, 'Edit Description');
    await popup.fillPromptAndSubmit('Edit Description', newDesc, 'Save');

    // Assert
    await expect(card.getByTestId('project-description')).toHaveText(newDesc);
  });

  test('deletes a project and removes card from DOM', async ({ page }, testInfo) => {
  // Arrange
    const projectName = `Delete Me ${testInfo.testId}`;

    await controls.clickButton('create-project-btn');
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await controls.fillInput('project-name-input', projectName, modal);
    await controls.clickButton('submit-create-project-btn', modal);
    await expect(page).toHaveURL(/\/editor\/.+/);

    await page.goto('/');
    const card = page.locator(`[data-testid="project-card"][data-project-name="${projectName}"]`);
    await expect(card).toBeVisible();

    // Act: Trigger delete via context menu
    await popup.selectContextMenu(card, 'Delete Project');

    // Assert & Confirm (Cocokkan dengan teks judul/pesan confirm pada composable)
    await popup.confirmAction('Delete', { confirmText: 'Delete' });

    // Assert: Node terhapus dari DOM
    await expect(card).toHaveCount(0);
  });

  test('[Bad Path] disables submission when project name is empty', async ({ page }) => {
    // Act
    await controls.clickButton('create-project-btn');
    const modal = page.getByRole('dialog', { name: 'Buat Proyek Baru' });
    await expect(modal).toBeVisible();

    const submitBtn = modal.getByTestId('submit-create-project-btn');

    // Assert
    await expect(submitBtn).toBeDisabled();

    // Act
    await controls.fillInput('project-name-input', '   ', modal);

    // Assert
    await expect(submitBtn).toBeDisabled();
  });
});
import { test, expect } from '../fixtures.js';
import { ensureProject } from '../flows/dashboard.js';

// This spec tests the dashboard / project creation flow, so it does NOT use the automatic
// project isolation from fixtures. Each test creates its own project (via the UI in tests 1 & 6,
// via the ensureProject flow as setup in tests 2-5).
test.use({ isolatedProject: false });

test.describe('Project Management E2E', () => {
  test.beforeEach(async ({ dashboard }) => {
    await dashboard.goto();
  });

  test('creates a new project and redirects to editor workspace', async ({ page, controls, dashboard }, testInfo) => {
    // Arrange
    const projectName = `E2E Game ${testInfo.testId}`;
    const projectDesc = 'Isolated test project for creation workflow';

    // Act
    await controls.clickButton('create-project-btn');

    const modal = dashboard.createModal;
    await expect(modal).toBeVisible();

    await controls.fillInput('project-name-input', projectName, modal);
    await controls.fillInput('project-desc-input', projectDesc, modal);
    await controls.clickButton('submit-create-project-btn', modal);

    // Assert
    await expect(page).toHaveURL(/\/editor\/.+/);
  });

  test('renders created project card on dashboard with accurate metadata', async ({ page, dashboard }, testInfo) => {
    // Arrange
    const projectName = `Dashboard Card ${testInfo.testId}`;
    const projectDesc = 'Metadata validation on dashboard';

    await ensureProject(page, { name: projectName, description: projectDesc });

    // Act
    await dashboard.goto();

    // Assert
    await expect(dashboard.card(projectName)).toBeVisible();
    await expect(dashboard.cardDescription(projectName)).toHaveText(projectDesc);
  });

  test('renames an existing project via context menu', async ({ page, dashboard, popup }, testInfo) => {
    // Arrange
    const initialName = `Old Name ${testInfo.testId}`;
    const updatedName = `New Name ${testInfo.testId}`;

    await ensureProject(page, { name: initialName });

    await dashboard.goto();
    const card = dashboard.card(initialName);
    await expect(card).toBeVisible();

    // Act
    await popup.selectContextMenu(card, 'Rename');
    await popup.fillPromptAndSubmit('Rename Project', updatedName, 'Save');

    // Assert
    await expect(dashboard.card(updatedName)).toBeVisible();
    await expect(card).toHaveCount(0);
  });

  test('updates project description via context menu', async ({ page, dashboard, popup }, testInfo) => {
    // Arrange
    const projectName = `Desc Update ${testInfo.testId}`;
    const newDesc = 'Updated description content via E2E test';

    await ensureProject(page, { name: projectName });

    await dashboard.goto();
    const card = dashboard.card(projectName);

    // Act
    await popup.selectContextMenu(card, 'Edit Description');
    await popup.fillPromptAndSubmit('Edit Description', newDesc, 'Save');

    // Assert
    await expect(dashboard.cardDescription(projectName)).toHaveText(newDesc);
  });

  test('deletes a project and removes card from DOM', async ({ page, dashboard, popup }, testInfo) => {
    // Arrange
    const projectName = `Delete Me ${testInfo.testId}`;

    await ensureProject(page, { name: projectName });

    await dashboard.goto();
    const card = dashboard.card(projectName);
    await expect(card).toBeVisible();

    // Act: Trigger delete via context menu
    await popup.selectContextMenu(card, 'Delete Project');

    // Assert & confirm (match the confirm title/message text from the composable)
    await popup.confirmAction('Delete', { confirmText: 'Delete' });

    // Assert: the node is removed from the DOM
    await expect(card).toHaveCount(0);
  });

  test('[Bad Path] disables submission when project name is empty', async ({ controls, dashboard }) => {
    // Act
    await controls.clickButton('create-project-btn');
    const modal = dashboard.createModal;
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
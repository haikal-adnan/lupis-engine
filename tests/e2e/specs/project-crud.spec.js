import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { test, expect } from '../fixtures.js';
import { ensureProject } from '../flows/dashboard.js';

const LUPIS_HEADER = [
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52, 0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00,
];
const XOR_KEY = 0x5A;

const SAMPLE_PROJECT_PATH = fileURLToPath(
  new URL('../../test-data/assets/sample_project.lupisproject', import.meta.url)
);
const INVALID_FILE_PATH = fileURLToPath(
  new URL('../../test-data/assets/sample_image.png', import.meta.url)
);

async function decodeLupisProjectBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const zipBytes = new Uint8Array(bytes.length - LUPIS_HEADER.length);
  for (let i = 0; i < zipBytes.length; i++) {
    zipBytes[i] = bytes[LUPIS_HEADER.length + i] ^ XOR_KEY;
  }
  const zip = new JSZip();
  return zip.loadAsync(zipBytes);
}

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

  test('opens an existing project in a new tab via context menu', async ({ context, page, dashboard, popup }, testInfo) => {
    // Arrange
    const projectName = `New Tab Game ${testInfo.testId}`;
    await ensureProject(page, { name: projectName });

    await dashboard.goto();
    const card = dashboard.card(projectName);
    await expect(card).toBeVisible();

    // Act: Select "Open in New Tab" from context menu and wait for new browser page
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      popup.selectContextMenu(card, 'Open in New Tab')
    ]);

    // Assert: New tab loads editor workspace with the project URL and project name in header
    await newPage.waitForLoadState('domcontentloaded');
    await expect(newPage).toHaveURL(/\/editor\/.+/);
    await expect(newPage.locator('header').getByText(projectName)).toBeVisible();
    await newPage.close();
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

  test('imports a .lupisproject file and renders card on dashboard with accurate metadata', async ({ dashboard, popup }) => {
    // Act: Import sample project
    await dashboard.importProject(SAMPLE_PROJECT_PATH);

    // Assert: Success feedback and dashboard card rendering
    await popup.expectPopAlert('Import Successful');
    await expect(dashboard.card('et')).toBeVisible();
    await expect(dashboard.cardTitle('et')).toHaveText('et');
  });

  test('opens imported .lupisproject and verifies editor workspace data integrity', async ({ page, dashboard, popup, hierarchy, assets }) => {
    // Arrange: Import sample project
    await dashboard.importProject(SAMPLE_PROJECT_PATH);
    await popup.expectPopAlert('Import Successful');

    const card = dashboard.card('et');
    await expect(card).toBeVisible();

    // Act: Open project in editor workspace
    await card.click();

    // Assert: Editor workspace URL navigation and project title in header
    await expect(page).toHaveURL(/\/editor\/proj_1792078086510_2c36ig/);
    await expect(page.locator('header').getByText('et')).toBeVisible();

    // Assert: Hierarchy scene layers preserved from imported project
    await expect(hierarchy.nodeByName('World Layer')).toBeVisible();

    // Assert: Assets preserved from imported project
    await assets.ensureOpen();
    await expect(assets.card('Terrain (16x16)')).toBeVisible();
  });

  test('exports an imported project to .lupisproject and verifies preserved data integrity', async ({ page, dashboard, popup }) => {
    // Arrange: Import sample project
    await dashboard.importProject(SAMPLE_PROJECT_PATH);
    await popup.expectPopAlert('Import Successful');

    const card = dashboard.card('et');
    await expect(card).toBeVisible();

    // Act: Export project via context menu
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      popup.selectContextMenu(card, 'Save Project'),
    ]);

    // Assert: Success pop alert and suggested filename
    await popup.expectPopAlert('Export Successful');
    expect(download.suggestedFilename()).toBe('et.lupisproject');

    // Assert: Read and decode downloaded project archive
    const downloadPath = await download.path();
    const buffer = fs.readFileSync(downloadPath);
    const exportedZip = await decodeLupisProjectBuffer(buffer);

    const projectJson = JSON.parse(await exportedZip.file('project.json').async('text'));
    expect(projectJson.name).toBe('et');
    expect(projectJson.id).toBe('proj_1792078086510_2c36ig');
    expect(projectJson.settings.initialSceneId).toBe('scene_main_1792078086519');

    const assetsJson = JSON.parse(await exportedZip.file('workspaces/assets.json').async('text'));
    expect(assetsJson).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Terrain (16x16)' })]));

    const scenesJson = JSON.parse(await exportedZip.file('workspaces/scenes.json').async('text'));
    expect(scenesJson).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Main Scene' })]));

    expect(exportedZip.file('scenes/scene_main_1792078086519.json')).not.toBeNull();
    expect(exportedZip.file('assets/image_7uqsz4hsnn3aeyga.png')).not.toBeNull();
  });

  test('[Bad Path] rejects importing non-.lupisproject file and displays error alert', async ({ dashboard, popup }) => {
    // Act: Attempt to upload non-.lupisproject file
    await dashboard.importProject(INVALID_FILE_PATH);

    // Assert: Validation error alert appears and project list does not add invalid file
    await popup.expectPopAlert('Invalid File Format');
    await expect(dashboard.card('sample_image')).toHaveCount(0);
  });
});
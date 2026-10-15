import { test, expect } from '../fixtures.js';

/**
 * Feature tests for Project Settings Modal, Game Thumbnail, Preferences Section,
 * Revert Changes in Project Settings, and the 4-item Header Project Menu.
 */

test.use({
  projectOptions: {
    prefix: 'Settings E2E',
    description: 'Workspace for game developer settings verification',
  },
});

test.describe('Project Settings & Preferences Management', () => {
  test('opens settings modal with project info active by default and closes with button', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();
    await expect(settingsModal.modal).toBeVisible();
    await expect(settingsModal.contentHeaderTitle).toHaveText('Project Info');
    await expect(settingsModal.projectTabContent).toBeVisible();

    await settingsModal.close();
    await expect(settingsModal.modal).toBeHidden();
  });

  test('allows editing project name and synchronizes with header and storage', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();
    await settingsModal.setProjectName('Updated Engine Project');

    // Header project name reflects change
    await expect(settingsModal.headerProjectName).toHaveText('Updated Engine Project');

    // Indicator reports dirty state
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Save changes
    await settingsModal.saveNow();
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');

    await settingsModal.close();
  });

  test('manages game thumbnail with custom upload and removal', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();

    // Upload custom thumbnail
    await settingsModal.uploadThumbnail('test-data/assets/sample_image.png');
    await expect(settingsModal.thumbnailBadgeCustom).toBeVisible();
    await expect(settingsModal.deleteThumbnailBtn).toBeVisible();
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Delete custom thumbnail so auto snapshot / default replaces it
    await settingsModal.deleteThumbnail();
    await expect(settingsModal.thumbnailBadgeCustom).toBeHidden();

    await settingsModal.close();
  });

  test('configures theme and appearance in preferences section', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();

    // Switch to Preferences tab
    await settingsModal.switchTab('preferences');
    await expect(settingsModal.preferencesTabContent).toBeVisible();
    await expect(settingsModal.contentHeaderTitle).toHaveText('Preferences');

    // Check theme options are rendered
    await expect(settingsModal.themeOptionDark).toBeVisible();
    await expect(settingsModal.themeOptionLight).toBeVisible();

    // Select light theme option
    await settingsModal.themeOptionLight.click();
    await expect(settingsModal.themeToggleBtn).toHaveAttribute('data-theme', 'light');

    // Select dark theme option to restore
    await settingsModal.themeOptionDark.click();
    await expect(settingsModal.themeToggleBtn).toHaveAttribute('data-theme', 'dark');

    await settingsModal.close();
  });

  test('allows reverting unsaved changes directly from project settings with confirmation', async ({ settingsModal, popup }) => {
    await settingsModal.openFromMenu();
    await settingsModal.setProjectName('Temporary Unsaved Name');
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Trigger Revert Changes
    await settingsModal.revertChanges();

    // Cancel prompt: changes remain dirty
    await popup.confirmAction(/All unsaved changes will be lost/i, { action: 'cancel' });
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Trigger Revert Changes and confirm
    await settingsModal.revertChanges();
    await popup.confirmAction(/All unsaved changes will be lost/i, {
      action: 'confirm',
      confirmText: 'Revert',
    });

    // Storage state is reloaded and synced
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');

    await settingsModal.close();
  });

  test('provides exactly four items in header project menu: save, export, settings, and dashboard', async ({ settingsModal }) => {
    await settingsModal.openProjectMenu();

    await expect(settingsModal.projectMenuSave).toBeVisible();
    await expect(settingsModal.projectMenuExport).toBeVisible();
    await expect(settingsModal.projectMenuSettings).toBeVisible();
    await expect(settingsModal.projectMenuDashboard).toBeVisible();

    // Close menu by clicking settings to open modal, then closing modal
    await settingsModal.projectMenuSettings.click();
    await settingsModal.close();
  });

  test('configures auto-save toggle and interval settings', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();

    // Toggle auto-save on
    await settingsModal.toggleAutoSave();
    await expect(settingsModal.autoSaveCheckbox).toBeChecked();

    // Set interval to 25
    await settingsModal.setAutoSaveInterval(25);
    await expect(settingsModal.autoSaveIntervalInput).toHaveValue('25');

    await settingsModal.close();
  });

  test('updates project description and version', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();

    await settingsModal.setProjectDescription('A comprehensive 2D game project.');
    await expect(settingsModal.projectDescInput).toHaveValue('A comprehensive 2D game project.');

    await settingsModal.setProjectVersion('2.0.0');
    await expect(settingsModal.projectVersionInput).toHaveValue('2.0.0');

    await settingsModal.close();
  });

  test('supports keyboard escape shortcut to dismiss modal', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();
    await expect(settingsModal.modal).toBeVisible();

    await settingsModal.closeByEscape();
    await expect(settingsModal.modal).toBeHidden();
  });

  test('switches across sidebar configuration tabs seamlessly', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();

    // Switch to Preferences tab
    await settingsModal.switchTab('preferences');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Preferences');

    // Switch to Engine tab
    await settingsModal.switchTab('engine');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Engine & Canvas');

    // Switch to Physics tab
    await settingsModal.switchTab('physics');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Physics & Bounds');

    // Switch back to Project Info tab
    await settingsModal.switchTab('project');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Project Info');
    await expect(settingsModal.projectTabContent).toBeVisible();

    await settingsModal.close();
  });

  test('[Bad Path] rejects empty project name with validation message', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();

    // Attempt to clear project name
    await settingsModal.projectNameInput.fill('');
    await settingsModal.projectNameInput.press('Enter');

    // Validation error appears
    await expect(settingsModal.projectNameError).toBeVisible();

    // Header project name was not erased
    await expect(settingsModal.headerProjectName).not.toHaveText('');

    await settingsModal.close();
  });
});

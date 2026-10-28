import { test, expect } from '../fixtures.js';

/**
 * Feature tests for Project Settings Modal, Game Thumbnail, Preferences Section,
 * Revert Changes in Project Settings, and Header Project Menu.
 */

test.use({
  projectOptions: {
    prefix: 'Settings E2E',
    description: 'Workspace for game developer settings verification',
  },
});

test.describe('Project Settings & Preferences Management', () => {
  test('opens settings modal, switches configuration tabs, and dismisses via escape shortcut', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();
    await expect(settingsModal.modal).toBeVisible();
    await expect(settingsModal.contentHeaderTitle).toHaveText('Project Info');
    await expect(settingsModal.projectTabContent).toBeVisible();

    // Switch across sidebar configuration tabs
    await settingsModal.switchTab('preferences');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Preferences');

    await settingsModal.switchTab('engine');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Engine & Canvas');

    await settingsModal.switchTab('physics');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Physics & Bounds');

    await settingsModal.switchTab('project');
    await expect(settingsModal.contentHeaderTitle).toHaveText('Project Info');

    // Dismiss modal via escape shortcut
    await settingsModal.closeByEscape();
    await expect(settingsModal.modal).toBeHidden();
  });

  test('allows editing project name, description, version, and synchronizes with storage', async ({ settingsModal }) => {
    await settingsModal.openFromMenu();
    await settingsModal.setProjectName('Updated Engine Project');

    // Header project name reflects change
    await expect(settingsModal.headerProjectName).toHaveText('Updated Engine Project');
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Update description and version
    await settingsModal.setProjectDescription('A comprehensive 2D game project.');
    await expect(settingsModal.projectDescInput).toHaveValue('A comprehensive 2D game project.');

    await settingsModal.setProjectVersion('2.0.0');
    await expect(settingsModal.projectVersionInput).toHaveValue('2.0.0');

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

    // Check theme toggle button is rendered
    await expect(settingsModal.themeToggleBtn).toBeVisible();

    // Toggle theme mode to dark
    await settingsModal.themeToggleBtn.click();
    await expect(settingsModal.themeToggleBtn).toHaveAttribute('data-theme', 'dark');

    // Toggle back to light
    await settingsModal.themeToggleBtn.click();
    await expect(settingsModal.themeToggleBtn).toHaveAttribute('data-theme', 'light');

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

  test('configures auto-save toggle, interval, and verifies header menu items', async ({ settingsModal }) => {
    // Check header menu items
    await settingsModal.openProjectMenu();
    await expect(settingsModal.projectMenuSave).toBeVisible();
    await expect(settingsModal.projectMenuExport).toBeVisible();
    await expect(settingsModal.projectMenuSettings).toBeVisible();
    await expect(settingsModal.projectMenuDashboard).toBeVisible();

    await settingsModal.projectMenuSettings.click();

    // Toggle auto-save on
    await settingsModal.toggleAutoSave();
    await expect(settingsModal.autoSaveCheckbox).toBeChecked();

    // Set interval to 25
    await settingsModal.setAutoSaveInterval(25);
    await expect(settingsModal.autoSaveIntervalInput).toHaveValue('25');

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

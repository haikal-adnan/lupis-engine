import { test, expect } from '../fixtures.js';

/**
 * CONTRACT TESTS for the Project Sync & Dirty State Machine.
 *
 * Invariants:
 * 1. Initial State: Newly opened project starts in 'synced' state.
 * 2. Mutation Transition: Modifying project data transitions state to 'dirty'.
 * 3. Save Transition: Saving changes transitions state from 'dirty' -> 'synced'.
 * 4. Safety Guard: Leaving editor while 'dirty' prompts confirmation; cancellation stays in editor.
 */

test.use({
  projectOptions: {
    prefix: 'SyncContract E2E',
    description: 'Workspace for synchronization contract verification',
  },
});

test.describe('@contract Project Sync State Machine', () => {
  test('initial project load establishes synced state with storage indicator', async ({ settingsModal }) => {
    // Invariant 1: Top bar indicator indicates synced state
    await expect(settingsModal.syncStatusIndicator).toBeVisible();
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');

    // Project menu dropdown reflects synced status
    await settingsModal.openProjectMenu();
    await expect(settingsModal.syncStatusBadge).toBeVisible();
    await expect(settingsModal.syncStatusBadge).toHaveAttribute('data-sync-status', 'synced');
  });

  test('modifying project identity transitions state machine to dirty', async ({ settingsModal }) => {
    // Invariant 2: Mutating project name sets status to dirty
    await settingsModal.openFromMenu();
    await settingsModal.setProjectName('Mutated Contract Project');

    // Indicator switches to dirty
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // In-modal live indicator also reports dirty state
    await expect(settingsModal.syncIndicatorText).toContainText('Unsaved Changes');

    // Top bar header project name reflects change
    await expect(settingsModal.headerProjectName).toHaveText('Mutated Contract Project');

    await settingsModal.close();
  });

  test('saving project transitions state machine from dirty back to synced', async ({ settingsModal }) => {
    // Mutate to dirty
    await settingsModal.openFromMenu();
    await settingsModal.setProjectDescription('Contract updated description');
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Invariant 3: Trigger Save Now from inside settings modal
    await expect(settingsModal.saveNowButton).toBeEnabled();
    await settingsModal.saveNow();

    // After save completes, indicator returns to synced
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');
    await expect(settingsModal.syncIndicatorText).toContainText('Synced with Storage');

    await settingsModal.close();
  });

  test('navigation guard intercepts back to dashboard when dirty and respects cancel or confirm', async ({ settingsModal, popup, page }) => {
    // Mutate to dirty
    await settingsModal.openFromMenu();
    await settingsModal.setProjectName('Guarded Navigation Project');
    await settingsModal.close();

    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Invariant 4: Attempting to leave while dirty triggers confirmation guard
    await settingsModal.backToDashboardFromMenu();

    // Cancel prompt: user chooses to stay
    await popup.confirmAction(/unsaved/i, { action: 'cancel' });
    await expect(settingsModal.syncStatusIndicator).toBeVisible();
    expect(page.url()).not.toContain('/dashboard');

    // Confirm prompt: user chooses to leave without saving
    await settingsModal.backToDashboardFromMenu();
    await popup.confirmAction(/unsaved/i, {
      action: 'confirm',
      confirmText: 'Leave Without Saving',
    });

    await expect(page).toHaveURL(/.*dashboard/);
  });
});

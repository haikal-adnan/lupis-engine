import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFolderStore } from '@folders/folders.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

describe('Folder Store Section History & Bottom Bar Isolation', () => {
  let folderStore;
  let workspaceStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    folderStore = useFolderStore();
    workspaceStore = useWorkspaceStore();

    folderStore.initFolders([
      { id: 'f-asset-1', name: 'Sprites', section: 'assets', parentId: null },
      { id: 'f-asset-2', name: 'Hero', section: 'assets', parentId: 'f-asset-1' },
      { id: 'f-script-1', name: 'PlayerLogic', section: 'scripts', parentId: null },
      { id: 'f-prefab-w1', name: 'WorldItems', section: 'prefabs-world', parentId: null },
      { id: 'f-prefab-u1', name: 'UIWidgets', section: 'prefabs-ui', parentId: null }
    ]);
  });

  it('keeps independent folder history for assets, scripts, and prefabs when switching sections', () => {
    // 1. User starts in assets section and opens f-asset-1 -> f-asset-2
    workspaceStore.setActiveBottomTab('assets');
    folderStore.setActiveFolder('f-asset-2', 'assets');

    expect(folderStore.activeFolderId).toBe('f-asset-2');
    expect(folderStore.getActiveFolder('assets')).toBe('f-asset-2');

    // 2. User switches to scripts section (should not inherit asset folder)
    folderStore.switchSection('scripts', 'assets');
    workspaceStore.setActiveBottomTab('scripts');

    expect(folderStore.activeFolderId).toBeNull();
    expect(folderStore.getActiveFolder('scripts')).toBeNull();

    // 3. User navigates inside scripts section to f-script-1
    folderStore.setActiveFolder('f-script-1', 'scripts');
    expect(folderStore.activeFolderId).toBe('f-script-1');
    expect(folderStore.getActiveFolder('scripts')).toBe('f-script-1');

    // 4. User switches to prefabs section
    folderStore.switchSection('prefabs', 'scripts');
    workspaceStore.setActiveBottomTab('prefabs');

    expect(folderStore.activeFolderId).toBeNull();

    // 5. User navigates inside prefabs-world to f-prefab-w1
    folderStore.setActiveFolder('f-prefab-w1', 'prefabs-world');
    expect(folderStore.activeFolderId).toBe('f-prefab-w1');
    expect(folderStore.getActiveFolder('prefabs-world')).toBe('f-prefab-w1');

    // 6. User switches back to assets (should restore f-asset-2)
    folderStore.switchSection('assets', 'prefabs');
    workspaceStore.setActiveBottomTab('assets');

    expect(folderStore.activeFolderId).toBe('f-asset-2');
    expect(folderStore.getActiveFolder('assets')).toBe('f-asset-2');

    // 7. User switches back to scripts (should restore f-script-1)
    folderStore.switchSection('scripts', 'assets');
    workspaceStore.setActiveBottomTab('scripts');

    expect(folderStore.activeFolderId).toBe('f-script-1');
    expect(folderStore.getActiveFolder('scripts')).toBe('f-script-1');

    // 8. User switches back to prefabs (should restore f-prefab-w1)
    folderStore.switchSection('prefabs', 'scripts');
    workspaceStore.setActiveBottomTab('prefabs');

    expect(folderStore.activeFolderId).toBe('f-prefab-w1');
  });

  it('keeps independent folder history between world and ui prefab tabs', () => {
    folderStore.switchSection('prefabs-world');
    folderStore.setActiveFolder('f-prefab-w1', 'prefabs-world');
    expect(folderStore.activeFolderId).toBe('f-prefab-w1');

    // Switch to UI tab inside prefabs
    folderStore.switchSection('prefabs-ui', 'prefabs-world');
    expect(folderStore.activeFolderId).toBeNull();

    folderStore.setActiveFolder('f-prefab-u1', 'prefabs-ui');
    expect(folderStore.activeFolderId).toBe('f-prefab-u1');

    // Switch back to World tab inside prefabs
    folderStore.switchSection('prefabs-world', 'prefabs-ui');
    expect(folderStore.activeFolderId).toBe('f-prefab-w1');

    // Switch back to UI tab
    folderStore.switchSection('prefabs-ui', 'prefabs-world');
    expect(folderStore.activeFolderId).toBe('f-prefab-u1');
  });

  it('automatically clears activeFolderId for sections if active folder is deleted', async () => {
    // Navigate in assets to f-asset-1
    folderStore.setActiveFolder('f-asset-1', 'assets');
    expect(folderStore.getActiveFolder('assets')).toBe('f-asset-1');

    // Mock dir handle and sync
    folderStore._getWorkspaceDirHandle = vi.fn().mockResolvedValue({
      getFileHandle: vi.fn().mockResolvedValue({
        createWritable: vi.fn().mockResolvedValue({
          write: vi.fn(),
          close: vi.fn()
        })
      })
    });

    await folderStore.deleteFolder('f-asset-1');

    expect(folderStore.activeFolderId).toBeNull();
    expect(folderStore.getActiveFolder('assets')).toBeNull();
  });
});

// Folder tree operations including recursive deletion and cloning.

import { useFolderStore } from '@folders/folders.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useScriptStore } from '@scripts/scripts.js';
import { folderSchema } from '@folders/folders.js';

import { 
  usePrompt,
  usePopAlert
} from '@composables/composables.js';

import { GenerateUUID } from '@utils/utils.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

export function useFolderActions() {
  const folderStore = useFolderStore();
  const assetStore = useAssetStore();
  const workspaceStore = useWorkspaceStore();
  const prefabStore = usePrefabStore();
  const scriptStore = useScriptStore();
  
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt(); 

  // Prompts for a name and inserts a new folder into the active section
  const createNewFolder = async (options = {}) => {
    const defaultName = options.defaultName || 'New Folder';
    const parentId = options.parentId || null;
    const section = options.section || workspaceStore.activeBottomTabId;

    const folderName = await prompt({
      title: 'Create New Folder',
      message: 'Enter folder name:',
      defaultValue: defaultName,
      confirmText: 'Create'
    });

    if (!folderName || typeof folderName !== 'string' || !folderName.trim()) {
      return null;
    }

    const cleanName = folderName.trim();
    const newId = GenerateUUID();
    const projectId = workspaceStore.activeProjectId;

    const newFolder = folderSchema({
      id: newId,
      name: cleanName,
      section: section, 
      parentId: parentId,
      projectId: projectId,
    });

    await folderStore.createFolder(newFolder);

    showPop({
      title: 'Folder Created',
      message: `Folder "${cleanName}" created successfully.`,
      type: 'success'
    });

    return newFolder;
  };

  // Recursively deletes a folder and its nested items across stores
  const deleteFolder = async (folderId) => {
    const cascadeDelete = async (currentFolderId) => {
      const subFolders = folderStore.folders.filter(f => f.parentId === currentFolderId);
      for (const sub of subFolders) {
        await cascadeDelete(sub.id);
      }

      const assetsInFolder = assetStore.assets.filter(a => a.folderId === currentFolderId);
      for (const asset of assetsInFolder) {
        await assetStore.removeAsset(asset.id);                  
      }

      const prefabsInFolder = prefabStore.prefabs.filter(p => p.folderId === currentFolderId);
      for (const prefab of prefabsInFolder) {
        await prefabStore.removePrefab(prefab.id);
      }

      const scriptsInFolder = scriptStore.scripts.filter(s => s.folderId === currentFolderId);
      for (const script of scriptsInFolder) {
        await scriptStore.removeScript(script.id);
      }

      await folderStore.deleteFolder(currentFolderId);
    };

    await cascadeDelete(folderId);

    showPop({
      title: 'Folder Deleted',
      message: 'Folder and its contents removed.',
      type: 'info'
    });
  };

  const renameFolder = async (folderId, newName) => {
    const cleanName = newName.trim();
    await folderStore.updateFolder(folderId, { name: cleanName });
    
    showPop({ 
      title: 'Success', 
      message: 'Folder renamed.', 
      type: 'success' 
    });
  };

  const duplicateFolder = async (folderId) => {
    const original = folderStore.getFolderById(folderId);

    if (!original) {
      return null;
    }

    const newId = GenerateUUID();
    const newName = `${original.name} (Copy)`;

    const newFolder = folderSchema({
      ...original,
      id: newId,
      name: newName,
      section: original.section || workspaceStore.activeBottomTabId,
      isSynced: true 
    });

    await folderStore.createFolder(newFolder);

    showPop({
      title: 'Folder Duplicated',
      message: `Created copy of "${original.name}".`,
      type: 'success'
    });

    return newFolder;
  };

  return {
    createNewFolder,
    deleteFolder,
    renameFolder,
    duplicateFolder
  };
}

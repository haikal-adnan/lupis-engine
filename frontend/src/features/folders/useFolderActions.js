import { useFolderStore } from '@folders/folders.js';
import { useAssetStore } from '@assets/assets.js'
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useScriptStore } from '@scripts/scripts.js';
import { folderSchema } from '@folders/folders.js';

import { 
  usePrompt ,
  usePopAlert
} from '@composables/composables.js'

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

  const createNewFolder = async (defaultName = 'New Folder', parentId, section) => {
    const folderName = await prompt({
      title: 'Create New Folder',
      message: 'Enter folder name:',
      defaultValue: defaultName,
      confirmText: 'Create'
    });

    if (folderName === null || folderName.trim() === '') {
      return; 
    }

    const cleanName = folderName.trim();
    const actualParentId = parentId !== undefined ? parentId : folderStore.activeFolderId;

    try {
      const newId = GenerateUUID();
      const projectId = workspaceStore.activeProjectId;

      const newFolder = folderSchema({
        id: newId,
        name: cleanName,
        section: section, 
        parentId: actualParentId || null,
        projectId: projectId,
        isSynced: true
      });

      await folderStore.createFolder(newFolder);

      showPop({
        title: 'Folder Created',
        message: `Folder "${cleanName}" created successfully.`,
        type: 'success'
      });

      return newFolder;
    } catch (error) {
      showPop({
        title: 'Creation Failed',
        message: error.message || 'Failed to create folder.',
        type: 'error'
      });
    }
  };

  const deleteFolder = async (folderId) => {
    try {
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
    } catch (error) {
      console.error("Cascade delete error:", error);
      showPop({
        title: 'Delete Failed',
        message: error.message || 'Failed to delete folder.',
        type: 'error'
      });
    }
  };

  const renameFolder = async (folderId, newName) => {
    try {
      const cleanName = newName.trim();
      if (!cleanName) return;

      await folderStore.updateFolder(folderId, { name: cleanName });
      
      showPop({ 
        title: 'Success', 
        message: 'Folder renamed.', 
        type: 'success' 
      });
    } catch (error) {
      showPop({
        title: 'Rename Failed',
        message: error.message || 'Failed to rename folder.',
        type: 'error'
      });
    }
  };

  const duplicateFolder = async (folderId) => {
    try {
      const original = folderStore.getFolderById(folderId);
      if (!original) return;

      const newId = GenerateUUID();
      const newName = `${original.name} (Copy)`;

      const newFolder = folderSchema({
        ...original,
        id: newId,
        name: newName,
        isSynced: true 
      });

      await folderStore.createFolder(newFolder);

      showPop({
        title: 'Folder Duplicated',
        message: `Created copy of "${original.name}".`,
        type: 'success'
      });

      return newFolder;
    } catch (error) {
      showPop({
        title: 'Duplicate Failed',
        message: error.message || 'Failed to duplicate folder.',
        type: 'error'
      });
    }
  };

  return {
    createNewFolder,
    deleteFolder,
    renameFolder,
    duplicateFolder
  };
}
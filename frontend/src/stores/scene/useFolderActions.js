import { useFolderStore } from '@/stores/useFolderStore';
import { useAssetStore } from '@/stores/useAssetStore';
import { createFolder } from '@/services/schema/folderSchema.js';
import { usePopAlert } from '@/composables/usePopAlert';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { useEditorStore } from '@/stores/useEditorStore';

import { useFolderBackend } from '@/services/api/backend/useFolderBackend.js';
import { useAssetBackend } from '@/services/api/backend/useAssetBackend.js';

export function useFolderActions() {
  const folderStore = useFolderStore();
  const assetStore = useAssetStore();
  const editorStore = useEditorStore();
  const { showPop } = usePopAlert();
  
  const { createFolderToServer, updateFolderToServer, deleteFolderFromServer } = useFolderBackend();
  const { deleteAssetFromServer } = useAssetBackend();

  const createNewFolder = async (name, parentId) => {
    const actualParentId = parentId !== undefined ? parentId : folderStore.activeFolderId;
    const folderName = name || 'New Folder';

    try {
      const newId = GenerateUUID();
      const projectId = editorStore.activeProjectId;

      await createFolderToServer({
        folderId: newId,
        projectId: projectId,
        name: folderName,
        parentId: actualParentId
      });

      const newFolder = createFolder({
        _id: newId,
        name: folderName,
        parentId: actualParentId,
        projectId: projectId,
        isSynced: true
      });

      folderStore.createFolder(newFolder);

      showPop({
        title: 'Folder Created',
        message: `Folder "${folderName}" has been created.`,
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
          await cascadeDelete(sub._id);
        }

        const assetsInFolder = assetStore.assets.filter(a => a.folderId === currentFolderId);
        for (const asset of assetsInFolder) {
          assetStore.updateAsset(asset._id, { isSynced: false });
          await deleteAssetFromServer(asset._id);                
          assetStore.removeAsset(asset._id);                   
        }

        await deleteFolderFromServer(currentFolderId);
        
        folderStore.deleteFolder(currentFolderId);
      };

      await cascadeDelete(folderId);

      showPop({
        title: 'Folder Deleted',
        message: 'Folder and all its contents have been permanently removed.',
        type: 'info'
      });
    } catch (error) {
      console.error("Cascade delete error:", error);
      showPop({
        title: 'Delete Failed',
        message: error.message || 'Failed to delete folder completely.',
        type: 'error'
      });
    }
  };

  const renameFolder = async (folderId, newName) => {
    try {
      const cleanName = newName.trim();
      if (!cleanName) return;

      await updateFolderToServer(folderId, { name: cleanName });

      folderStore.updateFolder(folderId, { name: cleanName });
      
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

      await createFolderToServer({
        folderId: newId,
        projectId: original.projectId,
        name: newName,
        parentId: original.parentId
      });

      const newFolder = createFolder({
        ...original,
        _id: newId, 
        name: newName,
        isSynced: true 
      });

      folderStore.createFolder(newFolder);

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
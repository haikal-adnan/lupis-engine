import { ref, computed } from 'vue';
import { usePrefabStore, usePrefabActions } from '@prefabs/prefabs.js';
import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useSceneHistory } from '@historys/historys.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

export function usePrefabLogic() {
  const prefabStore = usePrefabStore();
  const folderStore = useFolderStore();
  const workspaceStore = useWorkspaceStore();
  
  const { createPrefab, deletePrefab, renamePrefab, duplicatePrefab } = usePrefabActions(); 
  const { createNewFolder, deleteFolder, renameFolder, duplicateFolder } = useFolderActions();
  
  const viewMode = ref('grid');
  const searchQuery = ref('');
  const selectedId = ref(null);
  const activeTab = ref('world');
  
  const clipboard = ref({
    action: null,
    item: { id: null, type: null }
  });

  const currentFolderId = computed(() => folderStore.activeFolderId);
  const currentFolder = computed(() => folderStore.getFolderById(currentFolderId.value));

  const currentSection = computed(() => `prefabs-${activeTab.value}`);

  const folderBreadcrumbs = computed(() => {
    const path = [];
    let currentId = currentFolderId.value;
    
    while (currentId) {
      const folder = folderStore.getFolderById(currentId);
      path.unshift(folder); 
      currentId = folder.parentId;
    }
    return path;
  });

  const visibleFolders = computed(() => {
    let folders = folderStore.folders.filter(f => 
      f.parentId === currentFolderId.value && f.section === currentSection.value
    );

    if (searchQuery.value) {
      folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
    }
    
    return folders.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const visiblePrefabs = computed(() => {
    let list = prefabStore.prefabs.filter(p => p.folderId === currentFolderId.value);

    list = list.filter(p => {
      const type = p.type || p.originalData.type;
      return activeTab.value === 'ui' ? type === 'ui' : type !== 'ui';
    });

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(query));
    }

    return list.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const _deletePrefabFileFromOPFS = async (prefabId) => {
    const projectId = workspaceStore.activeProjectId;
    const root = await navigator.storage.getDirectory();
    const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
    const projectsDir = await appDir.getDirectoryHandle('projects', { create: true });
    const projectDir = await projectsDir.getDirectoryHandle(String(projectId));
    const prefabsDir = await projectDir.getDirectoryHandle('prefabs');
    
    await prefabsDir.removeEntry(`${prefabId}.json`);
  };

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  };

  const navigateTo = (folder) => {
    folderStore.setActiveFolder(folder ? folder.id : null);
    selectedId.value = null;
    searchQuery.value = '';
  };

  const handleSelect = (id) => {
    selectedId.value = id;
  };

  const moveItem = async (id, type, targetFolderId) => {
    if (type === 'prefab') {
      const prefab = prefabStore.getPrefabById(id);
      if (prefab.folderId !== targetFolderId) {
        const oldFolderId = prefab.folderId;
        await prefabStore.movePrefab(id, targetFolderId);

        const { recordMovePrefabFolder } = useSceneHistory();
        recordMovePrefabFolder(id, oldFolderId, targetFolderId);
      }
    } else if (type === 'folder') {
      await folderStore.moveFolder(id, targetFolderId);
    }
  };

  const handleDrop = async (e, customTargetFolderId = null) => {
    const targetFolder = customTargetFolderId !== null ? customTargetFolderId : currentFolderId.value;
    const internalData = e.dataTransfer.getData('application/json');
    const { id, type } = JSON.parse(internalData);
    await moveItem(id, type, targetFolder);
  };

  const handlePaste = async () => {
    const { action, item } = clipboard.value;

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value);
      clipboard.value = { action: null, item: { id: null, type: null } };
    } else if (action === 'copy') {
      if (item.type === 'prefab') {
        duplicatePrefab(item.id);
      } else if (item.type === 'folder') {
        duplicateFolder(item.id);
      }
    }
  };

  const handleCreateEmpty = () => {
    const newPrefab = createPrefab("New Prefab", currentFolderId.value, activeTab.value);
    handleSelect(newPrefab.id);
  };

  const handleCreateFolder = async () => {
    const newFolder = await createNewFolder({
      defaultName: 'New Folder',
      parentId: currentFolderId.value,
      section: currentSection.value
    });
    if (newFolder) handleSelect(newFolder.id);
  };

  const handleDelete = async (item) => {
    const id = item.id;
    if (item.isFolder || item.type === 'folder') {
      await deleteFolder(id);
      if (selectedId.value === id) selectedId.value = null;
    } else {
      const isDeleted = await deletePrefab(id);
      if (isDeleted) {
        await _deletePrefabFileFromOPFS(id); 
        if (selectedId.value === id) selectedId.value = null;
      }
    }
  };

  const handleDuplicate = (item) => {
    if (item.isFolder || item.type === 'folder') {
      duplicateFolder(item.id);
    } else {
      duplicatePrefab(item.id);
    }
  };
  
  const handleRename = (item) => {
    if (item.isFolder || item.type === 'folder') {
      renameFolder(item.id, item.name);
    } else {
      renamePrefab(item.id); 
    }
  };

  return {
    viewMode,
    searchQuery,
    selectedId,
    activeTab,
    currentSection,
    currentFolder,
    folderBreadcrumbs,
    visibleFolders,
    visiblePrefabs,
    clipboard,
    toggleViewMode,
    navigateTo,
    handleSelect,
    moveItem,
    handleDrop,
    handlePaste,
    createEmptyPrefab: handleCreateEmpty,
    createFolder: handleCreateFolder,
    handleDelete,
    handleDuplicate,
    handleRename
  };
}
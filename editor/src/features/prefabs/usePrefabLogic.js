import { ref, computed } from 'vue';
import { usePrefabStore, usePrefabActions } from '@prefabs/prefabs.js';
import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useSceneHistory } from '@historys/historys.js';

export function usePrefabLogic() {
  const prefabStore = usePrefabStore();
  const folderStore = useFolderStore();
  
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
      if (folder) {
        path.unshift(folder); 
        currentId = folder.parentId;
      } else {
        break;
      }
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
      // Resolve type dengan fallback yang lengkap
      const resolvedType = p.type || p.data?.type || p.originalData?.type || 'world';
      return activeTab.value === 'ui' ? resolvedType === 'ui' : resolvedType !== 'ui';
    });

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter(p => (p.scriptId || '').toLowerCase().includes(query));
    }

    return list.sort((a, b) => 
      (a.scriptId || '').localeCompare(b.scriptId || '', undefined, { numeric: true, sensitivity: 'base' })
    );
  });

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
      if (prefab && prefab.folderId !== targetFolderId) {
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
    if (internalData) {
      try {
        const { id, type } = JSON.parse(internalData);
        await moveItem(id, type, targetFolder);
      } catch (err) {
        console.warn('[PrefabLogic] Failed to parse drag-and-drop payload:', err);
      }
    }
  };

  const handlePaste = async () => {
    const { action, item } = clipboard.value;

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value);
      clipboard.value = { action: null, item: { id: null, type: null } };
    } else if (action === 'copy') {
      if (item.type === 'prefab') {
        await duplicatePrefab(item.id);
      } else if (item.type === 'folder') {
        await duplicateFolder(item.id);
      }
    }
  };

  const handleCreateEmpty = async () => {
    const newPrefab = await createPrefab("New Prefab", currentFolderId.value, activeTab.value);
    if (newPrefab) handleSelect(newPrefab.id);
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
      if (isDeleted && selectedId.value === id) {
        selectedId.value = null;
      }
    }
  };

  const handleDuplicate = async (item) => {
    if (item.isFolder || item.type === 'folder') {
      await duplicateFolder(item.id);
    } else {
      await duplicatePrefab(item.id);
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
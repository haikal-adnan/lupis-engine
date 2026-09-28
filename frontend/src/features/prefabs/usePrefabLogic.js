import { ref, computed } from 'vue';
import { usePrefabStore, usePrefabActions } from '@prefabs/prefabs.js';
import { useFolderStore } from '@folders/folders.js';
import { useProjectStore, useProjectActions } from '@projects/projects.js'

export function usePrefabLogic() {
  const prefabStore = usePrefabStore();
  const folderStore = useFolderStore();
  const projectStore = useProjectStore();
  
  const { createPrefab, deletePrefab, renamePrefab, duplicatePrefab } = usePrefabActions(); 
  const { getUserProjectsDir } = useProjectActions();
  
  const viewMode = ref('grid');
  const searchQuery = ref('');
  const selectedId = ref(null);
  const activeTab = ref('world');
  const clipboard = ref(null);

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
    let list = prefabStore.prefabs.filter(p => (p.folderId || null) === currentFolderId.value);

    list = list.filter(p => {
      const type = p.type || p.originalData?.type || 'world';
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
    try {
      const projectId = projectStore.project?.id;
      if (!projectId) return;

      const projectsDir = await getUserProjectsDir();
      const projectDir = await projectsDir.getDirectoryHandle(projectId);
      const prefabsDir = await projectDir.getDirectoryHandle('prefabs');
      
      await prefabsDir.removeEntry(`${prefabId}.json`);
    } catch (e) {
      console.warn(`File OPFS prefabs/${prefabId}.json tidak ditemukan atau telah dihapus:`, e);
    }
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
    try {
      if (type === 'prefab') {
        const prefab = prefabStore.getPrefabById(id);
        if (prefab && prefab.folderId !== targetFolderId) {
          const oldFolderId = prefab.folderId || null;
          await prefabStore.movePrefab(id, targetFolderId);

          const { recordMovePrefabFolder } = useSceneHistory();
          recordMovePrefabFolder(id, oldFolderId, targetFolderId || null);
        }
      } else if (type === 'folder') {
        await folderStore.moveFolder(id, targetFolderId);
      }
    } catch (err) {
      console.error('Failed to move item:', err);
    }
  };

  const handleDrop = async (e, customTargetFolderId = null) => {
    const targetFolder = customTargetFolderId !== null ? customTargetFolderId : currentFolderId.value;

    try {
      const internalData = e.dataTransfer.getData('application/json');
      if (internalData) {
        const { id, type } = JSON.parse(internalData);
        await moveItem(id, type, targetFolder);
      }
    } catch (err) {}
  };

  const handlePaste = async () => {
    if (!clipboard.value) return;
    const { action, item } = clipboard.value;

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value);
      clipboard.value = null;
    } else if (action === 'copy') {
      try {
        if (item.type === 'prefab') {
          duplicatePrefab(item.id);
        }
      } catch (err) {
        console.error('Failed to copy item:', err);
      }
    }
  };

  const handleCreateEmpty = () => {
    const newPrefab = createPrefab("New Prefab", currentFolderId.value, activeTab.value);
    if (newPrefab) handleSelect(newPrefab.id);
  };

  const handleDelete = async (item) => {
    const id = item.id;
    const isDeleted = await deletePrefab(id);
    
    if (isDeleted) {
      await _deletePrefabFileFromOPFS(id); 
      if (selectedId.value === id) selectedId.value = null;
    }
  };

  const handleDuplicate = (item) => {
    duplicatePrefab(item.id);
  };
  
  const handleRename = (item) => {
    renamePrefab(item.id); 
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
    handleDelete,
    handleDuplicate,
    handleRename
  };
}
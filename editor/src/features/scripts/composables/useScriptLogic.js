import { ref, computed } from 'vue';
import { useScriptStore, useScriptActions } from '@scripts/scripts.js';
import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

export function useScriptLogic() {
  const scriptStore = useScriptStore();
  const folderStore = useFolderStore();
  const workspaceStore = useWorkspaceStore();

  const { createScript, renameScript, duplicateScript, deleteScript } = useScriptActions();
  const { duplicateFolder } = useFolderActions();

  const viewMode = ref('grid');
  const searchQuery = ref('');
  const selectedId = ref(null);
  const clipboard = ref(null);

  const currentFolderId = computed(() => folderStore.activeFolderId);
  const currentFolder = computed(() => folderStore.getFolderById(currentFolderId.value));

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
      f.parentId === currentFolderId.value && f.section === 'scripts'
    );

    if (searchQuery.value) {
      folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
    }

    return folders.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const visibleScripts = computed(() => {
    let list = scriptStore.scripts.filter(s => (s.folderId || null) === currentFolderId.value);

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter(s => (s.scriptId || '').toLowerCase().includes(query));
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
    if (type === 'script') {
      await scriptStore.moveScript(id, targetFolderId);
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
        console.warn('[ScriptLogic] Failed to parse drag-and-drop payload:', err);
      }
    }
  };

  const handlePaste = async () => {
    if (!clipboard.value) return;
    const { action, item } = clipboard.value;

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value);
      clipboard.value = null;
    } else if (action === 'copy') {
      if (item.type === 'script') {
        await duplicateScript(item.id);
      } else if (item.type === 'folder') {
        await duplicateFolder(item.id);
      }
    }
  };

  const handleOpenGraph = (script) => {
    if (!script) return;
    const scriptData = script.originalData || script;
    scriptStore.setActiveScript(scriptData);
    workspaceStore.openTab({
      id: scriptData.id,
      name: scriptData.scriptId,
      type: 'diagram'
    });
  };

  const handleDelete = async (item) => {
    const id = item.id;
    const isDeleted = await deleteScript(id);

    if (isDeleted && selectedId.value === id) {
      selectedId.value = null;
    }
  };

  const handleDuplicate = async (item) => {
    await duplicateScript(item.id);
  };

  const handleRename = async (item) => {
    await renameScript(item.id);
  };

  return {
    viewMode,
    searchQuery,
    selectedId,
    currentFolder,
    folderBreadcrumbs,
    visibleFolders,
    visibleScripts,
    clipboard,
    toggleViewMode,
    navigateTo,
    handleSelect,
    moveItem,
    handleDrop,
    handlePaste,
    handleOpenGraph,
    createScript: () => createScript('component', currentFolderId.value),
    handleDelete,
    handleDuplicate,
    handleRename
  };
}
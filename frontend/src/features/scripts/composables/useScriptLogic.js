import { ref, computed } from 'vue';
import { useScriptStore, useScriptActions } from '@scripts/scripts.js';
import { useFolderStore } from '@folders/folders.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectActions, useProjectStore } from '@projects/projects.js'

export function useScriptLogic() {
  const scriptStore = useScriptStore();
  const folderStore = useFolderStore();
  const workspaceStore = useWorkspaceStore();
  const projectStore = useProjectStore();

  const { createScript, renameScript, duplicateScript, deleteScript } = useScriptActions();
  const { getUserProjectsDir } = useProjectActions();

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
      list = list.filter(s => s.name.toLowerCase().includes(query));
    }

    return list.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const _deleteScriptFileFromOPFS = async (scriptId) => {
    try {
      const projectId = projectStore.project?.id;
      if (!projectId) return;

      const projectsDir = await getUserProjectsDir();
      const projectDir = await projectsDir.getDirectoryHandle(projectId);
      const scriptsDir = await projectDir.getDirectoryHandle('scripts');

      await scriptsDir.removeEntry(`${scriptId}.json`);
    } catch (e) {
      console.warn(`File OPFS scripts/${scriptId}.json tidak ditemukan atau telah dihapus:`, e);
    }
  };

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  };

  const navigateTo = (folder) => {
    folderStore.setActiveFolder(folder ? (folder.id) : null);
    selectedId.value = null;
    searchQuery.value = '';
  };

  const handleSelect = (id) => {
    selectedId.value = id;
  };

  const moveItem = async (id, type, targetFolderId) => {
    try {
      if (type === 'script') {
        await scriptStore.moveScript(id, targetFolderId);
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
        if (item.type === 'script') {
          duplicateScript(item.id);
        }
      } catch (err) {
        console.error('Failed to copy item:', err);
      }
    }
  };

  const handleOpenGraph = (script) => {
    if (!script) return;
    const scriptData = script.originalData || script;
    scriptStore.setActiveScript(scriptData);
    workspaceStore.openTab({
      id: scriptData.id,
      name: scriptData.name,
      type: 'diagram'
    });
  };

  const handleDelete = async (item) => {
    const id = item.id;
    const isDeleted = await deleteScript(id);

    if (isDeleted) {
      await _deleteScriptFileFromOPFS(id);
      if (selectedId.value === id) selectedId.value = null;
    }
  };

  const handleDuplicate = (item) => {
    duplicateScript(item.id);
  };

  const handleRename = (item) => {
    renameScript(item.id);
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
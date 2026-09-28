import { ref, computed } from 'vue';
import { 
  FolderPlus, RefreshCw, Edit2, Trash2, 
  Copy, Scissors, ClipboardPaste, Workflow, 
  PlayCircle, FileCode2, Hash 
} from 'lucide-vue-next';

import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useScriptStore, useScriptActions } from '@scripts/scripts.js';

import { 
  useConfirm,
  usePrompt,
  usePopAlert
} from '@composables/composables.js';

export function useScriptMenu(selectedIdRef, logicActions) {
  const { renameScript, duplicateScript, deleteScript, applyToEntity } = useScriptActions();
  const { createNewFolder, deleteFolder, renameFolder } = useFolderActions();
  
  const sceneStore = useSceneStore();
  const folderStore = useFolderStore();
  const scriptStore = useScriptStore();

  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();

  const menu = ref({ visible: false, x: 0, y: 0, item: null });

  const handleContextMenu = (e, item) => {
    if (item) selectedIdRef.value = item.id;
    menu.value = { visible: true, x: e.clientX, y: e.clientY, item: item };
  };

  const closeMenu = () => {
    menu.value.visible = false;
  };

  const getEligibleEntity = () => {
    if (sceneStore.selectedEntityIds.length === 0) return null;
    const entityId = sceneStore.selectedEntityIds[0];
    const scene = sceneStore.activeScene;
    if (!scene) return null;

    const entity = scene.entities.find(e => e.id === entityId);
    if (entity && entity.components && entity.components.ScriptController) {
      return entity;
    }
    return null;
  };

  const handleRename = async (targetItem) => {
    closeMenu();
    const isFolder = targetItem.type === 'folder' || targetItem.isFolder;
    const id = targetItem.id;

    if (isFolder) {
      const newName = await prompt({
        title: 'Rename Folder',
        message: 'Enter a new name:',
        defaultValue: targetItem.name,
        confirmText: 'Rename'
      });
      if (newName && newName.trim() !== '' && newName !== targetItem.name) {
        renameFolder(id, newName);
      }
    } else {
      renameScript(id);
    }
  };

  const handleDelete = async (targetItem) => {
    closeMenu();
    const isFolder = targetItem.type === 'folder' || targetItem.isFolder;
    const id = targetItem.id;

    if (isFolder) {
      const isConfirmed = await confirm({
        title: 'Delete Folder?',
        message: `Are you sure? This action will remove the folder and all nested content.`,
        type: 'danger'
      });
      if (isConfirmed) deleteFolder(id);
    } else {
      deleteScript(id);
    }
  };

  const handleCutCopy = (action, item) => {
    if (logicActions?.clipboard) {
      logicActions.clipboard.value = {
        action,
        item: { 
          id: item.id, 
          type: item.isFolder || item.type === 'folder' ? 'folder' : 'script' 
        }
      };
    }
    closeMenu();
  };

  const handleCopyId = async (targetItem) => {
    closeMenu();
    const id = targetItem.id;
    if (!id) return;

    try {
      await navigator.clipboard.writeText(id);
      showPop({ title: 'Success', message: 'Script ID copied to clipboard.', type: 'success' });
    } catch (err) {
      showPop({ title: 'Error', message: 'Failed to copy Script ID.', type: 'error' });
    }
  };

  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item;
    if (!targetItem) return defaultEmptyMenu();

    const isFolder = targetItem.type === 'folder' || targetItem.isFolder;
    const id = targetItem.id;

    if (isFolder) {
      return [
        { label: targetItem.name, disabled: true, icon: FolderPlus },
        { separator: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => handleCutCopy('cut', targetItem) },
        { separator: true },
        { label: 'Rename', icon: Edit2, shortcut: 'F2', action: () => handleRename(targetItem) },
        { separator: true },
        { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => handleDelete(targetItem) }
      ];
    }

    const scriptObj = scriptStore.getScriptById(id);
    const eligibleEntity = getEligibleEntity();

    const items = [
      { label: targetItem.name, disabled: true, icon: FileCode2 }
    ];

    if (eligibleEntity && scriptObj) {
      items.push(
        { separator: true },
        {
          label: `Add to ${eligibleEntity.name}`,
          icon: PlayCircle,
          action: () => {
            closeMenu();
            applyToEntity(scriptObj, eligibleEntity);
          }
        }
      );
    }

    items.push(
      { separator: true },
      { 
        label: 'Open Graph', 
        icon: Workflow, 
        action: () => {
          closeMenu();
          if (logicActions?.handleOpenGraph) logicActions.handleOpenGraph(scriptObj || targetItem);
        }
      },
      { separator: true },
      { label: 'Copy ID', icon: Hash, action: () => handleCopyId(targetItem) },
      { separator: true },
      { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => handleCutCopy('cut', targetItem) },
      { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => handleCutCopy('copy', targetItem) },
      { separator: true },
      { label: 'Rename', icon: Edit2, shortcut: 'F2', action: () => handleRename(targetItem) },
      { label: 'Duplicate', icon: Copy, action: () => { closeMenu(); duplicateScript(id); } },
      { separator: true },
      { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => handleDelete(targetItem) }
    );

    return items;
  });

  const defaultEmptyMenu = () => {
    return [
      { 
        label: 'New Folder', 
        icon: FolderPlus, 
        action: () => { 
          closeMenu(); 
          createNewFolder('New Folder', folderStore.activeFolderId, 'scripts');
        } 
      },
      { 
        label: 'New Script', 
        icon: FileCode2, 
        action: () => { 
          closeMenu(); 
          if (logicActions?.createScript) logicActions.createScript('component');
        } 
      },
      { separator: true },
      { 
        label: 'Paste', 
        icon: ClipboardPaste, 
        shortcut: 'Ctrl+V',
        disabled: !logicActions?.clipboard?.value,
        action: () => { closeMenu(); if (logicActions?.handlePaste) logicActions.handlePaste(); } 
      },
      { separator: true },
      { label: 'Refresh', icon: RefreshCw, shortcut: 'F5', action: closeMenu }
    ];
  };

  return { menu, handleContextMenu, closeMenu, contextMenuItems };
}
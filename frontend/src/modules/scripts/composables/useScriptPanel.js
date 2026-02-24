import { ref, computed } from 'vue';
import { 
  LayoutGrid, List, FileCode2, Workflow,
  Plus, Edit3, Trash2, Copy, RefreshCw, 
  PlayCircle
} from 'lucide-vue-next';

import { useScriptStore } from '@/stores/useScriptStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js'; 

import { usePrompt } from '@/composables/usePrompt';
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert';

const generateInstanceId = () => `inst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function useScriptPanel() {
  const scriptStore = useScriptStore();
  const editorStore = useEditorStore();
  const sceneStore = useSceneStore();
  
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();

  const searchQuery = ref('');
  const viewMode = ref('grid');
  const selectedId = ref(null);
  
  const menu = ref({ visible: false, x: 0, y: 0, item: null });

  const filteredScripts = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return scriptStore.scripts;
    
    return scriptStore.scripts.filter(script => 
      script.name.toLowerCase().includes(query)
    );
  });

  const getEligibleEntity = () => {
    if (sceneStore.selectedEntityIds.length === 0) return null;
    
    const entityId = sceneStore.selectedEntityIds[0];
    const scene = sceneStore.activeScene;
    if (!scene) return null;

    const entity = scene.entities.find(e => e._id === entityId);
    if (entity && entity.components && entity.components.ScriptController) {
      return entity;
    }

    return null;
  };

  const toggleView = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  };

  const selectScript = (script) => {
    selectedId.value = script?._id || null;
  };

  const handleOpenGraph = (script) => {
    if (!script) return;
    
    scriptStore.setActiveScript(script);
    editorStore.openTab({
      id: script._id,
      name: script.name,
      type: 'diagram'
    });
  };

  const handleCreate = async (type = 'component') => {
    const projectId = editorStore.activeProjectId;
    if (!projectId) {
      return showPop({ 
        title: 'Error', 
        message: 'No active project found.', 
        type: 'error' 
      });
    }

    const defaultName = type === 'component' ? 'NewComponent' : 'NewSceneLogic';
    const name = await prompt({
      title: `Create New ${type === 'component' ? 'Component' : 'Logic'}`,
      message: 'Enter script name:',
      defaultValue: defaultName,
      confirmText: 'Create'
    });

    if (name?.trim()) {
      try {
        await scriptStore.createScript({
          projectId,
          name: name.trim(),
          type
        });
        
        showPop({
          title: 'Script Created',
          message: `"${name}" has been created successfully.`,
          type: 'success'
        });

      } catch (err) {
        showPop({ 
          title: 'Failed', 
          message: err.message, 
          type: 'error' 
        });
      }
    }
  };

  const handleRename = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    const newName = await prompt({
      title: 'Rename Script',
      defaultValue: script.name,
      confirmText: 'Rename'
    });
    
    if (newName && newName.trim() && newName !== script.name) {
      await scriptStore.updateScript(scriptId, { name: newName.trim() });
      
      showPop({
        title: 'Renamed',
        message: `Script renamed to "${newName}".`,
        type: 'success'
      });
    }
  };

  const handleDuplicate = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    if (await confirm({ title: 'Duplicate?', message: `Copy "${script.name}"?` })) {
      const clone = JSON.parse(JSON.stringify(script));
      await scriptStore.createScript({
        ...clone,
        _id: null,
        name: `${script.name}_Copy`
      });

      showPop({
        title: 'Duplicated',
        message: `Script "${script.name}" copied.`,
        type: 'success'
      });
    }
  };

  const handleDelete = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    if (await confirm({ title: 'Delete Script', message: `Are you sure you want to delete "${script.name}"?`, type: 'danger' })) {
      await scriptStore.deleteScript(scriptId);
      if (selectedId.value === scriptId) selectedId.value = null;

      showPop({
        title: 'Deleted',
        message: `Script "${script.name}" removed.`,
        type: 'info'
      });
    }
  };

  const handleRefresh = async () => {
    const projectId = editorStore.activeProjectId;
    if (projectId) {
      await scriptStore.fetchScripts(projectId);
      showPop({
        title: 'Refreshed',
        message: 'Script list updated.',
        type: 'success',
        duration: 1500
      });
    }
  };

  const handleApplyToEntity = async (script, entity) => {
    if (!script || !entity) return;

    const controller = entity.components.ScriptController;
    
    const currentData = Array.isArray(controller.data) 
      ? JSON.parse(JSON.stringify(controller.data)) 
      : [];

    const isAlreadyAttached = currentData.some(inst => inst.assetId === script._id);

    if (isAlreadyAttached) {
      showPop({
        title: 'Script Exists',
        message: `Script "${script.name}" is already active on ${entity.name}.`,
        type: 'warning'
      });
    } else {
      const initialVars = {};
      if (Array.isArray(script.exposedVariables)) {
        script.exposedVariables.forEach(v => {
          initialVars[v.name] = v.defaultValue;
        });
      }

      const newInstance = {
        _id: generateInstanceId(),
        assetId: script._id,
        isActive: true,
        variables: initialVars 
      };

      currentData.push(newInstance);

      const updatePayload = { 
        data: currentData 
      };

      if (entity.prefabId) {
         updatePayload.isOverridden = true;
      }

      sceneStore.patchComponent(entity._id, 'ScriptController', updatePayload);

      showPop({
        title: 'Script Attached',
        message: `Added "${script.name}" to ${entity.name}.`,
        type: 'success'
      });
    }

    menu.value.visible = false;
  };

  const handleContextMenu = (e, item) => {
    if (item) selectScript(item);
    
    menu.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item
    };
  };

  const closeMenu = () => {
    menu.value.visible = false;
  };

  const contextMenuItems = computed(() => {
    const targetItem = menu.value.item;

    if (targetItem) {
      const items = [
        { 
          label: targetItem.name, 
          disabled: true,
          class: 'font-semibold text-blue-500' 
        },
        { separator: true }
      ];

      const entity = getEligibleEntity();
      if (entity) {
          items.push({
            label: `Add to ${entity.name}`,
            icon: PlayCircle,
            action: () => handleApplyToEntity(targetItem, entity)
          });
          items.push({ separator: true });
      }

      items.push(
        { 
          label: 'Open Graph', 
          icon: Workflow, 
          action: () => handleOpenGraph(targetItem) 
        },
        { 
          label: 'Rename', 
          icon: Edit3, 
          shortcut: 'F2',
          action: () => handleRename(targetItem._id) 
        },
        { separator: true },
        { 
          label: 'Duplicate', 
          icon: Copy, 
          action: () => handleDuplicate(targetItem._id) 
        },
        { 
          label: 'Delete', 
          icon: Trash2, 
          shortcut: 'Del',
          action: () => handleDelete(targetItem._id) 
        }
      );

      return items;
    }

    return [
      { 
        label: 'New Script', 
        icon: FileCode2, 
        action: () => handleCreate('component')
      },
      { 
        label: 'Refresh', 
        icon: RefreshCw, 
        shortcut: 'F5',
        action: () => handleRefresh() 
      }
    ];
  });

  return {
    searchQuery,
    viewMode,
    selectedId,
    filteredScripts,
    menu,
    contextMenuItems,
    toggleView,
    selectScript,
    handleContextMenu,
    closeMenu,
    handleOpenGraph,
    handleCreate,
    handleRename,
    handleDuplicate,
    handleDelete,
    handleRefresh
  };
}
import { computed } from 'vue';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useLayerActions } from '@/stores/scene/useLayerActions';
import { useEntityActions } from '@/stores/scene/useEntityActions';

export function useClipboard() {
  const editorStore = useEditorStore();
  const sceneStore = useSceneStore();
  
  const activeScene = computed(() => sceneStore.activeScene);
  const selectedEntityIds = computed(() => sceneStore.selectedEntityIds);

  const layerActions = useLayerActions(activeScene);
  const entityActions = useEntityActions(activeScene, selectedEntityIds);

  const getTargets = (explicitId) => {
    if (explicitId) return [explicitId]; 
    return [...sceneStore.selectedEntityIds];
  };

  const isLayerId = (id) => {
    if (!activeScene.value) return false;
    return activeScene.value.layersWorld.some(l => l._id === id) || 
           activeScene.value.layersUI.some(l => l._id === id);
  };

  const copy = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
        const data = layerActions.getLayerData(targets[0]);
        if (data) editorStore.setClipboard('layer', data, 'copy');
    } else {
        const data = entityActions.getEntityDataForClipboard(targets);
        if (data && data.length > 0) editorStore.setClipboard('entity', data, 'copy');
    }
  };

  const cut = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
        const data = layerActions.getLayerData(targets[0]);
        if (data) {
            editorStore.setClipboard('layer', data, 'cut');
            layerActions.deleteLayer(targets[0]);
        }
    } else {
        const data = entityActions.getEntityDataForClipboard(targets);
        if (data && data.length > 0) {
            editorStore.setClipboard('entity', data, 'cut');
            targets.forEach(id => entityActions.deleteEntity(id));
        }
    }
  };

  const duplicate = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
        return layerActions.duplicateLayer(targets[0]);
    } else {
        return entityActions.duplicateEntity(targets);
    }
  };

  const remove = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
        layerActions.deleteLayer(targets[0]);
    } else {
        targets.forEach(id => entityActions.deleteEntity(id));
    }
  };

  const paste = () => {
    const { type, data, mode } = editorStore.clipboard;
    if (!data) return null;

    let resultIds = [];

    if (type === 'layer') {
      resultIds = layerActions.pasteLayer(editorStore.clipboard);
    } 
    else if (type === 'entity') {
      let context = {};
      const currentSelection = sceneStore.selectedEntityIds;
      const referenceId = currentSelection.length > 0 ? currentSelection[0] : null;
      
      if (referenceId) {
        const selectedEntity = sceneStore.activeEntities.find(e => e._id === referenceId);
        if (selectedEntity) {
            context.parentId = selectedEntity.parentId;
            context.layerId = selectedEntity.layerId;
        } else {
             const selectedLayer = activeScene.value.layersWorld.find(l => l._id === referenceId) ||
                                   activeScene.value.layersUI.find(l => l._id === referenceId);
             if (selectedLayer) {
                 context.layerId = selectedLayer._id;
                 context.parentId = null;
             }
        }
      }
      
      resultIds = entityActions.pasteEntity(data, context);
    }

    if (mode === 'cut') {
      editorStore.clearClipboard();
    }
    
    return resultIds;
  };

  return {
    copy,
    cut,
    paste,
    duplicate,
    remove
  };
}
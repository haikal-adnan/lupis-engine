import { useEditorStore } from '@/stores/useEditorStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';

export function useClipboard() {
  const editorStore = useEditorStore();
  const sceneStore = useSceneStore();

  const getTargets = (explicitId) => {
    if (explicitId) return [explicitId];
    return [...sceneStore.selectedEntityIds];
  };

  const isLayerId = (id) => {
    if (!sceneStore.activeScene) return false;
    return sceneStore.activeScene.layersWorld.some(l => l._id === id) || 
           sceneStore.activeScene.layersUI.some(l => l._id === id);
  };

  const copy = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
      const data = sceneStore.getLayerData(targets[0]);
      if (data) editorStore.setClipboard('layer', data, 'copy');
    } else {
      const data = sceneStore.getEntityDataForClipboard(targets);
      if (data && data.length > 0) editorStore.setClipboard('entity', data, 'copy');
    }
  };

  const cut = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
      const data = sceneStore.getLayerData(targets[0]);
      if (data) {
        editorStore.setClipboard('layer', data, 'cut');
        sceneStore.deleteLayer(targets[0]);
      }
    } else {
      const data = sceneStore.getEntityDataForClipboard(targets);
      if (data && data.length > 0) {
        editorStore.setClipboard('entity', data, 'cut');
        targets.forEach(id => sceneStore.deleteEntity(id));
      }
    }
  };

  const duplicate = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
      return sceneStore.duplicateLayer(targets[0]);
    } else {
      return sceneStore.duplicateEntity(targets);
    }
  };

  const remove = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
      sceneStore.deleteLayer(targets[0]);
    } else {
      targets.forEach(id => sceneStore.deleteEntity(id));
    }
  };

  const paste = () => {
    const { type, data, mode } = editorStore.clipboard;
    if (!data) return null;

    let resultIds = [];

    if (type === 'layer') {
      const sourceData = Array.isArray(data) ? data[0] : data;
      const targetSection = sourceData?.section || 'world';

      resultIds = sceneStore.pasteLayer(editorStore.clipboard, targetSection);
      
    } else if (type === 'entity') {
      let context = {};
      const currentSelection = sceneStore.selectedEntityIds;
      const referenceId = currentSelection.length > 0 ? currentSelection[0] : null;

      if (referenceId) {
        const selectedEntity = sceneStore.activeEntities.find(e => e._id === referenceId);
        if (selectedEntity) {
          context.parentId = selectedEntity.parentId;
          context.layerId = selectedEntity.layerId;
        } else {
          const selectedLayer = sceneStore.activeScene.layersWorld.find(l => l._id === referenceId) ||
                                sceneStore.activeScene.layersUI.find(l => l._id === referenceId);
          if (selectedLayer) {
            context.layerId = selectedLayer._id;
            context.parentId = null;
          }
        }
      }

      resultIds = sceneStore.pasteEntity(data, context);
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
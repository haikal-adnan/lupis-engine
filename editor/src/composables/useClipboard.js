import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore, useEntityActions, useLayerActions } from '@scenes/scenes.js';

export function useClipboard() {
  const workspaceStore = useWorkspaceStore();
  const sceneStore = useSceneStore();
  const entityActions = useEntityActions();
  const layerActions = useLayerActions();

  const getTargets = (explicitId) => {
    if (explicitId) return [explicitId];
    return [...sceneStore.selectedEntityIds];
  };

  const isLayerId = (id) => {
    if (!sceneStore.activeScene) return false;
    return sceneStore.activeScene.layersWorld.some(l => l.id === id) || 
           sceneStore.activeScene.layersUI.some(l => l.id === id);
  };

  const copy = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
      const data = layerActions.getLayerData(targets[0]);
      if (data) workspaceStore.setClipboard('layer', data, 'copy');
    } else {
      const data = entityActions.getEntityDataForClipboard(targets);
      if (data && data.length > 0) workspaceStore.setClipboard('entity', data, 'copy');
    }
  };

  const cut = (explicitId = null) => {
    const targets = getTargets(explicitId);
    if (targets.length === 0) return;

    if (isLayerId(targets[0])) {
      const data = layerActions.getLayerData(targets[0]);
      if (data) {
        workspaceStore.setClipboard('layer', data, 'cut');
        layerActions.deleteLayer(targets[0]);
      }
    } else {
      const data = entityActions.getEntityDataForClipboard(targets);
      if (data && data.length > 0) {
        workspaceStore.setClipboard('entity', data, 'cut');
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
    const { type, data, mode } = workspaceStore.clipboard;
    if (!data) return null;

    let resultIds = [];

    if (type === 'layer') {
      const sourceData = Array.isArray(data) ? data[0] : data;
      const targetSection = sourceData?.section || 'world';

      resultIds = layerActions.pasteLayer(workspaceStore.clipboard, targetSection);
      
    } else if (type === 'entity') {
      let context = {};
      const currentSelection = sceneStore.selectedEntityIds;
      const referenceId = currentSelection.length > 0 ? currentSelection[0] : null;

      if (referenceId) {
        const selectedEntity = sceneStore.activeEntities.find(e => e.id === referenceId);
        if (selectedEntity) {
          context.parentId = selectedEntity.parentId;
          context.layerId = selectedEntity.layerId;
        } else {
          const selectedLayer = sceneStore.activeScene.layersWorld.find(l => l.id === referenceId) ||
                                sceneStore.activeScene.layersUI.find(l => l.id === referenceId);
          if (selectedLayer) {
            context.layerId = selectedLayer.id;
            context.parentId = null;
          }
        }
      }

      resultIds = entityActions.pasteEntity(data, context);
    }

    if (mode === 'cut') {
      workspaceStore.clearClipboard();
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

import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore';
import { useScriptStore } from '@/stores/useScriptStore.js';

export function useInspectorLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const scriptStore = useScriptStore();

  const selectedEntity = computed(() => {
    const id = sceneStore.selectedEntityIds[0];
    if (!id || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e._id === id);
  });

  const hasSelection = computed(() => !!selectedEntity.value);

  const isLocked = computed(() => {
    return selectedEntity.value?._editor?.locked || false;
  });

  function bindEntityProp(propName) {
    return computed({
      get: () => selectedEntity.value ? selectedEntity.value[propName] : '',
      set: (val) => {
        if (selectedEntity.value) {
          sceneStore.updateEntityProp(selectedEntity.value._id, propName, val);
        }
      }
    });
  }

  function bindComponentProp(compName, propName) {
    return computed({
      get: () => selectedEntity.value?.components?.[compName]?.[propName],
      set: (val) => {
        if (selectedEntity.value) {
          sceneStore.updateComponentProp(selectedEntity.value._id, compName, propName, val);
        }
      }
    });
  }

  function bindNestedProp(compName, parentProp, childProp) {
    return computed({
      get: () => selectedEntity.value?.components?.[compName]?.[parentProp]?.[childProp],
      set: (val) => {
        if (selectedEntity.value) {
          const path = `${parentProp}.${childProp}`;
          sceneStore.updateComponentProp(selectedEntity.value._id, compName, path, val);
        }
      }
    });
  }

  const scriptsData = computed(() => {
    return selectedEntity.value?.components?.ScriptController?.data || [];
  });

  function addScript(assetId) {
    if (!selectedEntity.value) return;

    const newInstance = {
      _id: `inst_${crypto.randomUUID().split('-')[0]}`,
      assetId: assetId,
      isActive: true,
      variables: {}
    };

    const currentList = [...scriptsData.value];
    currentList.push(newInstance);

    sceneStore.updateComponentProp(
      selectedEntity.value._id, 
      'ScriptController', 
      'data', 
      currentList
    );
  }

  function removeScript(index) {
    if (!selectedEntity.value) return;

    const currentList = [...scriptsData.value];
    currentList.splice(index, 1);

    sceneStore.updateComponentProp(
      selectedEntity.value._id, 
      'ScriptController', 
      'data', 
      currentList
    );
  }

  function updateScriptInstance(index, fieldPath, value) {
    if (!selectedEntity.value) return;
    
    const fullPath = `data.${index}.${fieldPath}`;
    
    sceneStore.updateComponentProp(
      selectedEntity.value._id,
      'ScriptController',
      fullPath,
      value
    );
  }

  const currentTextureUrl = computed(() => {
    if (!selectedEntity.value) return null;
    const spriteComp = selectedEntity.value.components?.SpriteRenderer || selectedEntity.value.components?.Tilemap;
    if (!spriteComp || !spriteComp.assetId) return null;
    const asset = assetStore.getAssetById(spriteComp.assetId);
    return asset ? asset.fileUrl : null;
  });

  function removeComponent(compName) {
    if (!selectedEntity.value) return;
    sceneStore.removeComponent(selectedEntity.value._id, compName); 
  }

  function resetTransform() {
    if (!selectedEntity.value) return;
    const id = selectedEntity.value._id;

    sceneStore.updateComponentProp(id, 'Transform', 'x', 0);
    sceneStore.updateComponentProp(id, 'Transform', 'y', 0);
    sceneStore.updateComponentProp(id, 'Transform', 'rotation', 0);
    sceneStore.updateComponentProp(id, 'Transform', 'scaleX', 1);
    sceneStore.updateComponentProp(id, 'Transform', 'scaleY', 1);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotX', 0.5);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotY', 0.5);
  }

  function updatePivot({ x: newPx, y: newPy }) {
    if (!selectedEntity.value) return;
    
    const ent = selectedEntity.value;
    const t = ent.components.Transform;
    const id = ent._id;

    const oldPx = t.pivotX ?? 0.5;
    const oldPy = t.pivotY ?? 0.5;
    const currentX = t.x || 0;
    const currentY = t.y || 0;
    
    const w = t.width || 0;
    const h = t.height || 0;
    const sx = t.scaleX ?? 1;
    const sy = t.scaleY ?? 1;
    const rotation = t.rotation || 0; 

    const dPx = newPx - oldPx;
    const dPy = newPy - oldPy;

    const localDx = dPx * w * sx;
    const localDy = dPy * h * sy;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const worldDx = localDx * cos - localDy * sin;
    const worldDy = localDx * sin + localDy * cos;

    const newX = currentX + worldDx;
    const newY = currentY + worldDy;

    sceneStore.updateComponentProp(id, 'Transform', 'pivotX', newPx);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotY', newPy);
    
    sceneStore.updateComponentProp(id, 'Transform', 'x', newX);
    sceneStore.updateComponentProp(id, 'Transform', 'y', newY);
  }

  function addComponentToSelection(componentName) {
    if (!selectedEntity.value) return;
    sceneStore.addComponent(selectedEntity.value._id, componentName);
  }

  return {
    selectedEntity,
    hasSelection,
    currentTextureUrl,
    bindEntityProp,
    bindComponentProp,
    bindNestedProp,
    scriptsData,
    addScript,
    removeScript,
    updateScriptInstance,
    removeComponent,
    resetTransform,
    updatePivot,
    addComponentToSelection
  };
}
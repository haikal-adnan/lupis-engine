import { computed, ref, watch } from 'vue';
import { useSceneStore, useEntityActions } from '@scenes/scenes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';

export function useShapeEditorLogic() {
  const sceneStore = useSceneStore();
  const { updateComponentProp } = useEntityActions();
  const workspaceStore = useWorkspaceStore();
  const { recordComponentChange } = useSceneHistory();
  const trigger = ref(0);

  const selectedEntity = computed(() => {
    trigger.value;
    if (!sceneStore.activeScene) return null;

    const activeTab = workspaceStore.activeTab;
    if (activeTab && activeTab.type === 'shape_editor' && activeTab.id) {
      const entByTab = sceneStore.activeScene.entities.find(e => String(e.id) === String(activeTab.id));
      if (entByTab) return entByTab;
    }

    const id = sceneStore.selectedEntityIds?.[0];
    if (!id) return null;
    return sceneStore.activeScene.entities?.find(e => String(e.id) === String(id)) || null;
  });

  // AUTO-CLOSE if current entity becomes a PREFAB
  watch(
    [() => workspaceStore.activeTab, selectedEntity],
    ([activeTab, entity]) => {
      if (activeTab?.type !== 'shape_editor') return;
      if (!entity || entity.prefabId) {
        workspaceStore.closeTab(activeTab.id);
      }
    },
    { immediate: true, deep: true }
  );

  const hasShapeRenderer = computed(() => {
    return selectedEntity.value?.components?.ShapeRenderer?.type === 'custom' || 
           Boolean(selectedEntity.value?.components?.ShapeRenderer);
  });

  const elements = computed(() => {
    return selectedEntity.value?.components?.ShapeRenderer?.elements || [];
  });

  function bindComponentProp(compName, propName, defaultValue = null) {
    return computed({
      get: () => {
        const entity = selectedEntity.value;
        if (!entity || !entity.components?.[compName]) return defaultValue;
        const val = entity.components[compName][propName];
        return val !== undefined ? val : defaultValue;
      },
      set: (val) => {
        const entity = selectedEntity.value;
        if (entity) {
          const targetId = entity.id;
          const oldValue = entity.components?.[compName]?.[propName] ?? defaultValue;

          if (JSON.stringify(oldValue) === JSON.stringify(val)) return;

          recordComponentChange(targetId, compName, propName, oldValue, val);

          updateComponentProp(
            targetId,
            compName,
            propName,
            val
          );

          engineBridge.updateComponentProp({
            entityId: targetId,
            componentName: compName,
            path: propName,
            value: val
          });

          trigger.value++;
        }
      }
    });
  }

  function removeElement(index) {
    const currentElems = [...elements.value];
    if (index >= 0 && index < currentElems.length) {
      const oldElems = [...elements.value];
      currentElems.splice(index, 1);

      const entity = selectedEntity.value;
      if (!entity) return;

      recordComponentChange(entity.id, 'ShapeRenderer', 'elements', oldElems, currentElems);

      updateComponentProp(entity.id, 'ShapeRenderer', 'elements', currentElems);
      engineBridge.updateComponentProp({
        entityId: entity.id,
        componentName: 'ShapeRenderer',
        path: 'elements',
        value: currentElems
      });
    }
  }

  function updateElement(index, updatedData) {
    const currentElems = [...elements.value];
    if (index >= 0 && index < currentElems.length) {
      currentElems[index] = { ...currentElems[index], ...updatedData };
      bindComponentProp('ShapeRenderer', 'elements').value = currentElems;
    }
  }

  return {
    selectedEntity,
    hasShapeRenderer,
    elements,
    bindComponentProp,
    removeElement,
    updateElement
  };
}
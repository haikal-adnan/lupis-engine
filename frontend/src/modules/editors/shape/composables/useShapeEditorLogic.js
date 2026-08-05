import { computed, ref, onMounted } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useShapeEditorLogic() {
  const sceneStore = useSceneStore();
  const trigger = ref(0);

  const selectedEntity = computed(() => {
    trigger.value;
    if (!sceneStore.activeScene) return null;
    const id = sceneStore.selectedEntityIds?.[0];
    if (!id) return null;
    return sceneStore.activeScene.entities?.find(e => e._id === id || e.id === id) || null;
  });

  const hasShapeRenderer = computed(() => {
    return selectedEntity.value?.components?.ShapeRenderer?.type === 'custom';
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
          const targetId = entity._id || entity.id;
          
          sceneStore.updateComponentProp(
            targetId,
            compName,
            propName,
            val
          );

          EngineBridge.updateComponentProp({
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
    currentElems.splice(index, 1);
    bindComponentProp('ShapeRenderer', 'elements').value = currentElems;
  }

  function updateElement(index, updatedData) {
    const currentElems = [...elements.value];
    currentElems[index] = { ...currentElems[index], ...updatedData };
    bindComponentProp('ShapeRenderer', 'elements').value = currentElems;
  }

  const onEntityUpdate = () => { trigger.value++; };

  onMounted(() => {
    if (EngineBridge?.onEntityModified) {
      EngineBridge.onEntityModified(onEntityUpdate);
    }
  });

  return {
    selectedEntity,
    hasShapeRenderer,
    elements,
    bindComponentProp,
    removeElement,
    updateElement
  };
}
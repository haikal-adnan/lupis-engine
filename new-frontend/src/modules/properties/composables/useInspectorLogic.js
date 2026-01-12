import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore';

export function useInspectorLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();

  const selectedEntity = computed(() => {
    const id = sceneStore.selectedEntityIds[0];
    if (!id || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e._id === id);
  });

  const hasSelection = computed(() => !!selectedEntity.value);

  function bindEntityProp(propName) {
    return computed({
      get: () => selectedEntity.value ? selectedEntity.value[propName] : '',
      set: (val) => {
        if (selectedEntity.value) {
          sceneStore.updateEntityProp(
            selectedEntity.value._id,
            propName,
            val
          );
        }
      }
    });
  }

  function bindComponentProp(compName, propName) {
    return computed({
      get: () =>
        selectedEntity.value?.components?.[compName]?.[propName],
      set: (val) => {
        if (selectedEntity.value) {
          sceneStore.updateComponentProp(
            selectedEntity.value._id,
            compName,
            propName,
            val
          );
        }
      }
    });
  }

  function bindNestedProp(compName, parentProp, childProp) {
    return computed({
      get: () =>
        selectedEntity.value?.components?.[compName]?.[parentProp]?.[childProp],
      set: (val) => {
        if (selectedEntity.value) {
          const path = `${parentProp}.${childProp}`;
          sceneStore.updateComponentProp(
            selectedEntity.value._id,
            compName,
            path,
            val
          );
        }
      }
    });
  }

  const currentTextureUrl = computed(() => {
    if (!selectedEntity.value) return null;

    const spriteComp =
      selectedEntity.value.components?.SpriteRenderer;

    if (!spriteComp || !spriteComp.assetId) return null;

    const asset = assetStore.getAssetById(spriteComp.assetId);
    return asset ? asset.fileUrl : null;
  });

  function removeComponent(compName) {
    if (!selectedEntity.value) return;
    console.warn(
      'Harap implementasikan removeComponent di entityActions.js'
    );
  }

  function resetTransform() {
    if (!selectedEntity.value) return;
    const id = selectedEntity.value._id;

    sceneStore.updateComponentProp(id, 'Transform', 'x', 0);
    sceneStore.updateComponentProp(id, 'Transform', 'y', 0);
    sceneStore.updateComponentProp(id, 'Transform', 'rotation', 0);
    sceneStore.updateComponentProp(id, 'Transform', 'width', 100);
    sceneStore.updateComponentProp(id, 'Transform', 'height', 100);
  }

  function updatePivot({ x, y }) {
    if (!selectedEntity.value) return;
    const id = selectedEntity.value._id;
    sceneStore.updateComponentProp(id, 'Transform', 'pivotX', x);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotY', y);
  }

  return {
    selectedEntity,
    hasSelection,
    currentTextureUrl,
    bindEntityProp,
    bindComponentProp,
    bindNestedProp,
    removeComponent,
    resetTransform,
    updatePivot
  };
}

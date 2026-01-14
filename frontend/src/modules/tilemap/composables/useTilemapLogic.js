import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore';

export function useTilemapLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();

  const selectedEntity = computed(() => {
    const id = sceneStore.selectedEntityIds[0];
    if (!id || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e._id === id);
  });

  const hasTilemap = computed(() => !!selectedEntity.value?.components?.Tilemap);

  function bindComponentProp(compName, propName) {
    return computed({
      get: () => {
        return selectedEntity.value?.components?.[compName]?.[propName];
      },
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

  const currentTextureUrl = computed(() => {
    const entity = selectedEntity.value;
    if (!entity) return null;

    const tilemapComp = entity.components?.Tilemap;
    
    if (!tilemapComp || !tilemapComp.assetId) return null;

    const asset = assetStore.getAssetById(tilemapComp.assetId);
    
    return asset ? asset.fileUrl : null;
  });

  const assetId = bindComponentProp('Tilemap', 'assetId');

  const tileWidth = bindComponentProp('Tilemap', 'tileWidth');
  const tileHeight = bindComponentProp('Tilemap', 'tileHeight');

  const width = bindComponentProp('Tilemap', 'width');
  const height = bindComponentProp('Tilemap', 'height');

  return {
    selectedEntity,
    hasTilemap,
    currentTextureUrl,
    assetId,
    tileWidth,
    tileHeight,
    width,
    height
  };
}
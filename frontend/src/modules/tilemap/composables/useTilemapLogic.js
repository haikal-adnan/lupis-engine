// src/modules/tilemap/composables/useTilemapLogic.js
import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore';
import { useEditorStore } from '@/stores/useEditorStore';

export function useTilemapLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const editorStore = useEditorStore();

  const selectedEntity = computed(() => {
    // Pastikan activeScene ada sebelum akses entities
    if (!sceneStore.activeScene) return null;

    const id = sceneStore.selectedEntityIds[0];
    if (!id) return null;
    
    return sceneStore.activeScene.entities.find(e => e._id === id) || null;
  });

  // Safety check: Pastikan entity dan komponen Tilemap ada
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
    // Tambahkan optional chaining ?.assetId
    if (!tilemapComp?.assetId) return null;

    const asset = assetStore.getAssetById(tilemapComp.assetId);
    return asset ? asset.fileUrl : null;
  });

  // FIX: Pastikan ini aman diakses meski entity null (akan return undefined, bukan crash)
  const assetId = bindComponentProp('Tilemap', 'assetId');
  const tileWidth = bindComponentProp('Tilemap', 'tileWidth');
  const tileHeight = bindComponentProp('Tilemap', 'tileHeight');
  const width = bindComponentProp('Tilemap', 'width');
  const height = bindComponentProp('Tilemap', 'height');

  function openTilemapEditor() {
    const entity = selectedEntity.value;
    if (!entity) return;

    editorStore.openTab({
        id: entity._id,
        name: entity.name || 'Tilemap',
        type: 'tilemap',
        fixed: false
    });
  }

  return {
    selectedEntity,
    hasTilemap,
    currentTextureUrl,
    assetId,
    tileWidth,
    tileHeight,
    width,
    height,
    bindComponentProp,
    openTilemapEditor
  };
}
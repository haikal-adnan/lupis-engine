import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore';

export function useInspectorLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();

  // 1. Ambil Entity yang sedang diseleksi dari Store
  // Mengambil ID pertama dari array selectedEntityIds
  const selectedEntity = computed(() => {
    const id = sceneStore.selectedEntityIds[0];
    if (!id || !sceneStore.activeScene) return null;
    
    return sceneStore.activeScene.entities.find(e => e._id === id);
  });

  const hasSelection = computed(() => !!selectedEntity.value);

  

  // 2. Binding Properti Root (Name, Tag, Visible, Active, dll)
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

  // 3. Binding Properti Component (Direct)
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

  // 4. Binding Properti Component (Nested, misal: source.x)
  function bindNestedProp(compName, parentProp, childProp) {
    return computed({
      get: () => selectedEntity.value?.components?.[compName]?.[parentProp]?.[childProp],
      set: (val) => {
        if (selectedEntity.value) {
          // Path digabung menjadi string "parentProp.childProp"
          const path = `${parentProp}.${childProp}`;
          sceneStore.updateComponentProp(selectedEntity.value._id, compName, path, val);
        }
      }
    });
  }

  // 5. Logic Texture Thumbnail (Resolve Asset ID ke URL)
  // Ini read-only untuk display thumbnail
  const currentTextureUrl = computed(() => {
    // 1. Pastikan ada entity yang terpilih
    if (!selectedEntity.value) return null;

    // 2. Ambil component SpriteRenderer
    const spriteComp = selectedEntity.value.components?.SpriteRenderer;
    
    // 3. Cek apakah ada assetId di komponen tersebut
    if (!spriteComp || !spriteComp.assetId) {
      return null; 
    }

    // 4. Cari Asset di Asset Store menggunakan Getter
    // getter: getAssetById(id) mereturn object asset
    const asset = assetStore.getAssetById(spriteComp.assetId);
    
    // 5. Jika asset ketemu, kembalikan fileUrl (sesuai screenshot object asset)
    if (asset) {
      return asset.fileUrl; 
    }

    return null; // Asset ID ada di entity, tapi barangnya tidak ada di store
  });
  // 6. Utility Functions
  function removeComponent(compName) {
    if (!selectedEntity.value) return;
    
    // Anda perlu membuat action deleteComponent di entityActions.js 
    // sceneStore.removeComponent(selectedEntity.value._id, compName);
    console.warn("Harap implementasikan removeComponent di entityActions.js");
  }

  function resetTransform() {
    if (!selectedEntity.value) return;
    const id = selectedEntity.value._id;

    // Batch update (ideally buat action resetTransform di store agar atomik)
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
    selectedEntity, // Read-only reactive object untuk display header
    hasSelection,
    currentTextureUrl, // Pengganti MOCK_ASSETS
    bindEntityProp,
    bindComponentProp,
    bindNestedProp,
    removeComponent,
    resetTransform,
    updatePivot
  };
}
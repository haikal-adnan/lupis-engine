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
      selectedEntity.value.components?.SpriteRenderer ||
      selectedEntity.value.components?.Tilemap ;

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
    sceneStore.updateComponentProp(id, 'Transform', 'scaleX', 1);
    sceneStore.updateComponentProp(id, 'Transform', 'scaleY', 1);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotX', 0.5);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotY', 0.5);
  }

  // --- IMPLEMENTASI SMART PIVOT (Kompensasi Posisi) ---
  function updatePivot({ x: newPx, y: newPy }) {
    if (!selectedEntity.value) return;
    
    const ent = selectedEntity.value;
    const t = ent.components.Transform;
    const id = ent._id;

    // 1. Ambil state saat ini
    const oldPx = t.pivotX ?? 0.5;
    const oldPy = t.pivotY ?? 0.5;
    const currentX = t.x || 0;
    const currentY = t.y || 0;
    
    // Dimensi & Transformasi
    const w = t.width || 0;
    const h = t.height || 0;
    const sx = t.scaleX ?? 1;
    const sy = t.scaleY ?? 1;
    const rotation = t.rotation || 0; // Asumsi: Radians

    // 2. Hitung selisih pivot (Local Space 0-1)
    const dPx = newPx - oldPx;
    const dPy = newPy - oldPy;

    // 3. Konversi ke Pixel (Unrotated)
    const localDx = dPx * w * sx;
    const localDy = dPy * h * sy;

    // 4. Rotasi Vector Offset (Local -> World)
    // Agar pergeseran mengikuti orientasi entity
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const worldDx = localDx * cos - localDy * sin;
    const worldDy = localDx * sin + localDy * cos;

    // 5. Hitung Posisi Baru
    // Geser titik X,Y entity agar visual gambar tetap di tempat
    const newX = currentX + worldDx;
    const newY = currentY + worldDy;

    // 6. Update Store (Pivot Baru + Posisi Baru)
    sceneStore.updateComponentProp(id, 'Transform', 'pivotX', newPx);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotY', newPy);
    
    // Kita gunakan nilai presisi tinggi (float) agar visual akurat
    sceneStore.updateComponentProp(id, 'Transform', 'x', newX);
    sceneStore.updateComponentProp(id, 'Transform', 'y', newY);
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
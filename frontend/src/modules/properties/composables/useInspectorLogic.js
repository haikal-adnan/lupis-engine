import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useAssetStore } from '@/stores/useAssetStore';
import { useScriptStore } from '@/stores/useScriptStore.js';

export function useInspectorLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const scriptStore = useScriptStore();

  // --- Core Selection Logic ---
  const selectedEntity = computed(() => {
    const id = sceneStore.selectedEntityIds[0];
    if (!id || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e._id === id);
  });

  const hasSelection = computed(() => !!selectedEntity.value);

  const isLocked = computed(() => {
    return selectedEntity.value?._editor?.locked || false;
  });

  // Hotkey: ESC untuk clear selection
  const handleKeydown = (e) => {
    if (e.key === "Escape" && hasSelection.value) {
      sceneStore.clearSelection(); 
    }
  };

  onMounted(() => window.addEventListener("keydown", handleKeydown));
  onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));

  // --- 1. Binding Scene Settings (Global) ---
  function bindSettingProp(category, propName) {
    return computed({
      get: () => {
        const s = sceneStore.activeScene?.settings;
        if (!s) return undefined;
        return category ? s[category]?.[propName] : s[propName];
      },
      set: (val) => {
        if (!sceneStore.activeScene) return;

        // Kategori: World Bounds
        if (category === 'worldBounds') {
          sceneStore.updateWorldBounds({ [propName]: val });
        } 
        // Kategori: Grid
        else if (category === 'grid') {
          const grid = sceneStore.activeScene.settings.grid;
          if (propName === 'width') sceneStore.setGridSize(val, grid.height);
          else if (propName === 'height') sceneStore.setGridSize(grid.width, val);
          else if (propName === 'color') sceneStore.setGridColor(val);
          else if (propName === 'opacity') sceneStore.setGridOpacity(val);
          else if (propName === 'visible' && val !== grid.visible) sceneStore.toggleGrid();
          else if (propName === 'snap' && val !== grid.snap) sceneStore.toggleMagnet();
        } 
        // Root Settings (Tanpa Kategori)
        else if (!category) {
          if (propName === 'backgroundColor') sceneStore.setBackgroundColor(val);
          else if (propName === 'tickRate') sceneStore.setTickRate(val);
          else if (propName === 'showRulers' && val !== sceneStore.activeScene.settings.showRulers) {
            sceneStore.toggleRulers();
          }
        }
      }
    });
  }

  // --- 2. Binding Entity Properties (Name, Tag, etc.) ---
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

  // --- 3. Binding Component Properties (Sprite, Shape, etc.) ---
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

  // --- 4. Binding Nested Properties (e.g. Transform.scale.x) ---
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

  // --- Component Management ---
  function addComponentToSelection(componentName) {
    if (!selectedEntity.value) return;
    sceneStore.addComponent(selectedEntity.value._id, componentName);
  }

  function removeComponent(compName) {
    if (!selectedEntity.value) return;
    sceneStore.removeComponent(selectedEntity.value._id, compName); 
  }

  // --- Transform Specific Helpers ---
  function resetTransform() {
    if (!selectedEntity.value) return;
    const id = selectedEntity.value._id;
    const updates = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
    
    Object.entries(updates).forEach(([prop, val]) => {
      sceneStore.updateComponentProp(id, 'Transform', prop, val);
    });
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
    const rotation = (t.rotation || 0) * (Math.PI / 180); 

    const dPx = newPx - oldPx;
    const dPy = newPy - oldPy;

    const localDx = dPx * w * sx;
    const localDy = dPy * h * sy;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const worldDx = localDx * cos - localDy * sin;
    const worldDy = localDx * sin + localDy * cos;

    sceneStore.updateComponentProp(id, 'Transform', 'pivotX', newPx);
    sceneStore.updateComponentProp(id, 'Transform', 'pivotY', newPy);
    sceneStore.updateComponentProp(id, 'Transform', 'x', currentX + worldDx);
    sceneStore.updateComponentProp(id, 'Transform', 'y', currentY + worldDy);
  }

  // --- Scripting Helpers ---
  const scriptsData = computed(() => {
    return selectedEntity.value?.components?.ScriptController?.data || [];
  });

  function addScript(assetId) {
    if (!selectedEntity.value) return;
    const newInstance = {
      _id: `inst_${crypto.randomUUID().split('-')[0]}`,
      assetId,
      isActive: true,
      variables: {}
    };
    const currentList = [...scriptsData.value, newInstance];
    sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', 'data', currentList);
  }

  function removeScript(index) {
    if (!selectedEntity.value) return;
    const currentList = [...scriptsData.value];
    currentList.splice(index, 1);
    sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', 'data', currentList);
  }

  // --- Asset Helpers ---
  const currentTextureUrl = computed(() => {
    if (!selectedEntity.value) return null;
    const comp = selectedEntity.value.components?.SpriteRenderer || selectedEntity.value.components?.Tilemap;
    if (!comp?.assetId) return null;
    return assetStore.getAssetById(comp.assetId)?.fileUrl || null;
  });

  return {
    // States
    selectedEntity,
    hasSelection,
    isLocked,
    currentTextureUrl,
    scriptsData,

    // Binding Methods
    bindSettingProp,
    bindEntityProp,
    bindComponentProp,
    bindNestedProp,

    // Action Methods
    addComponentToSelection,
    removeComponent,
    resetTransform,
    updatePivot,
    addScript,
    removeScript
  };
}
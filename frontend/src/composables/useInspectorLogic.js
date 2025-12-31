import { ref, computed, triggerRef } from "vue";
import { useSelection } from "@/composables/useSelection.js";
import { bus } from "@engine/Util/EventBus.js";

export function useInspectorLogic() {
  const { selectedEntity } = useSelection();
  const isRatioLocked = ref(false);

  const notifyChange = () => {
    if (selectedEntity.value) {
      bus.emit("entity:modified", [selectedEntity.value], true);
    }
  };

  const bindComponentProp = (compName, propName, defaultValue = "") =>
    computed({
      get: () => {
        return (
          selectedEntity.value?.components?.[compName]?.[propName] ??
          defaultValue
        );
      },
      set: (val) => {
        if (selectedEntity.value?.components?.[compName]) {
          selectedEntity.value.components[compName][propName] = val;
          triggerRef(selectedEntity);
          notifyChange();
        }
      },
    });

  const bindNestedProp = (compName, subObjName, propName) =>
    computed({
      get: () => {
        return (
          selectedEntity.value?.components?.[compName]?.[subObjName]?.[
            propName
          ] ?? 0
        );
      },
      set: (val) => {
        const comp = selectedEntity.value?.components?.[compName];
        
        // Pastikan component induknya ada
        if (comp) {
          // PERBAIKAN: Jika 'source' belum ada, buat object kosong dulu!
          if (!comp[subObjName]) {
            comp[subObjName] = {}; 
          }

          const num = parseFloat(val);
          // Simpan nilai ke dalam object
          comp[subObjName][propName] = isNaN(num) ? 0 : num;
          
          triggerRef(selectedEntity);
          notifyChange();
        }
      },
    });
    
  const removeComponent = (keyName) => {
    if (!selectedEntity.value?.components) return;
    const displayName = keyName.replace(/([A-Z])/g, " $1").trim();

    if (confirm(`Remove ${displayName}?`)) {
      delete selectedEntity.value.components[keyName];
      triggerRef(selectedEntity);
      notifyChange();
    }
  };

  const boundTag = computed({
    get: () => selectedEntity.value?.tag || "untagged",
    set: (val) => {
      if (selectedEntity.value) {
        selectedEntity.value.tag = val;
        triggerRef(selectedEntity);
        notifyChange();
      }
    },
  });

  const displayOpacity = computed({
    get: () => selectedEntity.value?.opacity ?? 100,
    set: (val) => {
      if (selectedEntity.value) {
        selectedEntity.value.opacity = val;
        triggerRef(selectedEntity);
        notifyChange();
      }
    },
  });

  const getTransform = () => {
    if (!selectedEntity.value) return null;
    if (!selectedEntity.value.transform)
      selectedEntity.value.transform = {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      };
    return selectedEntity.value.transform;
  };

  const bindPosition = (prop) =>
    computed({
      get: () => {
        if (!selectedEntity.value) return 0;
        const val = selectedEntity.value.transform?.[prop] ?? 0;
        return Math.round(val * 100) / 100;
      },
      set: (val) => {
        const t = getTransform();
        if (t) {
          const num = parseFloat(val);
          t[prop] = isNaN(num) ? 0 : num;
          triggerRef(selectedEntity);
          notifyChange();
        }
      },
    });

  const displayRotation = computed({
    get: () => {
      if (!selectedEntity.value) return 0;
      const t = selectedEntity.value?.transform;
      const rad = t?.rotation ?? 0;
      return Math.round((rad * (180 / Math.PI)) % 360);
    },
    set: (val) => {
      const t = getTransform();
      if (t) {
        t.rotation = val * (Math.PI / 180);
        triggerRef(selectedEntity);
        notifyChange();
      }
    },
  });

  const isFlippedX = computed(
    () => (selectedEntity.value?.transform?.scaleX ?? 1) < 0
  );
  const isFlippedY = computed(
    () => (selectedEntity.value?.transform?.scaleY ?? 1) < 0
  );

  const toggleFlipX = () => {
    const t = getTransform();
    if (t) {
      t.scaleX = (t.scaleX ?? 1) * -1;
      triggerRef(selectedEntity);
      notifyChange();
    }
  };

  const toggleFlipY = () => {
    const t = getTransform();
    if (t) {
      t.scaleY = (t.scaleY ?? 1) * -1;
      triggerRef(selectedEntity);
      notifyChange();
    }
  };

  const sizeW = computed({
    get: () =>
      selectedEntity.value
        ? Math.round(selectedEntity.value.width * 100) / 100
        : 0,
    set: (val) => {
      if (!selectedEntity.value) return;
      const oldW = selectedEntity.value.width || 1;
      selectedEntity.value.width = val;

      if (isRatioLocked.value) {
        selectedEntity.value.height =
          val * (selectedEntity.value.height / oldW);
      }
      triggerRef(selectedEntity);
      notifyChange();
    },
  });

  const sizeH = computed({
    get: () =>
      selectedEntity.value
        ? Math.round(selectedEntity.value.height * 100) / 100
        : 0,
    set: (val) => {
      if (!selectedEntity.value) return;
      const oldH = selectedEntity.value.height || 1;
      selectedEntity.value.height = val;

      if (isRatioLocked.value) {
        selectedEntity.value.width =
          val * (selectedEntity.value.width / oldH);
      }
      triggerRef(selectedEntity);
      notifyChange();
    },
  });

  const setPivot = (newX, newY) => {
    const e = selectedEntity.value;
    if (!e) return;
    const t = getTransform();

    const oldPx = t.pivotX ?? 0.5;
    const oldPy = t.pivotY ?? 0.5;
    const w = e.width || 0;
    const h = e.height || 0;
    const sx = t.scaleX ?? 1;
    const sy = t.scaleY ?? 1;
    const r = t.rotation || 0;

    const diffX = (newX - oldPx) * w * sx;
    const diffY = (newY - oldPy) * h * sy;
    const c = Math.cos(r);
    const s = Math.sin(r);

    t.x += diffX * c - diffY * s;
    t.y += diffX * s + diffY * c;
    t.pivotX = newX;
    t.pivotY = newY;

    triggerRef(selectedEntity);
    notifyChange();
  };

  const isActivePivot = (x, y) => {
    const t = selectedEntity.value?.transform;
    if (!t) return false;
    return (
      Math.abs((t.pivotX ?? 0.5) - x) < 0.01 &&
      Math.abs((t.pivotY ?? 0.5) - y) < 0.01
    );
  };

  return {
    selectedEntity,
    notifyChange,
    bindComponentProp,
    bindNestedProp,
    removeComponent,
    boundTag,
    displayOpacity,
    posX: bindPosition("x"),
    posY: bindPosition("y"),
    displayRotation,
    isFlippedX,
    isFlippedY,
    toggleFlipX,
    toggleFlipY,
    sizeW,
    sizeH,
    isRatioLocked,
    setPivot,
    isActivePivot,
  };
}

import { useHistory } from '@historys/historys.js';
import { useSceneStore } from '@scenes/scenes.js';
import { engineBridge } from '@engines/engines.js';

let activeTransaction = null;
let clearTransactionTimer = null;

let activeStroke = null;

if (typeof window !== 'undefined' && !window.__TILEMAP_HISTORY_LISTENERS_SET__) {
  window.__TILEMAP_HISTORY_LISTENERS_SET__ = true;

  const startTransaction = () => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    if (!activeTransaction) {
      activeTransaction = { isContinuous: true, initialValues: {} };
    }
  };

  const endTransactionWithDelay = (delay = 100) => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    clearTransactionTimer = setTimeout(() => { activeTransaction = null; }, delay);
  };

  window.addEventListener('mousedown', (e) => {
    const isScrub = e.target.closest('.cursor-ew-resize') || e.target.classList?.contains('cursor-ew-resize');
    const isRangeInput = e.target.type === 'range' || e.target.closest('input[type="range"]');
    if (isScrub || isRangeInput) {
      startTransaction();
    }
  }, true);

  window.addEventListener('mouseup', () => {
    if (activeTransaction) endTransactionWithDelay(50);
  }, true);
}

export function useTilemapHistory() {
  const { record, undo, redo, logHistory } = useHistory();
  const sceneStore = useSceneStore();

  const deepClone = (data) => (data ? JSON.parse(JSON.stringify(data)) : null);

  const startStrokeTransaction = (entityId, initialTileData) => {
    if (!entityId) return;
    activeStroke = {
      entityId,
      initialData: deepClone(initialTileData || [])
    };
  };

  const endStrokeTransaction = (description = 'Paint Tilemap') => {
    if (!activeStroke) return;

    const { entityId, initialData } = activeStroke;
    activeStroke = null;

    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const scene = sceneStore.getSceneById(targetSceneId);
    if (!scene) return;

    const entity = scene.entities.find((e) => String(e.id) === String(entityId));
    const finalData = deepClone(entity?.components?.Tilemap?.data || []);

    if (JSON.stringify(initialData) === JSON.stringify(finalData)) return;

    record({
      type: 'CHANGE_TILEMAP_DATA',
      description: `${description} on ${entityId}`,
      undo: () => {
        sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', deepClone(initialData));
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateComponentProp({ entityId, componentName: 'Tilemap', path: 'data', value: deepClone(initialData) });
        }
      },
      redo: () => {
        sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', deepClone(finalData));
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateComponentProp({ entityId, componentName: 'Tilemap', path: 'data', value: deepClone(finalData) });
        }
      }
    });
  };

  const recordTilemapPropChange = (entityId, propPath, oldValue, newValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId || !entityId) return;

    let transactionKey = null;
    let originalOldValue = deepClone(oldValue);

    if (activeTransaction && activeTransaction.isContinuous) {
      transactionKey = `trans_tilemap_${targetSceneId}_${entityId}_${propPath}`;
      if (!(transactionKey in activeTransaction.initialValues)) {
        activeTransaction.initialValues[transactionKey] = deepClone(oldValue);
      }
      originalOldValue = activeTransaction.initialValues[transactionKey];
    }

    const clonedNewValue = deepClone(newValue);

    record({
      type: 'CHANGE_TILEMAP_PROP',
      transactionKey, 
      description: `Change Tilemap.${propPath} on ${entityId}`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        const valToApply = deepClone(originalOldValue);
        sceneStore.updateComponentProp(entityId, 'Tilemap', propPath, valToApply);

        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateComponentProp({
            entityId,
            componentName: 'Tilemap',
            path: propPath,
            value: valToApply
          });
        }
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        const valToApply = deepClone(clonedNewValue);
        sceneStore.updateComponentProp(entityId, 'Tilemap', propPath, valToApply);

        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateComponentProp({
            entityId,
            componentName: 'Tilemap',
            path: propPath,
            value: valToApply
          });
        }
      }
    });
  };

  return {
    startStrokeTransaction,
    endStrokeTransaction,
    recordTilemapPropChange,
    undo,
    redo,
    logHistory
  };
}
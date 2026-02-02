import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { useLayerActions } from './layerActions';
import { useEntityActions } from './entityActions';
import { useSceneActions } from './sceneActions';

export const useSceneStore = defineStore('scene', () => {

  const scenes = ref([]);
  const activeSceneId = ref(null);
  const selectedEntityIds = ref(['ent_main_tilemap']);

  const activeScene = computed(() => scenes.value.find(s => s._id === activeSceneId.value));
  
  const getSceneById = computed(() => (id) => scenes.value.find(s => s._id === id));
  
  const activeEntities = computed(() => activeScene.value ? activeScene.value.entities : []);
  
  const activeLayers = computed(() => activeScene.value ? activeScene.value.layers : []);

  const initScenes = (sceneList) => {
    scenes.value = Array.isArray(sceneList) ? sceneList : [];
    if (scenes.value.length > 0 && !activeSceneId.value) {
      activeSceneId.value = scenes.value[0]._id;
    }
  };

  const setActiveScene = (sceneId) => {
    const scene = scenes.value.find(s => s._id === sceneId);
    if (scene) {
      activeSceneId.value = scene._id;
      selectedEntityIds.value = [];
    }
  };

  // Action untuk update parsial (Hanya update value yang dikirim)
  const patchComponent = (entityId, componentName, updates) => {
    const scene = activeScene.value;
    if (!scene) return;

    const entity = scene.entities.find(e => e._id === entityId);
    if (entity && entity.components && entity.components[componentName]) {
      // Object.assign akan menimpa hanya key yang ada di 'updates', sisanya tetap
      Object.assign(entity.components[componentName], updates);
    }
  };

  const syncTilemapDataFromEngine = (entityId, newData) => {
    const scene = activeScene.value;
    if (!scene) return;

    const entity = scene.entities.find(e => e._id === entityId);
    if (entity && entity.components && entity.components.Tilemap) {
      // Update reaktif agar Vue merender ulang canvas jika perlu
      entity.components.Tilemap.data = [...newData];
      console.log(`[Store] Tilemap data synced for ${entityId}`);
    }
  };

  const syncTransformFromEngine = (entityId, transformData) => {
    const scene = activeScene.value;
    if (!scene) return;

    const entity = scene.entities.find(e => e._id === entityId);
    if (entity && entity.components && entity.components.Transform) {
      Object.assign(entity.components.Transform, transformData);
    }
  };

  const sceneActions = useSceneActions(scenes, activeSceneId, selectedEntityIds);
  const layerActions = useLayerActions(activeScene);
  const entityActions = useEntityActions(activeScene, selectedEntityIds);

  return {
    scenes,
    activeSceneId,
    selectedEntityIds,
    syncTilemapDataFromEngine,
    
    activeScene,
    getSceneById,
    activeEntities,
    activeLayers,

    initScenes,
    setActiveScene,
    syncTransformFromEngine,
    patchComponent,

    ...sceneActions,
    ...layerActions,
    ...entityActions 
  };
});
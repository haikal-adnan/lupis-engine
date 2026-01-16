import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { useLayerActions } from './layerActions';
import { useEntityActions } from './entityActions'; // Pastikan ini mengarah ke file yang baru diedit
import { useSceneActions } from './sceneActions';

export const useSceneStore = defineStore('scene', () => {

  const scenes = ref([]);
  const activeSceneId = ref(null);
  const selectedEntityIds = ref(["ent_main_tilemap"]);

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

  // Sync Transform (Gizmo)
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
  
  // Ini akan memuat syncTilemapDataFromEngine yang baru dibuat
  const entityActions = useEntityActions(activeScene, selectedEntityIds);

  return {
    scenes,
    activeSceneId,
    selectedEntityIds,
    
    activeScene,
    getSceneById,
    activeEntities,
    activeLayers,

    initScenes,
    setActiveScene,
    syncTransformFromEngine,

    ...sceneActions,
    ...layerActions,
    ...entityActions // syncTilemapDataFromEngine sekarang bisa diakses via store
  };
});
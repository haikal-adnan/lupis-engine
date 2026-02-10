import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { useLayerActions } from './layerActions';
import { useEntityActions } from './entityActions';
import { useSceneActions } from './sceneActions';
import { useSettingActions } from './settingActions'; 

export const useSceneStore = defineStore('scene', () => {
  const scenes = ref([]);
  const activeSceneId = ref(null);
  const selectedEntityIds = ref([]);

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

  const clearSelection = () => {
    selectedEntityIds.value = [];
  };

  const setActiveScene = (sceneId) => {
    const scene = scenes.value.find(s => s._id === sceneId);
    if (scene) {
      activeSceneId.value = scene._id;
      selectedEntityIds.value = []; 
    }
  };

  const patchComponent = (entityId, componentName, updates) => {
    const scene = activeScene.value;
    if (!scene) return;
    
    const entity = scene.entities.find(e => String(e._id) === String(entityId));
    if (entity?.components?.[componentName]) {
      Object.assign(entity.components[componentName], updates);
    }
  };

  const syncComponentFromEngine = (entityId, componentName, data) => {
    const scene = activeScene.value;
    if (!scene) return;
    
    const entity = scene.entities.find(e => String(e._id) === String(entityId));
    if (!entity) return;

    if (!entity.components[componentName]) {
      entity.components[componentName] = {};
    }

    entity.components[componentName] = {
      ...entity.components[componentName],
      ...data
    };
  };

  const syncTilemapDataFromEngine = (entityId, newData) => {
    const scene = activeScene.value;
    if (!scene) return;
    
    const entity = scene.entities.find(e => String(e._id) === String(entityId));
    if (entity?.components?.Tilemap) {
      entity.components.Tilemap = {
        ...entity.components.Tilemap,
        data: [...newData]
      };
    }
  };

  const syncTransformFromEngine = (entityId, transformData) => {
    const scene = activeScene.value;
    if (!scene) return;
    
    const entity = scene.entities.find(e => String(e._id) === String(entityId));
    if (!entity) return;

    if (entity.components?.Transform) {
      entity.components.Transform = {
        ...entity.components.Transform,
        ...transformData
      };
    } 
    else if (entity.components?.UITransform) {
      entity.components.UITransform = {
        ...entity.components.UITransform,
        ...transformData
      };
    }
  };

  const sceneActions = useSceneActions(scenes, activeSceneId, selectedEntityIds);
  const layerActions = useLayerActions(activeScene);
  const entityActions = useEntityActions(activeScene, selectedEntityIds);
  const settingActions = useSettingActions(activeScene); 

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
    clearSelection,
    
    syncTilemapDataFromEngine,
    syncTransformFromEngine,
    syncComponentFromEngine,
    patchComponent,

    ...sceneActions,
    ...layerActions,
    ...entityActions,
    ...settingActions 
  };
});
import { defineStore } from 'pinia';
import { sceneActions } from './useSceneActions';
import { layerActions } from './useLayerActions';
import { entityActions } from './useEntityActions';
import { settingActions } from './useSettingActions'; 
import { animatorActions } from './useAnimatorActions';

export const useSceneStore = defineStore('scene', {
  state: () => ({
    scenes: [],
    activeSceneId: null,
    selectedEntityIds: []
  }),

  getters: {
    activeScene: (state) => state.scenes.find(s => s._id === state.activeSceneId),
    
    getSceneById: (state) => (id) => state.scenes.find(s => s._id === id),
    
    sceneOptions: (state) => state.scenes.map(scene => ({
      label: scene.name,
      value: scene._id
    })),

    activeEntities: (state) => {
      const scene = state.scenes.find(s => s._id === state.activeSceneId);
      return scene ? scene.entities : [];
    },
    
    activeLayers: (state) => {
      const scene = state.scenes.find(s => s._id === state.activeSceneId);
      if (!scene) return [];
      
      const world = scene.layersWorld || [];
      const ui = scene.layersUI || [];
      
      const taggedWorld = world.map(l => ({ ...l, _section: 'world' }));
      const taggedUI = ui.map(l => ({ ...l, _section: 'ui' }));

      return [...taggedWorld, ...taggedUI];
    }
  },

  actions: {
    ...sceneActions,
    ...layerActions,
    ...entityActions,
    ...settingActions,
    ...animatorActions,

    initScenes(sceneList) {
      this.scenes = Array.isArray(sceneList) ? sceneList : [];
      if (this.scenes.length > 0 && !this.activeSceneId) {
        this.activeSceneId = this.scenes[0]._id;
      }
    },

    clearSelection() {
      this.selectedEntityIds = [];
    },

    setActiveScene(sceneId) {
      const scene = this.scenes.find(s => s._id === sceneId);
      if (scene) {
        this.activeSceneId = scene._id;
        this.selectedEntityIds = []; 
      }
    },

    patchComponent(entityId, componentName, updates) {
      const scene = this.activeScene;
      if (!scene) return;
      
      const entity = scene.entities.find(e => String(e._id) === String(entityId));
      if (entity?.components?.[componentName]) {
        Object.assign(entity.components[componentName], updates);
      }
    },

    syncComponentFromEngine(entityId, componentName, data) {
      const scene = this.activeScene;
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
    },

    syncTransformFromEngine(entityId, transformData) {
      const scene = this.activeScene;
      if (!scene) return;
      
      const entity = scene.entities.find(e => String(e._id) === String(entityId));
      if (!entity) return;

      if (entity.components?.Transform) {
        entity.components.Transform = {
          ...entity.components.Transform,
          ...transformData
        };
      } else if (entity.components?.UITransform) {
        entity.components.UITransform = {
          ...entity.components.UITransform,
          ...transformData 
        };
      }
    }
  }
});
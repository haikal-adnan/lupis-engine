import { defineStore } from 'pinia';
import { 
  useSceneActions, 
  useLayerActions, 
  useEntityActions, 
  useSettingActions, 
  useAnimatorActions 
} from '@scenes/scenes.js';

export const useSceneStore = defineStore('scene', {
  state: () => ({
    scenes: [],
    activeSceneId: null,
    selectedEntityIds: []
  }),

  getters: {
    activeScene: (state) => state.scenes.find(s => s.id === state.activeSceneId),
    
    getSceneById: (state) => (id) => state.scenes.find(s => s.id === id),
    
    sceneOptions: (state) => state.scenes.map(scene => ({
      label: scene.name,
      value: scene.id
    })),

    activeEntities: (state) => {
      const scene = state.scenes.find(s => s.id === state.activeSceneId);
      return scene ? scene.entities : [];
    },
    
    activeLayers: (state) => {
      const scene = state.scenes.find(s => s.id === state.activeSceneId);
      if (!scene) return [];
      
      const world = scene.layersWorld || [];
      const ui = scene.layersUI || [];
      
      const taggedWorld = world.map(l => ({ ...l, _section: 'world' }));
      const taggedUI = ui.map(l => ({ ...l, _section: 'ui' }));

      return [...taggedWorld, ...taggedUI];
    }
  },

  actions: {
    ...useSceneActions,
    ...useLayerActions,
    ...useEntityActions,
    ...useSettingActions,
    ...useAnimatorActions,

    initScenes(sceneList) {
      this.scenes = Array.isArray(sceneList) ? sceneList : [];
      if (this.scenes.length > 0 && !this.activeSceneId) {
        this.activeSceneId = this.scenes[0].id;
      }
    },

    createDefaultScene() {
      const defaultSceneId = 'scene_main_' + Date.now();
      const defaultScene = {
        id: defaultSceneId,
        name: 'Main Scene',
        entities: [],
        layersWorld: [
          { id: 'layer_world_default', name: 'Default', visible: true, locked: false }
        ],
        layersUI: [
          { id: 'layer_ui_default', name: 'UI Layer', visible: true, locked: false }
        ],
        settings: {
          backgroundColor: '#1a1a1a'
        }
      };

      this.scenes.push(defaultScene);
      this.activeSceneId = defaultSceneId;
      return defaultScene;
    },

    clearSelection() {
      this.selectedEntityIds = [];
    },

    setActiveScene(sceneId) {
      const scene = this.scenes.find(s => s.id === sceneId);
      if (scene) {
        this.activeSceneId = scene.id;
        this.selectedEntityIds = []; 
      }
    },

    patchComponent(entityId, componentName, updates) {
      const scene = this.activeScene;
      if (!scene) return;
      
      const entity = scene.entities.find(e => String(e.id) === String(entityId));
      if (entity?.components?.[componentName]) {
        Object.assign(entity.components[componentName], updates);
      }
    },

    syncComponentFromEngine(entityId, componentName, data) {
      const scene = this.activeScene;
      if (!scene) return;
      
      const entity = scene.entities.find(e => String(e.id) === String(entityId));
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
      
      const entity = scene.entities.find(e => String(e.id) === String(entityId));
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
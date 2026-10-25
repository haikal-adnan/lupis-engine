// Scene management, layers, entity hierarchies, components, and viewport selections.

import { defineStore } from 'pinia';
import { useProjectStore } from '@projects/projects.js';

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
      label: scene.scriptId,
      value: scene.id
    })),

    activeEntities: (state) => {
      const scene = state.scenes.find(s => s.id === state.activeSceneId);
      return scene ? scene.entities : [];
    },
    
    // Combines world and UI layers of the active scene into a single tagged list
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
    // Initializes scenes and activates initial scene from project settings
    initScenes(sceneList, initialSceneId = null) {
      this.scenes = Array.isArray(sceneList) ? sceneList : [];
      if (this.scenes.length > 0) {
        const projectStore = useProjectStore();
        let targetId = initialSceneId;
        if (!targetId && this.activeSceneId && this.scenes.some(s => s.id === this.activeSceneId)) {
          targetId = this.activeSceneId;
        }
        if (!targetId) {
          targetId = projectStore.project?.settings?.initialSceneId;
        }

        const targetScene = targetId ? this.scenes.find(s => s.id === targetId) : null;

        if (targetScene) {
          this.activeSceneId = targetScene.id;
        } else {
          this.activeSceneId = this.scenes[0].id;
        }
      } else {
        this.activeSceneId = null;
      }
      this.selectedEntityIds = [];
    },

    createDefaultScene() {
      const defaultSceneId = 'scene_main_' + Date.now();
      const defaultScene = {
        id: defaultSceneId,
        scriptId: 'Main_Scene',
        entities: [],
        layersWorld: [
          { id: 'layer_world_default', scriptId: 'World_Layer', visible: true, locked: false }
        ],
        layersUI: [
          { id: 'layer_ui_default', scriptId: 'UI_Layer', visible: true, locked: false }
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

    // Synchronizes component updates emitted by the runtime engine
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

    // Fast transform synchronization for gizmo drags and physics ticks
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

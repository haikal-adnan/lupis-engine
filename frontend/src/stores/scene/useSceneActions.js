import { useProjectStore } from '@/stores/useProjectStore';
import { createScene } from '@/services/schema/schema.js';

export const sceneActions = {
  addScene(sceneData = {}) {
    const projectStore = useProjectStore();

    const newScene = createScene({
      projectId: projectStore.project?._id,
      ...sceneData
    });

    this.scenes.push(newScene);
    this.activeSceneId = newScene._id;
    this.selectedEntityIds = [];

    projectStore.addSceneToProject(newScene._id);

    return newScene;
  },

  duplicateScene(sceneId) {
    const projectStore = useProjectStore();
    const originalScene = this.scenes.find(s => s._id === sceneId);

    if (!originalScene) return null;

    const newScene = JSON.parse(JSON.stringify(originalScene));

    newScene._id = `scene_${Date.now()}`;
    newScene.name = `${originalScene.name} (Copy)`;

    this.scenes.push(newScene);
    this.activeSceneId = newScene._id;
    this.selectedEntityIds = [];

    projectStore.addSceneToProject(newScene._id);

    return newScene;
  },

  removeScene(sceneId) {
    if (this.scenes.length <= 1) {
      throw new Error('MIN_SCENE_LIMIT');
    }

    const index = this.scenes.findIndex(s => s._id === sceneId);
    if (index !== -1) {
      this.scenes.splice(index, 1);
      if (this.activeSceneId === sceneId) {
        this.activeSceneId = this.scenes.length > 0 ? this.scenes[0]._id : null;
        this.selectedEntityIds = [];
      }
    }
  },

  updateSceneName(sceneId, newName) {
    const scene = this.scenes.find(s => s._id === sceneId);
    if (scene && newName && newName.trim() !== "") {
      scene.name = newName.trim();
    }
  }
};
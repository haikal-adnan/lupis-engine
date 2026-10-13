import { useProjectStore } from '@projects/projects.js'
import { sceneSchema } from '@scenes/scenes.js';

export const useSceneActions = {
  addScene(sceneData = {}) {
    const projectStore = useProjectStore();

    const safeSceneData = JSON.parse(JSON.stringify(sceneData));

    const newScene = sceneSchema({
      projectId: projectStore.project?.id,
      ...safeSceneData
    });

    this.scenes.push(newScene);
    this.activeSceneId = newScene.id;
    this.selectedEntityIds = [];

    projectStore.addSceneToProject(newScene.id);

    return newScene;
  },

  duplicateScene(sceneId) {
    const projectStore = useProjectStore();
    const originalScene = this.scenes.find(s => s.id === sceneId);

    if (!originalScene) return null;

    const newScene = JSON.parse(JSON.stringify(originalScene));

    newScene.id = `scene_${Date.now()}`;
    newScene.name = `${originalScene.name} (Copy)`;

    this.scenes.push(newScene);
    this.activeSceneId = newScene.id;
    this.selectedEntityIds = [];

    projectStore.addSceneToProject(newScene.id);

    return newScene;
  },

  removeScene(sceneId) {
    if (this.scenes.length <= 1) {
      throw new Error('MIN_SCENE_LIMIT');
    }

    const index = this.scenes.findIndex(s => s.id === sceneId);
    if (index !== -1) {
      this.scenes.splice(index, 1);
      
      if (this.activeSceneId === sceneId) {
        const fallbackScene = this.scenes[Math.max(0, index - 1)];
        this.activeSceneId = fallbackScene ? fallbackScene.id : null;
        this.selectedEntityIds = [];
      }

      // Validasi penyesuaian Initial Scene jika scene yang dihapus adalah initialScene
      const projectStore = useProjectStore();
      if (projectStore.project?.settings?.initialSceneId === sceneId) {
        projectStore.project.settings.initialSceneId = this.scenes[0].id;
        projectStore.markAsDirty();
      }
    }
  },

  updateSceneName(sceneId, newName) {
    const scene = this.scenes.find(s => s.id === sceneId);
    if (scene && newName && newName.trim() !== "") {
      scene.name = newName.trim();
    }
  }
};
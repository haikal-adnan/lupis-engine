import { useProjectStore } from '@projects/projects.js';
import { sceneSchema } from '@scenes/scenes.js';
import { sanitizeScriptId, getValidUniqueScriptId, isScriptIdDuplicate } from '@utils/utils.js';

export const useSceneActions = {
  addScene(sceneData = {}) {
    const projectStore = useProjectStore();

    const safeSceneData = JSON.parse(JSON.stringify(sceneData));
    const desiredScriptId = safeSceneData.scriptId || 'scene';
    delete safeSceneData.name;
    const uniqueScriptId = getValidUniqueScriptId(desiredScriptId, this.scenes, s => s.scriptId);

    const newScene = sceneSchema({
      projectId: projectStore.project?.id,
      ...safeSceneData,
      scriptId: uniqueScriptId
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
    const baseScriptId = originalScene.scriptId || 'scene';
    newScene.scriptId = getValidUniqueScriptId(`${baseScriptId}_copy`, this.scenes, s => s.scriptId, newScene.id);
    delete newScene.name;

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

      // Adjust Initial Scene if the deleted scene was the initialScene
      const projectStore = useProjectStore();
      if (projectStore.project?.settings?.initialSceneId === sceneId) {
        projectStore.project.settings.initialSceneId = this.scenes[0].id;
        projectStore.markAsDirty();
      }
    }
  },

  updateSceneScriptId(sceneId, newScriptId) {
    const scene = this.scenes.find(s => s.id === sceneId);
    if (!scene || !newScriptId || !newScriptId.trim()) return false;
    const sanitized = sanitizeScriptId(newScriptId);
    if (!sanitized) return false;

    if (isScriptIdDuplicate(sanitized, this.scenes, s => s.scriptId, sceneId)) {
      return false;
    }

    scene.scriptId = sanitized;
    delete scene.name;
    return true;
  }
};
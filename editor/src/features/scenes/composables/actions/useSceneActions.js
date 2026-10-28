// Scene creation, cloning, deletion, and identifier management.

import { useSceneStore } from '@scenes/useSceneStore.js';
import { useProjectStore } from '@projects/projects.js';
import { sceneSchema } from '@scenes/schemas/sceneSchema.js';
import { sanitizeScriptId, getValidUniqueScriptId, isScriptIdDuplicate } from '@utils/utils.js';

export function useSceneActions() {
  const store = useSceneStore();

  // Creates a new scene with unique scriptId and registers it in the project
  const addScene = (sceneData = {}) => {
    const projectStore = useProjectStore();

    const safeSceneData = JSON.parse(JSON.stringify(sceneData));
    const desiredScriptId = safeSceneData.scriptId || 'scene';
    delete safeSceneData.name;
    const uniqueScriptId = getValidUniqueScriptId(desiredScriptId, store.scenes, s => s.scriptId);

    const newScene = sceneSchema({
      projectId: projectStore.project?.id,
      ...safeSceneData,
      scriptId: uniqueScriptId
    });

    store.scenes.push(newScene);
    store.activeSceneId = newScene.id;
    store.selectedEntityIds = [];

    projectStore.addSceneToProject(newScene.id);

    return newScene;
  };

  // Clones a scene including its layers and entities
  const duplicateScene = (sceneId) => {
    const projectStore = useProjectStore();
    const originalScene = store.scenes.find(s => s.id === sceneId);

    if (!originalScene) return null;

    const newScene = JSON.parse(JSON.stringify(originalScene));

    newScene.id = `scene_${Date.now()}`;
    const baseScriptId = originalScene.scriptId || 'scene';
    newScene.scriptId = getValidUniqueScriptId(`${baseScriptId}_copy`, store.scenes, s => s.scriptId, newScene.id);
    delete newScene.name;

    store.scenes.push(newScene);
    store.activeSceneId = newScene.id;
    store.selectedEntityIds = [];

    projectStore.addSceneToProject(newScene.id);

    return newScene;
  };

  // Deletes a scene, enforcing minimum scene limits and falling back active scene
  const removeScene = (sceneId) => {
    if (store.scenes.length <= 1) {
      throw new Error('MIN_SCENE_LIMIT');
    }

    const index = store.scenes.findIndex(s => s.id === sceneId);
    if (index !== -1) {
      store.scenes.splice(index, 1);
      
      if (store.activeSceneId === sceneId) {
        const fallbackScene = store.scenes[Math.max(0, index - 1)];
        store.activeSceneId = fallbackScene ? fallbackScene.id : null;
        store.selectedEntityIds = [];
      }

      // Reassign initialScene if the deleted scene was the active entry point
      const projectStore = useProjectStore();
      if (projectStore.project?.settings?.initialSceneId === sceneId) {
        projectStore.project.settings.initialSceneId = store.scenes[0].id;
      }

      if (typeof projectStore.removeSceneFromProject === 'function') {
        projectStore.removeSceneFromProject(sceneId);
      } else {
        projectStore.markAsDirty();
      }
    }
  };

  const updateSceneScriptId = (sceneId, newScriptId) => {
    const scene = store.scenes.find(s => s.id === sceneId);
    if (!scene || !newScriptId || !newScriptId.trim()) return false;
    const sanitized = sanitizeScriptId(newScriptId);
    if (!sanitized) return false;

    if (isScriptIdDuplicate(sanitized, store.scenes, s => s.scriptId, sceneId)) {
      return false;
    }

    scene.scriptId = sanitized;
    delete scene.name;
    const projectStore = useProjectStore();
    projectStore.markAsDirty();
    return true;
  };

  return {
    addScene,
    duplicateScene,
    removeScene,
    updateSceneScriptId
  };
}

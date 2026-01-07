import { useProjectStore } from '@/stores/useProjectStore';
import { createScene } from '@/services/schema/schema.js';

export const useSceneActions = (scenes, activeSceneId, selectedEntityIds) => {
  
  const addScene = (sceneData = {}) => {
    const projectStore = useProjectStore();

    const newScene = createScene({
      projectId: projectStore.project?._id,
      ...sceneData
    });

    scenes.value.push(newScene);
    activeSceneId.value = newScene._id;
    selectedEntityIds.value = [];

    projectStore.addSceneToProject(newScene._id);

    return newScene;
  }

  const duplicateScene = (sceneId) => {
    const projectStore = useProjectStore();
    const originalScene = scenes.value.find(s => s._id === sceneId);

    if (!originalScene) return;

    const newScene = JSON.parse(JSON.stringify(originalScene));

    newScene._id = `scene_${Date.now()}`;
    newScene.name = `${originalScene.name} (Copy)`;

    scenes.value.push(newScene);
    activeSceneId.value = newScene._id;
    selectedEntityIds.value = [];

    projectStore.addSceneToProject(newScene._id);

    return newScene;
  }

  const removeScene = (sceneId) => {
    const index = scenes.value.findIndex(s => s._id === sceneId)
    if (index !== -1) {
      scenes.value.splice(index, 1)
      if (activeSceneId.value === sceneId) {
        activeSceneId.value = scenes.value.length > 0 ? scenes.value[0]._id : null
        selectedEntityIds.value = []
      }
    }
  }

  const updateSceneName = (sceneId, newName) => {
    const scene = scenes.value.find(s => s._id === sceneId)
    if (scene) {
      scene.name = newName
    }
  }

  return {
    addScene,
    duplicateScene,
    removeScene,
    updateSceneName
  }
}
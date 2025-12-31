import { ref, computed } from 'vue';

const DEFAULT_PROJECT_ID = "project_dungeon_demo_01";
const activeProjectId = ref(
  localStorage.getItem('active_project_id') || DEFAULT_PROJECT_ID
);

const currentScene = ref(null);
const activeEntityId = ref(null);

export function useEditorState() {
  function setProject(id) {
    activeProjectId.value = id;
    if (id) localStorage.setItem('active_project_id', id);
  }

  function setScene(sceneData) {
    currentScene.value = sceneData;
  }

  function selectEntity(id) {
    activeEntityId.value = id;
    console.log("Global Selection Updated:", id);
  }

  function getEntityById(id, entitiesList = null) {
    const list =
      entitiesList ||
      (currentScene.value ? currentScene.value.entities : []);
    if (!list) return null;

    for (const entity of list) {
      if (entity._id === id) return entity;
      if (entity.children && entity.children.length > 0) {
        const found = getEntityById(id, entity.children);
        if (found) return found;
      }
    }
    return null;
  }

  const activeEntity = computed(() => {
    return getEntityById(activeEntityId.value);
  });

  return {
    activeProjectId,
    setProject,
    currentScene,
    setScene,
    activeEntityId,
    activeEntity,
    selectEntity,
    getEntityById
  };
}

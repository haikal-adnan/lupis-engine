// composables/useEditorState.js

import { ref, watch } from 'vue';

const DEFAULT_PROJECT_ID = "project_dungeon_demo_01";

const activeProjectId = ref(localStorage.getItem('active_project_id') || DEFAULT_PROJECT_ID);

export function useEditorState() {
  
  watch(activeProjectId, (newId) => {
    if (newId) localStorage.setItem('active_project_id', newId);
  });

  function setProject(id) {
    activeProjectId.value = id;
  }

  return {
    activeProjectId,
    setProject
  };
}
// composables/useEditorState.js

import { ref, watch } from 'vue';

const DEFAULT_PROJECT_ID = "6946619548879c35d277311e";

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
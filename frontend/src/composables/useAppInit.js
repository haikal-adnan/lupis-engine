import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/stores/useProjectStore'
import { useProjectWatcher } from '@/composables/useProjectWatcher'
import { useEditorStore } from '@/stores/useEditorStore';

export function useAppInit() {
  const projectStore = useProjectStore()
  const editorStore = useEditorStore()
  const { initWatchers } = useProjectWatcher()
  const route = useRoute()

  const initApplication = async () => {
    if (route.name !== 'Editor') return;

    const projectId = route.params.idProject;

    if (projectId) {
      editorStore.setProjectId(projectId);

      if (!projectStore.project || projectStore.project._id !== projectId) {
        await projectStore.loadProject(projectId);
      }
      
      initWatchers();
    }
  };

  watch(
    () => route.params.idProject,
    (newId) => {
      if (newId && route.name === 'Editor') {
        initApplication();
      } else if (route.name !== 'Editor') {
        editorStore.setProjectId(null); 
      }
    }
  );

  return {
    isLoading: projectStore.isLoading,
    project: projectStore.project
  }
}
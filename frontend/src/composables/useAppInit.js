import { onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/useProjectStore'
import { useProjectWatcher } from '@/composables/useProjectWatcher'

export function useAppInit() {
  const projectStore = useProjectStore()
  
  // Panggil composable watcher
  const { initWatchers } = useProjectWatcher()

  const handleKeydown = async (event) => {
    if (event.ctrlKey || event.metaKey) {
      
      if (event.key === 's' && !event.shiftKey) {
        event.preventDefault();
        console.log('Shortcut: Save Local (IDB)');
        await projectStore.saveProject();
      }
      
      if (event.key === 's' && event.shiftKey) {
        event.preventDefault();
        console.log('Shortcut: Save Server (API)');
        await projectStore.saveProjectToServer();
      }
    }
  };

  const initApplication = async () => {
    const isDev = import.meta.env.DEV
    const shouldAutoLoad = import.meta.env.VITE_DEV_AUTO_LOAD === 'true'

    if (isDev && shouldAutoLoad) {
      const projectId = import.meta.env.VITE_DEV_PROJECT_ID
      if (projectId) {
        await projectStore.loadProject(projectId)
      }
    }

    initWatchers();
  }

  onMounted(() => {
    initApplication()
    
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    isLoading: projectStore.isLoading,
    project: projectStore.project
  }
}
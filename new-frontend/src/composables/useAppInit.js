import { onMounted } from 'vue'
import { useProjectStore } from '@/stores/useProjectStore'

export function useAppInit() {
  const projectStore = useProjectStore()

  const initApplication = async () => {
    const isDev = import.meta.env.DEV
    const shouldAutoLoad = import.meta.env.VITE_DEV_AUTO_LOAD === 'true'

    if (isDev && shouldAutoLoad) {
      const projectId = import.meta.env.VITE_DEV_PROJECT_ID

      if (projectId) {
        await projectStore.loadProject(projectId)
      }
    }
  }

  onMounted(() => {
    initApplication()
  })

  return {
    isLoading: projectStore.isLoading,
    project: projectStore.project
  }
}
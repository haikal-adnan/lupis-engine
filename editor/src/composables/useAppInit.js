import { onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore, useProjectWatcher } from '@projects/projects.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { usePopAlert } from '@composables/composables.js'

export function useAppInit() {
  const projectStore = useProjectStore()
  const workspaceStore = useWorkspaceStore()
  const { initWatchers, destroyWatchers } = useProjectWatcher()
  const route = useRoute()
  const router = useRouter()
  const { showPop } = usePopAlert()

  const cleanupApplication = () => {
    if (typeof destroyWatchers === 'function') {
      destroyWatchers()
    }
    workspaceStore.setProjectId(null)
    projectStore.clearProjectData()
  }

  const initApplication = async (projectId) => {
    if (typeof destroyWatchers === 'function') {
      destroyWatchers()
    }

    workspaceStore.setProjectId(projectId)

    try {
      if (projectStore.project?.id !== projectId) {
        projectStore.clearProjectData()
        await projectStore.loadProject(projectId)
      } else {
        workspaceStore.isLoading = false
      }

      if (!projectStore.project) {
        throw new Error('Failed to load project data from OPFS.')
      }

      initWatchers()
    } catch (error) {
      console.error('Failed loaded project:', error)
      showPop({
        title: 'Error',
        message: error.message || 'Project not found.',
        type: 'error'
      })

      cleanupApplication()
      router.push('/dashboard')
    }
  }

  watch(
    () => ({ name: route.name, id: route.params.idProject }),
    (newRoute, oldRoute) => {
      const isEditor = newRoute.name === 'Editor'
      const wasEditor = oldRoute?.name === 'Editor'

      if (isEditor && newRoute.id) {
        if (newRoute.id !== oldRoute?.id || !wasEditor) {
          initApplication(newRoute.id)
        }
      } else if (!isEditor && wasEditor) {
        cleanupApplication()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    cleanupApplication()
  })

  return {
    isLoading: computed(() => workspaceStore.isLoading),
    project: computed(() => projectStore.project)
  }
}
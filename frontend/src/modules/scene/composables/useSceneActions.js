import { computed } from 'vue'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useConfirm } from '@/composables/useConfirm.js'
import { usePrompt } from '@/composables/usePrompt'
import { useAlert } from '@/composables/useAlert'

export function useSceneActions() {
  const sceneStore = useSceneStore()
  const { confirm } = useConfirm()
  const { prompt } = usePrompt()
  const { alert } = useAlert()

  const sceneOptions = computed(() => {
    return sceneStore.scenes.map(scene => ({
      label: scene.name,
      value: scene._id
    }))
  })

  const activeSceneId = computed({
    get: () => sceneStore.activeSceneId,
    set: (val) => {
      if (sceneStore.activeSceneId !== val) {
        sceneStore.setActiveScene(val) 
      }
    }
  })

  const handleCreate = async (callback) => {
    if (callback) callback()
    
    const name = await prompt({
      title: 'Create New Scene',
      message: 'Enter a name for the new scene:',
      defaultValue: 'New Scene',
      placeholder: 'Scene Name...',
      confirmText: 'Create'
    })

    if (name) {
      sceneStore.addScene({ name }) 
    }
  }

  const handleRename = async (callback) => {
    if (callback) callback()
    const currentName = sceneStore.activeScene?.name
    
    const newName = await prompt({
      title: 'Rename Scene',
      defaultValue: currentName,
      placeholder: 'Scene Name...',
      confirmText: 'Rename'
    })
    
    if (newName && newName.trim() !== "" && newName !== currentName) {
      sceneStore.updateSceneName(sceneStore.activeSceneId, newName)
    }
  }

  const handleDuplicate = (callback) => {
    if (callback) callback()
    sceneStore.duplicateScene(sceneStore.activeSceneId)
  }

  const handleDelete = async (callback) => {
    if (callback) callback()

    if (sceneStore.scenes.length <= 1) {
      await alert({
        title: 'Cannot Delete Scene',
        message: 'You must have at least one scene in your project.',
        type: 'warning', 
        buttonText: 'Understood'
      })
      return
    }

    const sceneName = sceneStore.activeScene?.name
    
    const isConfirmed = await confirm({
      title: 'Delete Scene?',
      message: `Are you sure you want to delete "${sceneName}"?`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    })

    if (isConfirmed) {
      sceneStore.removeScene(sceneStore.activeSceneId)
    }
  }

  return {
    sceneOptions,
    activeSceneId,
    handleCreate,
    handleRename,
    handleDuplicate,
    handleDelete
  }
}
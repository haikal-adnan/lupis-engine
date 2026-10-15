import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'
import { useScriptActions, useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useFolderStore } from '@folders/folders.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'

// Mock dialog & visual alert composables
const mockPrompt = vi.fn()
const mockConfirm = vi.fn()
const mockShowPop = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm }),
  usePopAlert: () => ({ showPop: mockShowPop })
}))

describe('Script Actions Integration Test', () => {
  beforeEach(async () => {
    // 1. Re-initialize Pinia State
    setActivePinia(createPinia())

    // 2. Initialize Mock OPFS Environment
    setupMockOPFS()

    // 3. Create Empty Project and Load Initial State
    const createdProject = await createMockEmptyProject({
      projectName: 'Script Actions Test Project'
    })
    
    const workspaceStore = useWorkspaceStore()
    workspaceStore.setProjectId(createdProject.id)

    const projectStore = useProjectStore()
    await projectStore.loadProject(createdProject.id)

    // Reset Mock Functions
    mockPrompt.mockReset()
    mockConfirm.mockReset()
    mockShowPop.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Script Creation and Name Validation Integration (createScript & getValidUniqueName)', () => {
    it('creates a new script with sanitized name and automatically handles duplicate names', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      // Create initial script named "Player_Controller"
      scriptStore.initScripts([
        { id: 'sc-1', name: 'Player_Controller', type: 'component' }
      ])

      // User enters identical name with illegal chars/whitespace: "Player Controller! "
      mockPrompt.mockResolvedValue('Player Controller! ')

      // Act
      const createdScript = await scriptActions.createScript('component', null)

      // Assert
      expect(mockPrompt).toHaveBeenCalledWith(expect.objectContaining({
        defaultValue: 'NewComponent'
      }))
      
      // Sanitize -> "Player_Controller", Duplicate -> "Player_Controller_1"
      expect(createdScript).not.toBeNull()
      expect(createdScript.name).toBe('Player_Controller_1')
      expect(scriptStore.scripts).toHaveLength(2)
      expect(projectStore.syncStatus).toBe('dirty')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })

    it('cancels script creation if user clicks cancel on prompt', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()

      mockPrompt.mockResolvedValue(null) // User cancel

      // Act
      const result = await scriptActions.createScript('component')

      // Assert
      expect(result).toBeNull()
      expect(scriptStore.scripts).toHaveLength(0)
      expect(mockShowPop).not.toHaveBeenCalled()
    })
  })

  describe('Script Deletion and Renaming Integration (deleteScript & renameScript)', () => {
    it('deletes script from store and OPFS after user confirms confirmation dialog', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      scriptStore.initScripts([
        { id: 'sc-del-1', name: 'UnusedScript' }
      ])
      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])
      projectStore.syncStatus = 'synced'

      mockConfirm.mockResolvedValue(true) // User agrees to delete

      // Act
      const isDeleted = await scriptActions.deleteScript('sc-del-1')

      // Assert
      expect(isDeleted).toBe(true)
      expect(scriptStore.scripts).toHaveLength(0)
      expect(projectStore.syncStatus).toBe('dirty')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'info'
      }))
    })

    it('renames script and aligns state when new name input is valid', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      scriptStore.initScripts([
        { id: 'sc-ren-1', name: 'OldName' }
      ])
      mockPrompt.mockResolvedValue('New Awesome Name')

      // Act
      await scriptActions.renameScript('sc-ren-1')

      // Assert
      const updatedScript = scriptStore.getScriptById('sc-ren-1')
      expect(updatedScript.name).toBe('New_Awesome_Name')
      expect(projectStore.syncStatus).toBe('dirty')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })
  })

  describe('Script Duplication Integration (duplicateScript)', () => {
    it('duplicates existing script along with all node/variable contents with copy suffix', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const folderStore = useFolderStore()

      folderStore.activeFolderId = 'folder-101'

      scriptStore.initScripts([
        {
          id: 'sc-orig',
          name: 'EnemyAI',
          localVariables: [{ id: 'v1', name: 'hp', defaultValue: 100 }],
          nodes: [{ id: 'n1', type: 'start' }]
        }
      ])

      // Act
      const clonedScript = await scriptActions.duplicateScript('sc-orig')

      // Assert
      expect(clonedScript).not.toBeNull()
      expect(clonedScript.id).not.toBe('sc-orig')
      expect(clonedScript.name).toBe('EnemyAI_Copy')
      expect(clonedScript.folderId).toBe('folder-101')
      expect(clonedScript.nodes).toHaveLength(1)
      expect(scriptStore.scripts).toHaveLength(2)
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })
  })

  describe('Script Application to Scene Entity Integration (applyToEntity)', () => {
    it('attaches script to entity ScriptController and initializes initial variable values', () => {
      // Arrange
      const scriptActions = useScriptActions()
      const sceneStore = useSceneStore()

      const mockScript = {
        id: 'sc-attach-1',
        name: 'RotatorScript',
        localVariables: [
          { name: 'speed', defaultValue: 5 },
          { name: 'loop', defaultValue: true }
        ]
      }

      const mockEntity = {
        id: 'ent-1',
        name: 'CubeObject',
        components: {
          ScriptController: { data: [] }
        }
      }

      vi.spyOn(sceneStore, 'patchComponent')

      // Act
      scriptActions.applyToEntity(mockScript, mockEntity)

      // Assert
      expect(sceneStore.patchComponent).toHaveBeenCalledWith(
        'ent-1',
        'ScriptController',
        {
          data: [
            expect.objectContaining({
              assetId: 'sc-attach-1',
              active: true,
              variables: { speed: 5, loop: true }
            })
          ]
        }
      )
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })

    it('[Bad Path] rejects script attachment if script is already active on the same entity', () => {
      // Arrange
      const scriptActions = useScriptActions()
      const sceneStore = useSceneStore()

      const mockScript = { id: 'sc-attached', name: 'RotatorScript' }
      const mockEntity = {
        id: 'ent-1',
        name: 'CubeObject',
        components: {
          ScriptController: {
            data: [{ id: 'inst_123', assetId: 'sc-attached' }]
          }
        }
      }

      vi.spyOn(sceneStore, 'patchComponent')

      // Act
      scriptActions.applyToEntity(mockScript, mockEntity)

      // Assert
      expect(sceneStore.patchComponent).not.toHaveBeenCalled()
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'warning',
        title: 'Script Exists'
      }))
    })
  })

  describe('[Bad Path] Invalid Resource Access Handling', () => {
    it('[Bad Path] returns false/null safely when scriptId is not found in store', async () => {
      // Arrange
      const scriptActions = useScriptActions()

      // Act
      const deleteResult = await scriptActions.deleteScript('non-existent-id')
      const duplicateResult = await scriptActions.duplicateScript('non-existent-id')

      // Assert
      expect(deleteResult).toBe(false)
      expect(duplicateResult).toBeNull()
      expect(mockConfirm).not.toHaveBeenCalled()
      expect(mockShowPop).not.toHaveBeenCalled()
    })
  })
})
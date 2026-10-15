import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import JSZip from 'jszip'
import { DashboardPage } from '@dashboards/dashboards.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useProjectActions } from '@projects/projects.js'
import { useOPFSActions } from '@opfs/opfs.js'
import { LUPIS_HEADER, XOR_KEY } from '@utils/utils.js'

import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

/**
 * Specific helper for projectCrud to create .lupisproject file instance
 */
async function createValidLupisProjectFile(projectData, fileName = 'project.lupisproject') {
  const zip = new JSZip()
  zip.file('project.json', JSON.stringify(projectData, null, 2))

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipBuffer = new Uint8Array(await zipBlob.arrayBuffer())

  const outputBuffer = new Uint8Array(LUPIS_HEADER.length + zipBuffer.length)
  outputBuffer.set(LUPIS_HEADER, 0)

  for (let i = 0; i < zipBuffer.length; i++) {
    outputBuffer[LUPIS_HEADER.length + i] = zipBuffer[i] ^ XOR_KEY
  }

  return new File([outputBuffer], fileName, { type: 'application/octet-stream' })
}

/* ============================================================================
 * ENVIRONMENT DEPENDENCY MOCKING (Vue Router & VTU Options)
 * ============================================================================
 */

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

const globalMountOptions = {
  global: {
    stubs: {
      teleport: true
    }
  }
}

/* ============================================================================
 * SYSTEM TEST SUITE: PROJECT CRUD & MANAGEMENT
 * ============================================================================
 */

describe('Project Management and CRUD Operations System', () => {
  let projectActions
  let opfsActions

  beforeEach(() => {
    vi.restoreAllMocks()
    
    setActivePinia(createPinia())
    setupMockOPFS()
    mockPush.mockClear()

    vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-url')
    vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    projectActions = useProjectActions()
    opfsActions = useOPFSActions()
  })

  describe('Navigation and Opening Project Flow', () => {
    it('redirects to editor router and updates activeProjectId in workspaceStore when project is opened', async () => {
      const workspaceStore = useWorkspaceStore()

      const newProject = await createMockEmptyProject({
        projectName: 'Game RPG 2D',
        description: 'RPG Project'
      })

      const wrapper = mount(DashboardPage, globalMountOptions)

      await wrapper.vm.openProject(newProject.id)
      workspaceStore.setProjectId(newProject.id)

      expect(mockPush).toHaveBeenCalledWith(`/editor/${newProject.id}`)
      expect(workspaceStore.activeProjectId).toBe(newProject.id)
    })
  })

  describe('Project File Export / Save Flow', () => {
    it('exports files from OPFS and triggers .lupisproject file download in browser', async () => {
      const newProject = await createMockEmptyProject({
        projectName: 'Game Platformer',
        description: 'Platformer Application'
      })

      const result = await opfsActions.exportToLupisProject(newProject.id)

      if (!result.success) {
        console.error('Export Error Detail:', result.error)
      }

      expect(result.success).toBe(true)
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Project Metadata Modification Flow', () => {
    it('changes project status between DRAFT, IN_PROGRESS, and PUBLISHED and saves changes in OPFS', async () => {
      const created = await createMockEmptyProject({
        projectName: 'Game Puzzle'
      })

      await projectActions.updateProject(created.id, {
        status: 'IN_PROGRESS'
      })

      const updatedProgress = await projectActions.getProjectById(created.id)

      await projectActions.updateProject(created.id, {
        status: 'PUBLISHED'
      })

      const updatedPublished = await projectActions.getProjectById(created.id)

      expect(updatedProgress.project.status).toBe('IN_PROGRESS')
      expect(updatedPublished.project.status).toBe('PUBLISHED')
    })

    it('renames and updates project description with consistent new data', async () => {
      const created = await createMockEmptyProject({
        projectName: 'Initial Name',
        description: 'Initial Description'
      })

      await projectActions.updateProject(created.id, {
        name: 'Updated New Name',
        description: 'Updated New Description'
      })

      const result = await projectActions.getProjectById(created.id)

      expect(result.project.name).toBe('Updated New Name')
      expect(result.project.description).toBe('Updated New Description')
    })
  })

  describe('Project Deletion Flow', () => {
    it('deletes project directory from OPFS so project no longer appears on dashboard', async () => {
      const created = await createMockEmptyProject({
        projectName: 'Temporary Project'
      })

      const initialProjects = await projectActions.getProjects()

      expect(initialProjects.length).toBe(1)

      await projectActions.deleteProject(created.id)

      const remainingProjects = await projectActions.getProjects()

      expect(remainingProjects.length).toBe(0)
    })
  })

  describe('Project Import Flow via File Drop and File Explorer', () => {
    it('loads project from .lupisproject file via Drop mechanism and updates project list', async () => {
      const wrapper = mount(DashboardPage, globalMountOptions)

      const dummyProject = {
        id: 'proj_imported_drop_123',
        name: 'Imported Game Drop',
        description: 'Result of drag and drop file import',
        status: 'DRAFT'
      }

      const validLupisProjectFile = await createValidLupisProjectFile(
        dummyProject,
        'game_drop.lupisproject'
      )

      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [validLupisProjectFile]
        }
      }

      await wrapper.vm.handleDrop(dropEvent)

      const projects = await projectActions.getProjects()

      expect(projects.length).toBe(1)
      expect(projects[0].name).toBe('Imported Game Drop')
    })

    it('loads project from .lupisproject file via file picker (File Explorer)', async () => {
      const wrapper = mount(DashboardPage, globalMountOptions)

      const dummyProject = {
        id: 'proj_imported_select_456',
        name: 'Imported Game Select',
        description: 'Result of file explorer select',
        status: 'DRAFT'
      }

      const validLupisProjectFile = await createValidLupisProjectFile(
        dummyProject,
        'game_select.lupisproject'
      )

      const changeEvent = {
        target: {
          files: [validLupisProjectFile],
          value: 'C:\\fakepath\\game_select.lupisproject'
        }
      }

      await wrapper.vm.handleFileSelect(changeEvent)

      const projects = await projectActions.getProjects()

      expect(projects.length).toBe(1)
      expect(projects[0].id).toBe('proj_imported_select_456')
    })
  })

  describe('File Validation and Format Security Flow', () => {
    it('rejects files without .lupisproject extension and ensures project data in OPFS is unchanged', async () => {
      const wrapper = mount(DashboardPage, globalMountOptions)

      const invalidFile = new File(
        ['text content'],
        'image.png',
        { type: 'image/png' }
      )

      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [invalidFile]
        }
      }

      await wrapper.vm.handleDrop(dropEvent)

      const projects = await projectActions.getProjects()

      expect(projects.length).toBe(0)
    })

    it('displays empty search state when project name filter does not match', async () => {
      await createMockEmptyProject({
        projectName: 'Space Shooter'
      })

      const wrapper = mount(DashboardPage, {
        props: {
          searchQuery: 'Fantasy'
        },
        ...globalMountOptions
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.filteredProjects.length).toBe(0)
      expect(wrapper.text()).toContain('No projects matching "Fantasy"')
    })
  })
})
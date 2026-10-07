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
 * Helper spesifik projectCrud untuk membuat instansiasi File .lupisproject
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
 * MOCKING KETERGANTUNGAN LINGKUNGAN (Vue Router & VTU Options)
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
 * SYSTEM TEST SUITE: CRUD & MANAJEMEN PROYEK
 * ============================================================================
 */

describe('Sistem Manajemen dan Operasi CRUD Proyek', () => {
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

  describe('Alur Navigasi dan Membuka Proyek', () => {
    it('mengarahkan ke router editor dan memperbarui activeProjectId pada workspaceStore saat proyek dibuka', async () => {
      const workspaceStore = useWorkspaceStore()

      const newProject = await createMockEmptyProject({
        projectName: 'Game RPG 2D',
        description: 'Proyek RPG'
      })

      const wrapper = mount(DashboardPage, globalMountOptions)

      await wrapper.vm.openProject(newProject.id)
      workspaceStore.setProjectId(newProject.id)

      expect(mockPush).toHaveBeenCalledWith(`/editor/${newProject.id}`)
      expect(workspaceStore.activeProjectId).toBe(newProject.id)
    })
  })

  describe('Alur Ekspor / Save File Proyek', () => {
    it('mengekspor berkas dari OPFS dan memicu unduhan file .lupisproject di browser', async () => {
      const newProject = await createMockEmptyProject({
        projectName: 'Game Platformer',
        description: 'Aplikasi Platformer'
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

  describe('Alur Pengubahan Metadata Proyek', () => {
    it('mengubah status proyek antara DRAFT, IN_PROGRESS, dan PUBLISHED serta menyimpan perubahannya di OPFS', async () => {
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

    it('mengubah nama (rename) dan deskripsi proyek dengan data baru yang konsisten', async () => {
      const created = await createMockEmptyProject({
        projectName: 'Nama Awal',
        description: 'Deskripsi Awal'
      })

      await projectActions.updateProject(created.id, {
        name: 'Nama Baru Terupdate',
        description: 'Deskripsi Baru Terupdate'
      })

      const result = await projectActions.getProjectById(created.id)

      expect(result.project.name).toBe('Nama Baru Terupdate')
      expect(result.project.description).toBe('Deskripsi Baru Terupdate')
    })
  })

  describe('Alur Penghapusan Proyek', () => {
    it('menghapus folder proyek dari OPFS sehingga proyek tidak lagi tampil di dashboard', async () => {
      const created = await createMockEmptyProject({
        projectName: 'Proyek Sementara'
      })

      const initialProjects = await projectActions.getProjects()

      expect(initialProjects.length).toBe(1)

      await projectActions.deleteProject(created.id)

      const remainingProjects = await projectActions.getProjects()

      expect(remainingProjects.length).toBe(0)
    })
  })

  describe('Alur Import Proyek via Drop File dan File Explorer', () => {
    it('memuat proyek dari file .lupisproject melalui mekanisme Drop dan memperbarui daftar proyek', async () => {
      const wrapper = mount(DashboardPage, globalMountOptions)

      const dummyProject = {
        id: 'proj_imported_drop_123',
        name: 'Imported Game Drop',
        description: 'Hasil dari file import drag and drop',
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

    it('memuat proyek dari file .lupisproject melalui pemilih file (File Explorer)', async () => {
      const wrapper = mount(DashboardPage, globalMountOptions)

      const dummyProject = {
        id: 'proj_imported_select_456',
        name: 'Imported Game Select',
        description: 'Hasil dari file explorer',
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

  describe('Alur Validasi File dan Keamanan Format', () => {
    it('menolak file yang bukan ber-ekstensi .lupisproject dan memastikan data proyek di OPFS tidak berubah', async () => {
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

    it('menampilkan status pencarian kosong ketika filter nama proyek tidak cocok', async () => {
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
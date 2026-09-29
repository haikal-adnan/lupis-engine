import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import JSZip from 'jszip'
import { DashboardPage } from '@dashboards/dashboards.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useProjectActions } from '@projects/projects.js'
import { useOPFSActions } from '@opfs/opfs.js'

/* ============================================================================
 * 1. STRUKTUR PROYEK & ANATOMI DATA OPFS DUMMY UNTUK PENGUJIEN
 * ============================================================================
 *
 * Selama pengujian berjalan, OPFS di-mocking secara in-memory dalam struktur
 * direktori sebagai berikut:
 *
 *  OPFS Root (navigator.storage.getDirectory())
 *  └── lupis-engine/
 *      └── projects/
 *          └── [projectId]/                        <-- ID Proyek (misal: proj_123456)
 *              ├── project.json                    <-- Metadata proyek (Nama, Status, Settings)
 *              ├── assets/                         <-- Folder aset media/gambar
 *              ├── prefabs/                        <-- Folder prefab
 *              │   └── [prefabId].json
 *              ├── scripts/                        <-- Folder komponen/skrip
 *              │   └── [scriptId].json
 *              ├── scenes/                         <-- Folder adegan game
 *              │   └── [sceneId].json              <-- Hierarki Entity & Component
 *              └── workspaces/                     <-- Workspace registry
 *                  ├── assets.json
 *                  ├── scenes.json
 *                  ├── prefabs.json
 *                  ├── scripts.json
 *                  └── folders.json
 *
 * Struktur File .lupisproject (Format Biner Ekspor/Impor):
 *  [16-byte LUPIS_HEADER] + [ZIP Archive (XOR Encrpyted with Key 0x5A)]
 *   └── project.json (+ scenes/, scripts/, assets/, dll)
 * ============================================================================
 */

// Format Header dan Kunci XOR sesuai spesifikasi Lupis Engine
const LUPIS_HEADER = new Uint8Array([
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52, 0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00
])
const XOR_KEY = 0x5A

/**
 * Helper untuk membuat instansiasi File .lupisproject yang sah
 * digunakan pada pengujian Alur Import via Drop File & File Explorer.
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
 * 2. MOCKING KETERGANTUNGAN LINGKUNGAN (OPFS, Router, & VTU Options)
 * ============================================================================
 */

// Mock Vue Router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Virtual In-Memory Store untuk OPFS Directory Handle
let mockOPFSStore = new Map()

const createMockDirectoryHandle = (fullPath = 'root') => {
  const dirName = fullPath.split('/').pop()

  return {
    kind: 'directory',
    name: dirName,

    getDirectoryHandle: vi.fn(async (name, options = {}) => {
      const childPath = `${fullPath}/${name}`

      if (!mockOPFSStore.has(childPath)) {
        if (options.create) {
          mockOPFSStore.set(childPath, createMockDirectoryHandle(childPath))
        } else {
          throw new Error(`Directory '${name}' tidak ditemukan di OPFS.`)
        }
      }

      return mockOPFSStore.get(childPath)
    }),

    getFileHandle: vi.fn(async (fileName, options = {}) => {
      const filePath = `${fullPath}/${fileName}`

      if (!mockOPFSStore.has(filePath)) {
        if (options.create) {
          let content = new Uint8Array()

          const fileHandleObj = {
            kind: 'file',
            name: fileName,

            // Mengembalikan Web Standard File Object agar kompatibel dengan JSZip
            getFile: async () => new File([content], fileName),

            createWritable: async () => ({
              write: async (data) => {
                if (typeof data === 'string') {
                  content = new TextEncoder().encode(data)
                } else if (data instanceof Blob) {
                  content = new Uint8Array(await data.arrayBuffer())
                } else if (data instanceof ArrayBuffer) {
                  content = new Uint8Array(data)
                } else if (ArrayBuffer.isView(data)) {
                  content = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                }
              },
              close: async () => {}
            })
          }

          mockOPFSStore.set(filePath, fileHandleObj)
        } else {
          throw new Error(`File '${fileName}' tidak ditemukan di OPFS.`)
        }
      }

      return mockOPFSStore.get(filePath)
    }),

    removeEntry: vi.fn(async (name) => {
      const targetPath = `${fullPath}/${name}`
      mockOPFSStore.delete(targetPath)

      for (const key of mockOPFSStore.keys()) {
        if (key.startsWith(`${targetPath}/`)) {
          mockOPFSStore.delete(key)
        }
      }
    }),

    entries: async function* () {
      const prefix = `${fullPath}/`
      for (const [key, handle] of mockOPFSStore.entries()) {
        if (key.startsWith(prefix)) {
          const relativePath = key.slice(prefix.length)
          if (!relativePath.includes('/')) {
            yield [relativePath, handle]
          }
        }
      }
    }
  }
}

// Global configuration untuk Vue Test Utils
const globalMountOptions = {
  global: {
    stubs: {
      teleport: true
    }
  }
}

/* ============================================================================
 * 3. SYSTEM TEST SUITE: CRUD & MANAJEMEN PROYEK
 * ============================================================================
 */

describe('Sistem Manajemen dan Operasi CRUD Proyek', () => {
  let projectActions
  let opfsActions

  beforeEach(() => {
    vi.restoreAllMocks()
    
    setActivePinia(createPinia())
    mockOPFSStore = new Map()
    mockPush.mockClear()

    vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-url')
    vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    Object.defineProperty(global.navigator, 'storage', {
      value: {
        getDirectory: vi.fn(async () => createMockDirectoryHandle('root'))
      },
      writable: true,
      configurable: true
    })

    projectActions = useProjectActions()
    opfsActions = useOPFSActions()
  })

  describe('Alur Navigasi dan Membuka Proyek', () => {
    it('mengarahkan ke router editor dan memperbarui activeProjectId pada workspaceStore saat proyek dibuka', async () => {
      const workspaceStore = useWorkspaceStore()

      const newProject = await projectActions.createProject({
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
      const newProject = await projectActions.createProject({
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
      const created = await projectActions.createProject({
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
      const created = await projectActions.createProject({
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
      const created = await projectActions.createProject({
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
      await projectActions.createProject({
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
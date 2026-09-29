import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectActions } from '@projects/projects.js' // Sesuaikan path berkas useProjectActions Anda

/**
 * In-Memory OPFS Storage Simulator
 * Mensimulasikan struktur FileSystemDirectoryHandle & FileSystemFileHandle bawaan browser.
 */
class MockDirectoryHandle {
  constructor(name = '') {
    this.name = name
    this.kind = 'directory'
    this._entries = new Map()
  }

  async getDirectoryHandle(name, options = {}) {
    if (!this._entries.has(name)) {
      if (options.create) {
        this._entries.set(name, new MockDirectoryHandle(name))
      } else {
        const err = new Error(`Directory '${name}' not found.`)
        err.name = 'NotFoundError'
        throw err
      }
    }
    const entry = this._entries.get(name)
    if (entry.kind !== 'directory') {
      throw new Error(`Entry '${name}' is not a directory.`)
    }
    return entry
  }

  async getFileHandle(name, options = {}) {
    if (!this._entries.has(name)) {
      if (options.create) {
        this._entries.set(name, new MockFileHandle(name))
      } else {
        const err = new Error(`File '${name}' not found.`)
        err.name = 'NotFoundError'
        throw err
      }
    }
    const entry = this._entries.get(name)
    if (entry.kind !== 'file') {
      throw new Error(`Entry '${name}' is not a file.`)
    }
    return entry
  }

  async removeEntry(name, options = {}) {
    if (!this._entries.has(name)) {
      const err = new Error(`Entry '${name}' not found.`)
      err.name = 'NotFoundError'
      throw err
    }
    this._entries.delete(name)
  }

  async *entries() {
    for (const entry of this._entries.entries()) {
      yield entry
    }
  }
}

class MockFileHandle {
  constructor(name = '') {
    this.name = name
    this.kind = 'file'
    this.content = ''
  }

  async getFile() {
    return {
      text: async () => this.content
    }
  }

  async createWritable() {
    return {
      write: async (data) => {
        this.content = String(data)
      },
      close: async () => {}
    }
  }
}

describe('Integrasi useProjectActions dengan OPFS Storage', () => {
  let actions
  let rootDirectoryHandle

  beforeEach(() => {
    vi.clearAllMocks()
    rootDirectoryHandle = new MockDirectoryHandle('root')

    // Stub navigator.storage agar menggunakan in-memory storage simulator
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          getDirectory: vi.fn().mockResolvedValue(rootDirectoryHandle)
        }
      },
      writable: true,
      configurable: true
    })

    actions = useProjectActions()
  })

  describe('Pemeriksaan Dukungan OPFS (_ensureOPFSSupport)', () => {
    it('melempar error ketika navigator.storage tidak tersedia di environment browser', async () => {
      // Arrange
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true
      })

      // Act & Assert
      await expect(actions.getUserProjectsDir()).rejects.toThrow(
        'Browser Anda tidak mendukung OPFS.'
      )
    })
  })

  describe('Pembuatan Proyek Baru (createProject)', () => {
    it('membuat struktur folder proyek lengkap beserta file json default di OPFS', async () => {
      // Arrange
      const projectInput = {
        projectName: 'Game RPG Baru',
        description: 'Petualangan 2D Top-Down'
      }

      // Act
      const createdProject = await actions.createProject(projectInput)

      // Assert
      expect(createdProject.id).toBeDefined()
      expect(createdProject.name).toBe('Game RPG Baru')
      expect(createdProject.status).toBe('DRAFT')

      // Verifikasi struktur berkas di OPFS
      const appDir = await rootDirectoryHandle.getDirectoryHandle('lupis-engine')
      const projectsDir = await appDir.getDirectoryHandle('projects')
      const projectDir = await projectsDir.getDirectoryHandle(createdProject.id)

      // Verifikasi file project.json
      const projectFile = await projectDir.getFileHandle('project.json')
      const projectFileObj = await projectFile.getFile()
      const savedProjectData = JSON.parse(await projectFileObj.text())

      expect(savedProjectData.name).toBe('Game RPG Baru')

      // Verifikasi subfolder scenes & workspaces
      const scenesDir = await projectDir.getDirectoryHandle('scenes')
      const workspacesDir = await projectDir.getDirectoryHandle('workspaces')

      const scenesMetaFile = await workspacesDir.getFileHandle('scenes.json')
      const scenesMetaObj = await scenesMetaFile.getFile()
      const scenesMeta = JSON.parse(await scenesMetaObj.text())

      expect(scenesMeta).toHaveLength(1)
      expect(scenesMeta[0].name).toBe('Main Scene')

      // Verifikasi file detail scene utama
      const defaultSceneId = scenesMeta[0].id
      const sceneDetailFile = await scenesDir.getFileHandle(`${defaultSceneId}.json`)
      const sceneDetailObj = await sceneDetailFile.getFile()
      const sceneDetail = JSON.parse(await sceneDetailObj.text())

      expect(sceneDetail.name).toBe('Main Scene')
      expect(sceneDetail.layersWorld).toHaveLength(1)
    })
  })

  describe('Pemuatan Daftar Proyek (getProjects)', () => {
    it('mengambil semua proyek dari OPFS dan mengurutkannya berdasarkan tanggal updatedAt terbaru', async () => {
      // Arrange: Buat dua proyek dengan tanggal berbeda
      const p1 = await actions.createProject({ projectName: 'Proyek Lama' })
      const p2 = await actions.createProject({ projectName: 'Proyek Baru' })

      // Edit updatedAt secara eksplisit di storage
      const appDir = await rootDirectoryHandle.getDirectoryHandle('lupis-engine')
      const projectsDir = await appDir.getDirectoryHandle('projects')

      const p1Dir = await projectsDir.getDirectoryHandle(p1.id)
      const p1File = await p1Dir.getFileHandle('project.json')
      const p1Writable = await p1File.createWritable()
      await p1Writable.write(
        JSON.stringify({ ...p1, updatedAt: '2026-01-01T00:00:00.000Z' })
      )
      await p1Writable.close()

      const p2Dir = await projectsDir.getDirectoryHandle(p2.id)
      const p2File = await p2Dir.getFileHandle('project.json')
      const p2Writable = await p2File.createWritable()
      await p2Writable.write(
        JSON.stringify({ ...p2, updatedAt: '2026-09-01T00:00:00.000Z' })
      )
      await p2Writable.close()

      // Act
      const projects = await actions.getProjects()

      // Assert
      expect(projects).toHaveLength(2)
      expect(projects[0].name).toBe('Proyek Baru') // Paling baru di urutan pertama
      expect(projects[1].name).toBe('Proyek Lama')
    })
  })

  describe('Pemuatan Detail Proyek berdasarkan ID (getProjectById)', () => {
    it('membaca dan menggabungkan metadata beserta berkas detail dari folder scenes, prefabs, dan scripts', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Test Detail' })

      // Act
      const loaded = await actions.getProjectById(created.id)

      // Assert
      expect(loaded.project.id).toBe(created.id)
      expect(loaded.scenes).toHaveLength(1)
      expect(loaded.scenes[0].name).toBe('Main Scene')
      expect(loaded.assets).toEqual([])
      expect(loaded.prefabs).toEqual([])
      expect(loaded.scripts).toEqual([])
      expect(loaded.folders).toEqual([])
    })

    it('melempar error jika folder proyek tidak ditemukan di OPFS', async () => {
      // Act & Assert
      await expect(actions.getProjectById('proj_non_existent')).rejects.toThrow(
        "Folder proyek 'proj_non_existent' tidak ditemukan di OPFS."
      )
    })
  })

  describe('Pembaruan dan Sinkronisasi Proyek (updateProject & syncProject)', () => {
    it('memperbarui metadata proyek dan mencatat timestamp updatedAt terbaru', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Proyek Awal' })

      // Act
      const updated = await actions.updateProject(created.id, {
        name: 'Proyek Direvisi'
      })

      // Assert
      expect(updated.name).toBe('Proyek Direvisi')

      // Verifikasi di storage
      const reloaded = await actions.getProjectById(created.id)
      expect(reloaded.project.name).toBe('Proyek Direvisi')
    })

    it('menyimpan payload komprehensif berisi assets, scenes, prefabs, scripts, dan folders ke OPFS (syncProject)', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Sync Test' })
      const projectId = created.id

      const syncPayload = {
        project: { id: projectId, name: 'Sync Test Updated' },
        assets: [{ id: 'asset_1', name: 'Player Sprite' }],
        folders: [{ id: 'folder_1', name: 'Sprites' }],
        scenes: [
          { id: 'scene_main', name: 'Level 1', entities: [{ id: 'e1' }] }
        ],
        prefabs: [
          { id: 'prefab_1', name: 'Enemy Prefab', type: 'world' }
        ],
        scripts: [
          { id: 'script_1', name: 'PlayerController', type: 'component' }
        ]
      }

      // Act
      const result = await actions.syncProject(projectId, syncPayload)

      // Assert
      expect(result.success).toBe(true)

      // Verifikasi data yang tersimpan via getProjectById
      const reloaded = await actions.getProjectById(projectId)
      expect(reloaded.project.name).toBe('Sync Test Updated')
      expect(reloaded.assets).toEqual(syncPayload.assets)
      expect(reloaded.folders).toEqual(syncPayload.folders)
      expect(reloaded.scenes[0].name).toBe('Level 1')
      expect(reloaded.prefabs[0].name).toBe('Enemy Prefab')
      expect(reloaded.scripts[0].name).toBe('PlayerController')
    })
  })

  describe('Penghapusan Proyek (deleteProject)', () => {
    it('menghapus seluruh direktori proyek secara rekursif dari OPFS', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Proyek Hapus' })
      const projectId = created.id

      // Pastikan proyek tersimpan sebelum dihapus
      const beforeDelete = await actions.getProjects()
      expect(beforeDelete.some((p) => p.id === projectId)).toBe(true)

      // Act
      const deleteResult = await actions.deleteProject(projectId)

      // Assert
      expect(deleteResult).toBe(true)
      const afterDelete = await actions.getProjects()
      expect(afterDelete.some((p) => p.id === projectId)).toBe(false)
    })
  })
})
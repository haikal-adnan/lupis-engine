import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectActions } from '@projects/projects.js'

/**
 * In-Memory OPFS Storage Simulator
 * Simulates browser built-in FileSystemDirectoryHandle & FileSystemFileHandle structures.
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

describe('useProjectActions Integration with OPFS Storage', () => {
  let actions
  let rootDirectoryHandle

  beforeEach(() => {
    vi.clearAllMocks()
    rootDirectoryHandle = new MockDirectoryHandle('root')

    // Stub navigator.storage to use in-memory storage simulator
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

  describe('OPFS Support Verification (_ensureOPFSSupport)', () => {
    it('[Bad Path] throws an error when navigator.storage is not available in browser environment', async () => {
      // Arrange
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true
      })

      // Act & Assert
      await expect(actions.getUserProjectsDir()).rejects.toThrow()
    })
  })

  describe('New Project Creation (createProject)', () => {
    it('creates a complete project directory structure and default json files in OPFS', async () => {
      // Arrange
      const projectInput = {
        projectName: 'New RPG Game',
        description: '2D Top-Down Adventure'
      }

      // Act
      const createdProject = await actions.createProject(projectInput)

      // Assert
      expect(createdProject.id).toBeDefined()
      expect(createdProject.name).toBe('New RPG Game')

      // Verify directory structure in OPFS
      const appDir = await rootDirectoryHandle.getDirectoryHandle('lupis-engine')
      const projectsDir = await appDir.getDirectoryHandle('projects')
      const projectDir = await projectsDir.getDirectoryHandle(createdProject.id)

      // Verify project.json file
      const projectFile = await projectDir.getFileHandle('project.json')
      const projectFileObj = await projectFile.getFile()
      const savedProjectData = JSON.parse(await projectFileObj.text())

      expect(savedProjectData.name).toBe('New RPG Game')

      // Verify scenes & workspaces subdirectories
      const scenesDir = await projectDir.getDirectoryHandle('scenes')
      const workspacesDir = await projectDir.getDirectoryHandle('workspaces')

      const scenesMetaFile = await workspacesDir.getFileHandle('scenes.json')
      const scenesMetaObj = await scenesMetaFile.getFile()
      const scenesMeta = JSON.parse(await scenesMetaObj.text())

      expect(scenesMeta).toHaveLength(1)
      expect(scenesMeta[0].scriptId).toBe('Main_Scene')

      // Verify main scene detail file
      const defaultSceneId = scenesMeta[0].id
      const sceneDetailFile = await scenesDir.getFileHandle(`${defaultSceneId}.json`)
      const sceneDetailObj = await sceneDetailFile.getFile()
      const sceneDetail = JSON.parse(await sceneDetailObj.text())

      expect(sceneDetail.scriptId).toBe('Main_Scene')
      expect(sceneDetail.layersWorld).toHaveLength(1)
    })
  })

  describe('Loading Project List (getProjects)', () => {
    it('retrieves all projects from OPFS and sorts them by most recent updatedAt timestamp', async () => {
      // Arrange: Create two projects with different timestamps
      const p1 = await actions.createProject({ projectName: 'Old Project' })
      const p2 = await actions.createProject({ projectName: 'New Project' })

      // Explicitly edit updatedAt in storage
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
      expect(projects[0].name).toBe('New Project') // Most recent first
      expect(projects[1].name).toBe('Old Project')
    })

    it('[Bad Path] throws SyntaxError if project.json file is corrupted or contains invalid syntax', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Corrupted Project' })
      const appDir = await rootDirectoryHandle.getDirectoryHandle('lupis-engine')
      const projectsDir = await appDir.getDirectoryHandle('projects')
      const projectDir = await projectsDir.getDirectoryHandle(created.id)
      
      const fileHandle = await projectDir.getFileHandle('project.json')
      const writable = await fileHandle.createWritable()
      await writable.write('{ "name": "Corrupted Json", ') // Incomplete/corrupted JSON
      await writable.close()

      // Act & Assert
      await expect(actions.getProjects()).rejects.toThrow(SyntaxError)
    })
  })

  describe('Loading Project Detail by ID (getProjectById)', () => {
    it('reads and merges metadata and detail files from scenes, prefabs, and scripts directories', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Test Detail' })

      // Act
      const loaded = await actions.getProjectById(created.id)

      // Assert
      expect(loaded.project.id).toBe(created.id)
      expect(loaded.scenes).toHaveLength(1)
      expect(loaded.scenes[0].scriptId).toBe('Main_Scene')
      expect(loaded.assets).toEqual([])
      expect(loaded.prefabs).toEqual([])
      expect(loaded.scripts).toEqual([])
      expect(loaded.folders).toEqual([])
    })

    it('[Bad Path] throws an error if project directory is not found in OPFS', async () => {
      // Act & Assert
      await expect(actions.getProjectById('proj_non_existent')).rejects.toThrow(
        "Directory 'proj_non_existent' not found."
      )
    })

    it('[Bad Path] throws an error if scene detail file recorded in workspace meta is missing from scenes directory', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Test Missing Scene File' })
      const appDir = await rootDirectoryHandle.getDirectoryHandle('lupis-engine')
      const projectsDir = await appDir.getDirectoryHandle('projects')
      const projectDir = await projectsDir.getDirectoryHandle(created.id)
      const workspacesDir = await projectDir.getDirectoryHandle('workspaces')

      // Get default scene ID from scenes.json
      const scenesMetaFile = await workspacesDir.getFileHandle('scenes.json')
      const scenesMetaObj = await scenesMetaFile.getFile()
      const scenesMeta = JSON.parse(await scenesMetaObj.text())
      const sceneId = scenesMeta[0].id

      // Remove scene detail file from scenes directory
      const scenesDir = await projectDir.getDirectoryHandle('scenes')
      await scenesDir.removeEntry(`${sceneId}.json`)

      // Act & Assert
      await expect(actions.getProjectById(created.id)).rejects.toThrow(
        `File '${sceneId}.json' not found.`
      )
    })
  })

  describe('Updating and Syncing Project (updateProject & syncProject)', () => {
    it('updates project metadata and records newest updatedAt timestamp', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Initial Project' })

      // Act
      const updated = await actions.updateProject(created.id, {
        name: 'Revised Project'
      })

      // Assert
      expect(updated.name).toBe('Revised Project')

      // Verify in storage
      const reloaded = await actions.getProjectById(created.id)
      expect(reloaded.project.name).toBe('Revised Project')
    })

    it('[Bad Path] throws an error when updating project whose ID does not exist', async () => {
      // Act & Assert
      await expect(
        actions.updateProject('proj_invalid_id', { name: 'Failed Update' })
      ).rejects.toThrow("Directory 'proj_invalid_id' not found.")
    })

    it('saves comprehensive payload containing assets, scenes, prefabs, scripts, and folders to OPFS (syncProject)', async () => {
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

      // Verify stored data via getProjectById
      const reloaded = await actions.getProjectById(projectId)
      expect(reloaded.project.name).toBe('Sync Test Updated')
      expect(reloaded.assets).toEqual(syncPayload.assets)
      expect(reloaded.folders).toEqual(syncPayload.folders)
      expect(reloaded.scenes[0].name).toBe('Level 1')
      expect(reloaded.prefabs[0].name).toBe('Enemy Prefab')
      expect(reloaded.scripts[0].name).toBe('PlayerController')
    })
  })

  describe('Deleting Project (deleteProject)', () => {
    it('deletes entire project directory recursively from OPFS', async () => {
      // Arrange
      const created = await actions.createProject({ projectName: 'Delete Project' })
      const projectId = created.id

      // Verify project is saved before deletion
      const beforeDelete = await actions.getProjects()
      expect(beforeDelete.some((p) => p.id === projectId)).toBe(true)

      // Act
      const deleteResult = await actions.deleteProject(projectId)

      // Assert
      expect(deleteResult).toBe(true)
      const afterDelete = await actions.getProjects()
      expect(afterDelete.some((p) => p.id === projectId)).toBe(false)
    })

    it('[Bad Path] throws an error when attempting to delete non-existent project', async () => {
      // Act & Assert
      await expect(actions.deleteProject('proj_non_existent')).rejects.toThrow(
        "Entry 'proj_non_existent' not found."
      )
    })
  })
})
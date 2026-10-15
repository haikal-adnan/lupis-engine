import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAssetStore } from '@assets/assets.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// ==============================================================================
// EXTERNAL DEPENDENCY MOCK
// ==============================================================================
vi.mock('@projects/projects.js', () => ({
  useProjectActions: () => ({
    createProject: vi.fn().mockResolvedValue({ id: 'proj-123', name: 'Test Project' })
  }),
  useProjectStore: () => ({
    markAsDirty: vi.fn()
  })
}))

describe('Integration Test: Asset Store with OPFS and Workspace Store', () => {
  let mockStoreRef
  let assetStore
  let workspaceStore

  beforeEach(async () => {
    setActivePinia(createPinia())

    // Setup in-memory OPFS simulator
    mockStoreRef = setupMockOPFS()

    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()

    // Initialize initial mock project
    const project = await createMockEmptyProject()
    workspaceStore.activeProjectId = project.id

    // Setup global URL mock for Blob URL
    global.URL.createObjectURL = vi.fn((file) => `blob:mock-url-${file?.name || 'file'}`)
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Initialization & Asset State Sync', () => {
    it('initializes assets and filters getters correctly', () => {
      // Arrange
      const sampleAssets = [
        { id: '1', type: 'texture', name: 'hero.png' },
        { id: '2', type: 'font', name: 'arial.ttf' },
        { id: '3', type: 'sprite', name: 'coin.png' }
      ]

      // Act
      assetStore.initAssets(sampleAssets)

      // Assert
      expect(assetStore.assets).toHaveLength(3)
      expect(assetStore.textures).toHaveLength(2)
      expect(assetStore.fonts).toHaveLength(1)
      expect(assetStore.getAssetById('1')).toEqual(sampleAssets[0])
    })

    it('synchronizes assets state to assets.json file in workspace OPFS (lupis-engine)', async () => {
      // Arrange
      assetStore.assets = [{ id: 'ast-1', name: 'bg.png', type: 'texture' }]

      // Act
      await assetStore.syncAssetsToOPFS()

      // Assert
      const expectedJsonPath = 'root/lupis-engine/projects/proj-123/workspaces/assets.json'
      expect(mockStoreRef.store.has(expectedJsonPath)).toBe(true)

      const fileHandle = mockStoreRef.store.get(expectedJsonPath)
      const file = await fileHandle.getFile()
      const content = await file.text()
      const parsedData = JSON.parse(content)

      expect(parsedData).toEqual([{ id: 'ast-1', name: 'bg.png', type: 'texture' }])
    })
  })

  describe('File Management & Asset File Operations', () => {
    it('adds new asset with physical file and extra files to OPFS', async () => {
      // Arrange
      const assetMeta = {
        id: 'font-1',
        name: 'Custom Font',
        fileKey: 'font_key_1',
        type: 'font',
        meta: { extension: '.ttf' }
      }
      const rawFile = new File(['ttf-binary-content'], 'font_key_1.ttf', { type: 'font/ttf' })
      const extraFiles = [
        { fileName: 'font_key_1.fnt', file: new Blob(['fnt-metadata']) }
      ]

      // Act
      await assetStore.addAsset(assetMeta, rawFile, extraFiles)

      // Assert
      const savedAssetPath = 'root/lupis-engine/projects/proj-123/assets/font_key_1.ttf'
      const savedExtraPath = 'root/lupis-engine/projects/proj-123/assets/font_key_1.fnt'

      expect(mockStoreRef.store.has(savedAssetPath)).toBe(true)
      expect(mockStoreRef.store.has(savedExtraPath)).toBe(true)
      expect(assetStore.assets).toContainEqual(assetMeta)
    })

    it('moves asset to target folder and synchronizes data to OPFS', async () => {
      // Arrange
      assetStore.assets = [{ id: 'ast-1', name: 'icon.png', folderId: 'root' }]

      // Act
      const result = await assetStore.moveAsset('ast-1', 'folder-ui')

      // Assert
      expect(result).toBe(true)
      expect(assetStore.getAssetById('ast-1').folderId).toBe('folder-ui')

      const jsonPath = 'root/lupis-engine/projects/proj-123/workspaces/assets.json'
      const fileHandle = mockStoreRef.store.get(jsonPath)
      const content = JSON.parse(await (await fileHandle.getFile()).text())
      expect(content[0].folderId).toBe('folder-ui')
    })

    it('updates asset metadata and saves to OPFS', async () => {
      // Arrange
      assetStore.assets = [{ id: 'ast-1', name: 'Old Name', type: 'texture' }]

      // Act
      await assetStore.updateAsset('ast-1', { name: 'New Name' })

      // Assert
      expect(assetStore.getAssetById('ast-1').name).toBe('New Name')
    })

    it('deletes standard asset, revokes blob URL cache, and removes file from OPFS', async () => {
      // Arrange
      const asset = {
        id: 'ast-1',
        fileKey: 'file_1',
        meta: { extension: '.png', hasBmFont: false }
      }
      assetStore.assets = [asset]
      const filePath = 'root/lupis-engine/projects/proj-123/assets/file_1.png'

      // Pre-populate file in OPFS & cache blob url
      const rootDir = await navigator.storage.getDirectory()
      const appDir = await rootDir.getDirectoryHandle('lupis-engine', { create: true })
      const projectsDir = await appDir.getDirectoryHandle('projects', { create: true })
      const projectDir = await projectsDir.getDirectoryHandle('proj-123', { create: true })
      const assetsDir = await projectDir.getDirectoryHandle('assets', { create: true })
      await assetsDir.getFileHandle('file_1.png', { create: true })

      assetStore.blobUrlCache.set('ast-1', 'blob:mock-url-ast-1')

      // Act
      await assetStore.removeAsset('ast-1')

      // Assert
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-ast-1')
      expect(assetStore.blobUrlCache.has('ast-1')).toBe(false)
      expect(mockStoreRef.store.has(filePath)).toBe(false)
      expect(assetStore.assets).toHaveLength(0)
    })

    it('deletes BMFont asset along with all associated FNT and PNG files from OPFS', async () => {
      // Arrange
      const bmFontAsset = {
        id: 'font-bm-1',
        fileKey: 'bm_font_key',
        meta: {
          extension: '.fnt',
          hasBmFont: true,
          fntFile: 'bm_font_key.fnt',
          pngFiles: ['bm_font_key_0.png', 'bm_font_key_1.png']
        }
      }
      assetStore.assets = [bmFontAsset]

      const rootDir = await navigator.storage.getDirectory()
      const appDir = await rootDir.getDirectoryHandle('lupis-engine', { create: true })
      const projDir = await (await appDir.getDirectoryHandle('projects', { create: true })).getDirectoryHandle('proj-123', { create: true })
      const assetsDir = await projDir.getDirectoryHandle('assets', { create: true })

      await assetsDir.getFileHandle('bm_font_key.fnt', { create: true })
      await assetsDir.getFileHandle('bm_font_key_0.png', { create: true })
      await assetsDir.getFileHandle('bm_font_key_1.png', { create: true })

      // Act
      await assetStore.removeAsset('font-bm-1')

      // Assert
      expect(mockStoreRef.store.has('root/lupis-engine/projects/proj-123/assets/bm_font_key.fnt')).toBe(false)
      expect(mockStoreRef.store.has('root/lupis-engine/projects/proj-123/assets/bm_font_key_0.png')).toBe(false)
      expect(mockStoreRef.store.has('root/lupis-engine/projects/proj-123/assets/bm_font_key_1.png')).toBe(false)
      expect(assetStore.assets).toHaveLength(0)
    })

    it('duplicates standard asset along with copying OPFS file', async () => {
      // Arrange
      const originalAsset = {
        id: 'ast-orig',
        name: 'Player',
        fileKey: 'player_key',
        meta: { extension: '.png', hasBmFont: false }
      }
      assetStore.assets = [originalAsset]

      const rootDir = await navigator.storage.getDirectory()
      const appDir = await rootDir.getDirectoryHandle('lupis-engine', { create: true })
      const projDir = await (await appDir.getDirectoryHandle('projects', { create: true })).getDirectoryHandle('proj-123', { create: true })
      const assetsDir = await projDir.getDirectoryHandle('assets', { create: true })
      
      const fileHandle = await assetsDir.getFileHandle('player_key.png', { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write('image-data')
      await writable.close()

      // Act
      await assetStore.duplicateAsset('ast-orig')

      // Assert
      expect(assetStore.assets).toHaveLength(2)
      const duplicated = assetStore.assets[1]

      expect(duplicated.name).toBe('Player (Copy)')
      expect(duplicated.fileKey).not.toBe('player_key')

      const duplicatedPath = `root/lupis-engine/projects/proj-123/assets/${duplicated.fileKey}.png`
      expect(mockStoreRef.store.has(duplicatedPath)).toBe(true)
    })

    it('creates Blob URL and stores in cache when calling getAssetUrlById', async () => {
      // Arrange
      const asset = {
        id: 'ast-url',
        fileKey: 'sample_asset',
        meta: { extension: '.png' }
      }
      assetStore.assets = [asset]

      const rootDir = await navigator.storage.getDirectory()
      const appDir = await rootDir.getDirectoryHandle('lupis-engine', { create: true })
      const projDir = await (await appDir.getDirectoryHandle('projects', { create: true })).getDirectoryHandle('proj-123', { create: true })
      const assetsDir = await projDir.getDirectoryHandle('assets', { create: true })
      await assetsDir.getFileHandle('sample_asset.png', { create: true })

      // Act
      const urlFirstCall = await assetStore.getAssetUrlById('ast-url')
      const urlSecondCall = await assetStore.getAssetUrlById('ast-url')

      // Assert
      expect(urlFirstCall).toBe('blob:mock-url-sample_asset.png')
      expect(urlSecondCall).toBe(urlFirstCall)
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling / Bad Path', () => {
    it('[Bad Path] returns empty string when attempting getAssetUrlById for unregistered ID', async () => {
      // Act
      const result = await assetStore.getAssetUrlById('non-existent-id')

      // Assert
      expect(result).toBe('')
    })

    it('[Bad Path] handles gracefully when attempting to remove unregistered asset', async () => {
      // Act & Assert
      await expect(assetStore.removeAsset('non-existent-id')).resolves.not.toThrow()
    })
  })
})
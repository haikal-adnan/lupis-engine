import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAssetActions } from '@/features/assets/useAssetActions.js'
import { useAssetStore, assetSchema } from '@assets/assets.js'
import { useFolderStore } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { usePopAlert } from '@composables/composables.js'
import { useFontConverter } from '@assets/assets.js'

// Mock external dependencies
vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn()
}))

vi.mock('@assets/assets.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useFontConverter: vi.fn(),
    assetSchema: actual.assetSchema || ((data) => ({ ...data }))
  }
})

describe('Integration Test: Asset Actions with Stores & Composables', () => {
  let assetStore
  let folderStore
  let workspaceStore
  let mockShowPop
  let mockConvertTtfToBmFont

  beforeEach(() => {
    setActivePinia(createPinia())

    assetStore = useAssetStore()
    folderStore = useFolderStore()
    workspaceStore = useWorkspaceStore()

    // Setup active project and folder ID
    workspaceStore.activeProjectId = 'proj-999'
    folderStore.activeFolderId = 'folder-root'

    // Setup mock showPop
    mockShowPop = vi.fn()
    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop })

    // Setup mock font converter
    mockConvertTtfToBmFont = vi.fn().mockResolvedValue({
      fntFile: new Blob(['fnt-content'], { type: 'text/plain' }),
      pngFiles: [new Blob(['png-content'], { type: 'image/png' })]
    })
    vi.mocked(useFontConverter).mockReturnValue({
      convertTtfToBmFont: mockConvertTtfToBmFont
    })

    // Mock global URL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock HTMLImageElement class (to ensure new Image() is valid)
    global.Image = class MockImage {
      constructor() {
        this._src = ''
        this.width = 1920
        this.height = 1080
        this.onload = null
      }

      set src(value) {
        this._src = value
        setTimeout(() => {
          if (typeof this.onload === 'function') {
            this.onload()
          }
        }, 0)
      }

      get src() {
        return this._src
      }
    }

    // Mock HTMLAudioElement class (to ensure new Audio() is valid)
    global.Audio = class MockAudio {
      constructor() {
        this._src = ''
        this.duration = 120.5
        this.onloadedmetadata = null
      }

      set src(value) {
        this._src = value
        setTimeout(() => {
          if (typeof this.onloadedmetadata === 'function') {
            this.onloadedmetadata()
          }
        }, 0)
      }

      get src() {
        return this._src
      }
    }

    // Stub OPFS methods on store to focus on actions
    assetStore.addAsset = vi.fn(async (asset) => {
      assetStore.assets.push(asset)
    })
    assetStore.removeAsset = vi.fn(async (assetId) => {
      assetStore.assets = assetStore.assets.filter((a) => a.id !== assetId)
    })
    assetStore.updateAsset = vi.fn(async (assetId, updates) => {
      const asset = assetStore.assets.find((a) => a.id === assetId)
      if (asset) Object.assign(asset, updates)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Import Asset (Image / Audio / Font)', () => {
    it('imports image file (texture), measures dimensions, and updates store state', async () => {
      // Arrange
      const { importAsset } = useAssetActions()
      const mockImageFile = new File(['image-bytes'], 'background.png', { type: 'image/png' })

      // Act
      const createdAsset = await importAsset(mockImageFile)

      // Assert
      expect(assetStore.isUploading).toBe(false)
      expect(createdAsset.type).toBe('texture')
      expect(createdAsset.scriptId).toBe('background')
      expect(createdAsset.meta.dimensions).toEqual({ w: 1920, h: 1080 })
      expect(createdAsset.meta.hasBmFont).toBe(false)
      expect(createdAsset.meta.fntFile).toBeUndefined()
      expect(createdAsset.meta.pngFiles).toBeUndefined()
      expect(assetStore.addAsset).toHaveBeenCalledWith(
        expect.objectContaining({ scriptId: 'background', type: 'texture' }),
        mockImageFile,
        []
      )
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Upload Ready' })
      )
    })

    it('handles duplicate file names in the same folder by appending numbering automatically', async () => {
      // Arrange
      assetStore.assets = [
        { scriptId: 'sprite', folderId: 'folder-root' },
        { scriptId: 'sprite_1', folderId: 'folder-root' }
      ]

      const { importAsset } = useAssetActions()
      const mockFile = new File(['image-bytes'], 'sprite.png', { type: 'image/png' })

      // Specific custom dimensions for this test
      global.Image = class CustomImage extends global.Image {
        constructor() {
          super()
          this.width = 64
          this.height = 64
        }
      }

      // Act
      const createdAsset = await importAsset(mockFile)

      // Assert
      expect(createdAsset.scriptId).toBe('sprite_2')
      expect(createdAsset.meta.dimensions).toEqual({ w: 64, h: 64 })
    })

    it('imports font file (.ttf), triggers BMFont conversion, and saves extra files (.fnt & .png)', async () => {
      // Arrange
      const { importAsset } = useAssetActions()
      const mockFontFile = new File(['font-bytes'], 'CustomFont.ttf', { type: 'font/ttf' })

      // Act
      const createdAsset = await importAsset(mockFontFile)

      // Assert
      expect(mockConvertTtfToBmFont).toHaveBeenCalledWith(mockFontFile)
      expect(createdAsset.type).toBe('font')
      expect(createdAsset.meta.hasBmFont).toBe(true)
      expect(createdAsset.meta.pngFiles).toHaveLength(1)
      expect(assetStore.addAsset).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'font' }),
        mockFontFile,
        expect.arrayContaining([
          expect.objectContaining({ fileName: expect.stringMatching(/\.fnt$/) }),
          expect.objectContaining({ fileName: expect.stringMatching(/\.png$/) })
        ])
      )
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Converting Font', type: 'info' })
      )
    })

    it('imports audio file, calculates duration, and updates store state', async () => {
      // Arrange
      const { importAsset } = useAssetActions()
      const mockAudioFile = new File(['audio-bytes'], 'bgm.mp3', { type: 'audio/mpeg' })

      // Act
      const createdAsset = await importAsset(mockAudioFile)

      // Assert
      expect(createdAsset.type).toBe('audio')
      expect(createdAsset.meta.duration).toBe(120.5)
      expect(createdAsset.meta.hasBmFont).toBe(false)
      expect(createdAsset.meta.fntFile).toBeUndefined()
      expect(createdAsset.meta.pngFiles).toBeUndefined()
      expect(assetStore.addAsset).toHaveBeenCalled()
    })

    it('ensures non-font assets (texture, audio) omit fntFile and pngFiles in metadata schema', async () => {
      const { importAsset } = useAssetActions()
      const mockImage = new File(['img'], 'hero.png', { type: 'image/png' })
      const mockAudio = new File(['snd'], 'sound.mp3', { type: 'audio/mpeg' })
      const mockFont = new File(['fnt'], 'game.ttf', { type: 'font/ttf' })

      const imageAsset = await importAsset(mockImage)
      const audioAsset = await importAsset(mockAudio)
      const fontAsset = await importAsset(mockFont)

      expect(imageAsset.meta.fntFile).toBeUndefined()
      expect(imageAsset.meta.pngFiles).toBeUndefined()
      expect(imageAsset.meta.hasBmFont).toBe(false)

      expect(audioAsset.meta.fntFile).toBeUndefined()
      expect(audioAsset.meta.pngFiles).toBeUndefined()
      expect(audioAsset.meta.hasBmFont).toBe(false)

      expect(fontAsset.meta.fntFile).toBeDefined()
      expect(fontAsset.meta.pngFiles).toBeDefined()
      expect(fontAsset.meta.hasBmFont).toBe(true)
    })
  })

  describe('Asset Management & Modification', () => {
    it('deletes asset via store and shows alert pop notification', async () => {
      // Arrange
      const { deleteAsset } = useAssetActions()
      assetStore.assets = [{ id: 'ast-101', scriptId: 'Hero' }]

      // Act
      await deleteAsset('ast-101')

      // Assert
      expect(assetStore.removeAsset).toHaveBeenCalledWith('ast-101')
      expect(assetStore.assets).toHaveLength(0)
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Asset Deleted',
        message: 'The asset has been removed.',
        type: 'info'
      })
    })

    it('renames asset, trims redundant whitespace, and updates store', async () => {
      // Arrange
      const { renameAsset } = useAssetActions()
      assetStore.assets = [{ id: 'ast-102', scriptId: 'OldName' }]

      // Act
      await renameAsset('ast-102', '  New Asset Name  ')

      // Assert
      expect(assetStore.updateAsset).toHaveBeenCalledWith('ast-102', {
        scriptId: 'New_Asset_Name',
        isSynced: true
      })
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Asset renamed.',
        type: 'success'
      })
    })

    it('updates specific asset properties directly', async () => {
      // Arrange
      const { updateAssetProperty } = useAssetActions()
      assetStore.assets = [{ id: 'ast-103', scriptId: 'Asset 1', folderId: 'folder-a' }]

      // Act
      await updateAssetProperty('ast-103', { folderId: 'folder-b' })

      // Assert
      expect(assetStore.updateAsset).toHaveBeenCalledWith('ast-103', { folderId: 'folder-b' })
    })
  })

  describe('Error Handling / Bad Path', () => {
    it('[Bad Path] handles font conversion service failure and rethrows error', async () => {
      // Arrange
      mockConvertTtfToBmFont.mockRejectedValueOnce(new Error('Failed to parse TTF file.'))
      const { importAsset } = useAssetActions()
      const corruptFontFile = new File(['corrupt-bytes'], 'corrupt.ttf', { type: 'font/ttf' })

      // Act & Assert
      await expect(importAsset(corruptFontFile)).rejects.toThrow('Failed to parse TTF file.')
      expect(assetStore.isUploading).toBe(false)
    })

    it('[Bad Path] rejects font upload when font conversion returns null and resets uploading state', async () => {
      // Arrange
      mockConvertTtfToBmFont.mockResolvedValueOnce(null)
      const { importAsset } = useAssetActions()
      const fontFile = new File(['ttf-bytes'], 'FailedFont.ttf', { type: 'font/ttf' })

      // Act & Assert
      await expect(importAsset(fontFile)).rejects.toThrow('Font conversion failed for "FailedFont.ttf".')
      expect(assetStore.isUploading).toBe(false)
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Upload Failed', type: 'error' })
      )
    })

    it('[Bad Path] rejects assets that exceed the maximum file size limit', async () => {
      // Arrange
      const { importAsset } = useAssetActions()
      // Create a mock file with size > 20MB for font
      const oversizedFont = new File(['x'], 'HugeFont.ttf', { type: 'font/ttf' })
      Object.defineProperty(oversizedFont, 'size', { value: 25 * 1024 * 1024 })

      // Act & Assert
      await expect(importAsset(oversizedFont)).rejects.toThrow('File "HugeFont.ttf" is too large (25.0MB). Maximum allowed size is 20MB.')
      expect(assetStore.isUploading).toBe(false)
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Upload Failed', type: 'error' })
      )
    })

    it('displays large font conversion alert when uploading font over 1MB', async () => {
      // Arrange
      const { importAsset } = useAssetActions()
      const largeFont = new File(['x'], 'GaeguLarge.ttf', { type: 'font/ttf' })
      Object.defineProperty(largeFont, 'size', { value: 3.2 * 1024 * 1024 })

      // Act
      await importAsset(largeFont)

      // Assert
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Converting Font',
          message: expect.stringContaining('Converting large font "GaeguLarge.ttf"'),
          type: 'info'
        })
      )
      expect(assetStore.isUploading).toBe(false)
    })
  })
})
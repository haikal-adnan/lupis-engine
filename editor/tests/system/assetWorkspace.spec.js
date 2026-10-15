import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

import * as AssetModule from '@assets/assets.js'
import { useFolderStore, useFolderActions } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneStore } from '@scenes/scenes.js'

const { 
  useAssetStore, 
  useAssetActions, 
  useAssetLogic, 
  useAssetMenu,
  assetSchema 
} = AssetModule

// Mock external UI Alerts & Dialog Prompts composables
const mockPrompt = vi.fn()
const mockConfirm = vi.fn().mockResolvedValue(true)

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm }),
  usePopImage: () => ({ showImage: vi.fn() }),
  usePopAudio: () => ({ showAudio: vi.fn() })
}))

// Mock URL API for jsdom/node environment
if (typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (typeof window.URL.revokeObjectURL !== 'function') {
  window.URL.revokeObjectURL = vi.fn()
}

describe('AssetWorkspace Integration Testing', () => {
  let storeRef
  let project

  // Helper to create mock assets without DOM element dependencies
  const createMockAsset = async ({ name = 'test_asset', type = 'texture', folderId = null } = {}) => {
    const assetStore = useAssetStore()
    const workspaceStore = useWorkspaceStore()
    
    const asset = assetSchema({
      id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: workspaceStore.activeProjectId,
      folderId,
      name,
      type,
      fileKey: `mock_${type}_${Math.random().toString(36).substring(2, 8)}`,
      meta: { extension: type === 'texture' ? '.png' : '.wav', size: 1024 },
      isSynced: true
    })

    const fakeFile = new File(['mock content'], `${name}${asset.meta.extension}`, { 
      type: type === 'texture' ? 'image/png' : 'audio/wav' 
    })
    
    await assetStore.addAsset(asset, fakeFile, [])
    return asset
  }

  beforeEach(async () => {
    setActivePinia(createPinia())
    storeRef = setupMockOPFS()
    project = await createMockEmptyProject({ projectName: 'Integration Test Project' })
    
    const workspaceStore = useWorkspaceStore()
    workspaceStore.activeProjectId = project.id
    workspaceStore.activeBottomTabId = 'assets'

    // Mock useFontConverter via spyOn to return mock instance without breaking barrel import
    vi.spyOn(AssetModule, 'useFontConverter').mockImplementation(() => ({
      isConverting: false,
      convertTtfToBmFont: vi.fn().mockResolvedValue({
        originalFont: new File(['ttf content'], 'font.ttf', { type: 'font/ttf' }),
        fntFile: new File(['fnt content'], 'font.fnt', { type: 'text/plain' }),
        pngFiles: [new File(['png content'], 'font.png', { type: 'image/png' })]
      })
    }))

    // Valid Mock Constructor Class for Image & Audio DOM
    globalThis.Image = class {
      constructor() {
        setTimeout(() => {
          this.width = 100
          this.height = 100
          if (typeof this.onload === 'function') this.onload()
        }, 0)
      }
    }

    globalThis.Audio = class {
      constructor() {
        this.duration = 5
        setTimeout(() => {
          if (typeof this.onloadedmetadata === 'function') this.onloadedmetadata()
        }, 0)
      }
    }

    mockPrompt.mockReset()
    mockConfirm.mockReset().mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (storeRef?.store) {
      storeRef.store.clear()
    }
  })

  describe('Asset CRUD Integration', () => {
    it('imports new asset and saves it to store state and OPFS', async () => {
      const assetStore = useAssetStore()
      const importedAsset = await createMockAsset({ name: 'hero', type: 'texture' })

      expect(importedAsset).toBeDefined()
      expect(importedAsset.name).toBe('hero')
      expect(importedAsset.type).toBe('texture')
      expect(assetStore.assets.some(a => a.id === importedAsset.id)).toBe(true)

      const assetsJsonHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/workspaces/assets.json`)
      expect(assetsJsonHandle).toBeDefined()

      const savedFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/assets/${importedAsset.fileKey}.png`)
      expect(savedFileHandle).toBeDefined()
    })

    it('renames asset and updates OPFS synchronization', async () => {
      const { renameAsset } = useAssetActions()
      const assetStore = useAssetStore()

      const asset = await createMockAsset({ name: 'icon', type: 'texture' })
      await renameAsset(asset.id, 'app_icon')

      const updatedAsset = assetStore.getAssetById(asset.id)
      expect(updatedAsset.name).toBe('app_icon')

      const assetsJsonHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/workspaces/assets.json`)
      const fileData = await assetsJsonHandle.getFile()
      const content = JSON.parse(await fileData.text())
      expect(content.find(a => a.id === asset.id).name).toBe('app_icon')
    })

    it('deletes asset along with physical files from OPFS', async () => {
      const { deleteAsset } = useAssetActions()
      const assetStore = useAssetStore()

      const asset = await createMockAsset({ name: 'bg', type: 'texture' })
      await deleteAsset(asset.id)

      expect(assetStore.getAssetById(asset.id)).toBeUndefined()
      const savedFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/assets/${asset.fileKey}.png`)
      expect(savedFileHandle).toBeUndefined()
    })

    it('[Bad Path] safely handles attempt to delete invalid asset ID', async () => {
      const { deleteAsset } = useAssetActions()
      const assetStore = useAssetStore()

      const initialCount = assetStore.assets.length
      await deleteAsset('non_existent_asset_id')

      expect(assetStore.assets.length).toBe(initialCount)
    })
  })

  describe('Asset Section Folder CRUD Integration', () => {
    it('creates new folder in assets section', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('Textures')

      await createNewFolder({ defaultName: 'New Folder', section: 'assets', parentId: null })

      const created = folderStore.folders.find(f => f.name === 'Textures')
      expect(created).toBeDefined()
      expect(created.section).toBe('assets')
      expect(created.parentId).toBeNull()
    })

    it('deletes folder and updates folderStore state', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder, deleteFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('Audio')

      await createNewFolder({ section: 'assets', parentId: null })
      const folder = folderStore.folders.find(f => f.name === 'Audio')

      await deleteFolder(folder.id)

      expect(folderStore.getFolderById(folder.id)).toBeUndefined()
    })
  })

  describe('Asset Movement & Folder Navigation Integration', () => {
    it('moves asset to target folder and adjusts visibleAssets', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const logic = useAssetLogic()

      const asset = await createMockAsset({ name: 'tree', type: 'texture' })

      mockPrompt.mockResolvedValue('Sprites')
      await createNewFolder({ section: 'assets', parentId: null })
      const targetFolder = folderStore.folders.find(f => f.name === 'Sprites')

      await logic.moveItem(asset.id, 'asset', targetFolder.id)

      expect(asset.folderId).toBe(targetFolder.id)
      expect(logic.visibleAssets.value.some(a => a.id === asset.id)).toBe(false)

      logic.navigateTo(targetFolder)

      expect(folderStore.activeFolderId).toBe(targetFolder.id)
      expect(logic.visibleAssets.value.some(a => a.id === asset.id)).toBe(true)
    })

    it('moves asset back to root via breadcrumb navigation', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const logic = useAssetLogic()

      mockPrompt.mockResolvedValue('SubFolder')
      await createNewFolder({ section: 'assets', parentId: null })
      const folder = folderStore.folders.find(f => f.name === 'SubFolder')

      folderStore.setActiveFolder(folder.id)
      const asset = await createMockAsset({ name: 'character', type: 'texture', folderId: folder.id })

      await logic.moveItem(asset.id, 'asset', null)

      expect(asset.folderId).toBeNull()
      expect(logic.visibleAssets.value.some(a => a.id === asset.id)).toBe(false)

      logic.navigateTo(null)
      expect(logic.visibleAssets.value.some(a => a.id === asset.id)).toBe(true)
    })
  })

  describe('Context Menu & Scene Entity Feature Integration', () => {
    it('applies texture asset to SpriteRenderer component on active entity', async () => {
      const sceneStore = useSceneStore()
      const workspaceStore = useWorkspaceStore()
      const selectedIdRef = { value: null }

      workspaceStore.openTab({ id: 'entity_1', name: 'Scene', type: 'scene' })
      sceneStore.setActiveScene('scene_main')
      sceneStore.initScenes([{
        id: 'scene_main',
        name: 'Main Scene',
        entities: [
          {
            id: 'entity_1',
            components: {
              SpriteRenderer: { assetId: null }
            }
          }
        ]
      }])
      sceneStore.selectedEntityIds = ['entity_1']

      const asset = await createMockAsset({ name: 'player', type: 'texture' })

      const menu = useAssetMenu(selectedIdRef, vi.fn(), {})
      menu.handleContextMenu({ clientX: 100, clientY: 100 }, asset)

      const applyItem = menu.contextMenuItems.value.find(i => i.label === 'Apply to SpriteRenderer')
      expect(applyItem).toBeDefined()

      applyItem.action()

      const activeEntity = sceneStore.activeScene.entities[0]
      expect(activeEntity.components.SpriteRenderer.assetId).toBe(asset.id)
    })

    it('duplicates asset via clipboard copy/paste', async () => {
      const assetStore = useAssetStore()
      const logic = useAssetLogic()

      const asset = await createMockAsset({ name: 'sound', type: 'audio' })

      logic.clipboard.value = { action: 'copy', item: { id: asset.id, type: 'asset' } }
      await logic.handlePaste()

      expect(assetStore.assets.length).toBe(2)
      expect(assetStore.assets.some(a => a.name.includes('(Copy)'))).toBe(true)
    })
  })

  describe('Asset Search Integration', () => {
    it('filters visibleAssets and visibleFolders based on searchQuery', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const logic = useAssetLogic()

      mockPrompt.mockResolvedValueOnce('UI Elements').mockResolvedValueOnce('Audio Clips')
      await createNewFolder({ section: 'assets', parentId: null })
      await createNewFolder({ section: 'assets', parentId: null })

      await createMockAsset({ name: 'gui_button', type: 'texture' })
      await createMockAsset({ name: 'bg_music', type: 'audio' })

      logic.searchQuery.value = 'gui'

      expect(logic.visibleFolders.value.length).toBe(0)
      expect(logic.visibleAssets.value.length).toBe(1)
      expect(logic.visibleAssets.value[0].name).toBe('gui_button')
    })
  })

  describe('Font & BMFont Conversion Integration', () => {
    it('imports .ttf font file, converts to BMFont, and stores extra files in OPFS', async () => {
      const { importAsset } = useAssetActions()

      const fontFile = new File(['ttf content'], 'CustomFont.ttf', { type: 'font/ttf' })
      const fontAsset = await importAsset(fontFile)

      expect(fontAsset.type).toBe('font')
      expect(fontAsset.meta.hasBmFont).toBe(true)

      const fntHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/assets/${fontAsset.fileKey}.fnt`)
      const pngHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/assets/${fontAsset.fileKey}.png`)

      expect(fntHandle).toBeDefined()
      expect(pngHandle).toBeDefined()
    })
  })

  describe('Duplicate Naming & Clipboard Cut Operations Integration', () => {
    it('appends number suffix when importing asset with duplicate name in same folder', async () => {
      const { importAsset } = useAssetActions()

      const file1 = new File(['data'], 'sprite.png', { type: 'image/png' })
      const file2 = new File(['data'], 'sprite.png', { type: 'image/png' })

      const asset1 = await importAsset(file1)
      const asset2 = await importAsset(file2)

      expect(asset1.name).toBe('sprite')
      expect(asset2.name).toBe('sprite (1)')
    })

    it('moves asset with Cut and Paste action, then clears clipboard', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const logic = useAssetLogic()

      const asset = await createMockAsset({ name: 'move_me', type: 'texture' })
      
      mockPrompt.mockResolvedValue('TargetFolder')
      await createNewFolder({ section: 'assets', parentId: null })
      const targetFolder = folderStore.folders.find(f => f.name === 'TargetFolder')

      logic.clipboard.value = { action: 'cut', item: { id: asset.id, type: 'asset' } }
      
      logic.navigateTo(targetFolder)
      await logic.handlePaste()

      expect(asset.folderId).toBe(targetFolder.id)
      expect(logic.clipboard.value).toBeNull()
    })
  })

  describe('Double Click Preview & Utility Logic Integration', () => {
    it('toggles viewMode between grid and list', () => {
      const logic = useAssetLogic()
      
      expect(logic.viewMode.value).toBe('grid')
      logic.toggleViewMode()
      expect(logic.viewMode.value).toBe('list')
    })
  })
})
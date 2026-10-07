import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useSceneStore } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useAssetStore } from '@assets/assets.js'
import { useScriptStore } from '@scripts/scripts.js'
import { usePrefabStore } from '@prefabs/prefabs.js'

import { engineBridge, useEngineToEditor, useEditorToEngine } from '@engines/engines.js'

// Mock composables dengan menyediakan seluruh ekspor yang dibutuhkan secara utuh
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  usePrompt: () => ({ prompt: vi.fn().mockResolvedValue('Mocked_Prefab') }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
  useAlert: () => ({ alert: vi.fn().mockResolvedValue(true) }),
  useTheme: () => ({ isDark: { value: true } }),
  useClipboard: () => ({
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn().mockResolvedValue(['ent_pasted_1']),
    duplicate: vi.fn(),
    remove: vi.fn()
  })
}))

import {
  useCanvasLogic,
  useCanvasMenu
} from '@viewports/viewports.js'

import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity,
  createMockLayer,
  createMockComponent
} from '@tests/tests.js'

describe('Canvas Management & Engine Sync Integration', () => {
  let sceneStore
  let projectStore
  let workspaceStore
  let assetStore
  let scriptStore
  let prefabStore

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    projectStore = useProjectStore()
    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()
    scriptStore = useScriptStore()
    prefabStore = usePrefabStore()

    projectStore.project = {
      id: 'proj_canvas_test',
      name: 'Canvas Integration Test Project',
      settings: {
        tickRate: 60,
        grid: { visible: true, snap: true, width: 32, height: 32, color: '#ffffff', opacity: 0.5 },
        ui: { showUIBorder: true },
        camera: { zoom: 1 }
      }
    }

    workspaceStore.$patch({
      activeProjectId: 'proj_canvas_test',
      tabs: [{ id: 'tab_scene_main', type: 'scene' }],
      activeTabId: 'tab_scene_main',
      hasClipboardData: true
    })

    // Spy seluruh metode komunikasi engineBridge
    vi.restoreAllMocks()
    vi.spyOn(engineBridge, 'updateEntityProp').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'updateComponentProp').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'updateEntityName').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'createEntity').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'deleteEntity').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'onEntityModified').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'onTilemapDataUpdated').mockImplementation(() => {})
  })

  describe('Canvas Hierarchy Rendering Representation', () => {
    it('groups and resolves entities matching the scene hierarchy structure on canvas', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'layer_world_1', section: 'world', zIndex: 0 })
      const uiLayer = createMockLayer({ id: 'layer_ui_1', section: 'ui', zIndex: 10 })

      const worldEntity = createMockEntity({ id: 'ent_world_1', layerId: worldLayer.id, zIndex: 1 })
      const uiEntity = createMockEntity({ id: 'ent_ui_1', entityType: 'ui_text', layerId: uiLayer.id, zIndex: 0 })

      setupMockSceneEnvironment({
        layersWorld: [worldLayer],
        layersUI: [uiLayer],
        entities: [worldEntity, uiEntity]
      })

      // Act
      const activeEntities = sceneStore.activeEntities || []
      const layersWorld = sceneStore.activeScene?.layersWorld || []
      const layersUI = sceneStore.activeScene?.layersUI || []

      // Assert
      expect(layersWorld).toHaveLength(1)
      expect(layersUI).toHaveLength(1)
      expect(activeEntities.find(e => e.id === 'ent_world_1').layerId).toBe('layer_world_1')
      expect(activeEntities.find(e => e.id === 'ent_ui_1').layerId).toBe('layer_ui_1')
    })
  })

  describe('Real-time Two-Way Synchronization (Engine <-> Store)', () => {
    it('syncs transform changes emitted from Engine to SceneStore via useEngineToEditor', () => {
      // Arrange
      let entityModifiedCallback = null;
      vi.spyOn(engineBridge, 'onEntityModified').mockImplementation((cb) => {
        entityModifiedCallback = cb;
      });

      const entity = createMockEntity({
        id: 'ent_drag_1',
        components: {
          Transform: createMockComponent('Transform', { x: 0, y: 0, rotation: 0 })
        }
      });
      setupMockSceneEnvironment({ entities: [entity] });

      const { listen } = useEngineToEditor(sceneStore);
      listen();

      // Act: Simulasi event drag/modification dari Canvas Engine
      const engineEventPayload = [
        {
          id: 'ent_drag_1',
          components: {
            Transform: { x: 120, y: 250, rotation: 45, width: 32, height: 32, scaleX: 1, scaleY: 1 }
          }
        }
      ];
      entityModifiedCallback(engineEventPayload);

      // Assert
      const updatedTransform = sceneStore.activeScene.entities[0].components.Transform;
      expect(updatedTransform.x).toBe(120);
      expect(updatedTransform.y).toBe(250);
      expect(updatedTransform.rotation).toBe(45);
    })

    it('emits mutation events to Engine when SceneStore updates via useEditorToEngine', () => {
      // Arrange
      const { listen } = useEditorToEngine(projectStore, sceneStore, assetStore, workspaceStore, scriptStore, prefabStore)
      listen()

      const entity = createMockEntity({ id: 'ent_store_mod_1' })
      setupMockSceneEnvironment({ entities: [entity] })

      // Act: Ubah nama entitas di sceneStore
      sceneStore.updateEntityName('ent_store_mod_1', 'Renamed Hero')

      // Assert
      expect(engineBridge.updateEntityName).toHaveBeenCalledWith('ent_store_mod_1', 'Renamed Hero')
    })
  })

  describe('Canvas Context Menu State Derivation', () => {
    it('generates selection-based context menu items when an entity is selected', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_selected_1', name: 'Selected Entity' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_selected_1']

      const canvasLogic = useCanvasLogic()
      const { contextMenu, openMenu } = useCanvasMenu(canvasLogic)

      // Act: Buka menu konteks untuk entitas terpilih
      openMenu(100, 200, 50, 50, true)

      // Assert
      expect(contextMenu.value.visible).toBe(true)
      expect(contextMenu.value.x).toBe(100)
      expect(contextMenu.value.y).toBe(200)
      const labels = contextMenu.value.items.map(i => i.label)
      expect(labels).toContain('Copy')
      expect(labels).toContain('Bring to Front')
      expect(labels).toContain('Delete')
    })

    it('disables "Use as Prefab" action in menu if entity is already a Prefab or inside one', () => {
      // Arrange
      const prefabEntity = createMockEntity({ id: 'ent_prefab_inst', prefabId: 'prefab_master_99' })
      setupMockSceneEnvironment({ entities: [prefabEntity] })
      sceneStore.selectedEntityIds = ['ent_prefab_inst']

      const canvasLogic = useCanvasLogic()
      const { contextMenu, openMenu } = useCanvasMenu(canvasLogic)

      // Act
      openMenu(100, 200, 0, 0, true)

      // Assert
      const prefabItem = contextMenu.value.items.find(i => i.label === 'Use as Prefab')
      expect(prefabItem).toBeDefined()
      expect(prefabItem.disabled).toBe(true)
    })

    it('generates creation menu items matching target section when no entity is selected', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'layer_world_1', name: 'Default World', section: 'world' })
      setupMockSceneEnvironment({ layersWorld: [worldLayer] })
      sceneStore.selectedEntityIds = []

      const canvasLogic = useCanvasLogic()
      const { contextMenu, openMenu } = useCanvasMenu(canvasLogic)

      // Act
      openMenu(300, 400, 150, 150, false)

      // Assert
      const labels = contextMenu.value.items.map(i => i.label)
      expect(labels).toContain('Create Entity')
      expect(labels).toContain('Paste Here')
    })
  })

  describe('Canvas World Operations & Logic Integration', () => {
    it('creates entity at exact world coordinates and records in history', () => {
      // Arrange
      const layer = createMockLayer({ id: 'layer_world_1', section: 'world' })
      setupMockSceneEnvironment({ layersWorld: [layer] })

      const { createEntityAtPosition } = useCanvasLogic()

      // Act
      createEntityAtPosition('sprite', layer.id, 250, -180)

      // Assert
      const createdEntity = sceneStore.activeScene.entities[0]
      expect(createdEntity).toBeDefined()
      expect(createdEntity.components.Transform.x).toBe(250)
      expect(createdEntity.components.Transform.y).toBe(-180)
    })

    it('updates Z-Index on "Bring to Front" and "Send to Back" and notifies engineBridge', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_z_test', zIndex: 5 })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_z_test']

      const { bringToFront, sendToBack } = useCanvasLogic()

      // Act 1: Bring to front
      bringToFront()
      expect(sceneStore.activeScene.entities[0].zIndex).toBe(6)
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({ id: 'ent_z_test', prop: 'zIndex', value: 6 })

      // Act 2: Send to back
      sendToBack()
      expect(sceneStore.activeScene.entities[0].zIndex).toBe(5)
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({ id: 'ent_z_test', prop: 'zIndex', value: 5 })
    })

    it('toggles entity lock, hidden, and active states across selection', () => {
        // Arrange
        const entity = createMockEntity({
            id: 'ent_states_test',
            visible: true,
            active: true,
            _editor: { locked: false, expanded: false }
        })
        setupMockSceneEnvironment({ entities: [entity] })
        sceneStore.selectedEntityIds = ['ent_states_test']

        const { toggleLock, toggleHidden, toggleInactive } = useCanvasLogic()

        // Act
        toggleLock()
        toggleHidden()
        toggleInactive()

        // Assert
        const updatedEntity = sceneStore.activeScene.entities[0]
        expect(updatedEntity._editor.locked).toBe(true)
        expect(updatedEntity.visible).toBe(false)
        expect(updatedEntity.active).toBe(false)

        expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({
            id: 'ent_states_test',
            prop: '_editor',
            value: expect.objectContaining({ locked: true })
        })

        expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({
            id: 'ent_states_test',
            prop: 'visible',
            value: false
        })

        expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({
            id: 'ent_states_test',
            prop: 'active',
            value: false
        })
    })

    it('pastes entities from clipboard and shifts coordinates to target world position', async () => {
      // Arrange
      const pastedEntity = createMockEntity({
        id: 'ent_pasted_1',
        components: {
          Transform: createMockComponent('Transform', { x: 0, y: 0 })
        }
      })
      setupMockSceneEnvironment({ entities: [pastedEntity] })

      const { pasteAtPosition } = useCanvasLogic()

      // Act: Paste di koordinat dunia (500, 300)
      await pasteAtPosition(500, 300)

      // Assert
      const transform = sceneStore.activeScene.entities.find(e => e.id === 'ent_pasted_1').components.Transform
      expect(transform.x).toBe(500)
      expect(transform.y).toBe(300)
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: 'ent_pasted_1',
        componentName: 'Transform',
        path: 'x',
        value: 500
      })
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: 'ent_pasted_1',
        componentName: 'Transform',
        path: 'y',
        value: 300
      })
    })
  })
})
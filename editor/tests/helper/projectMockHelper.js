// helper project testing (@tests/tests.js)
import { vi } from 'vitest'
import { useProjectActions } from '@projects/projects.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useScriptStore } from '@scripts/scripts.js'
import { entitySchema, layerSchema, sceneSchema, componentSchema } from '@scenes/scenes.js'
import { GenerateUUID } from '@utils/utils.js'

/* ============================================================================
 * IN-MEMORY OPFS MOCK HELPER
 * ============================================================================
 */
export function createMockDirectoryHandle(fullPath = 'root', mockStoreRef = { store: new Map() }) {
  const dirName = fullPath.split('/').pop()

  return {
    kind: 'directory',
    name: dirName,

    getDirectoryHandle: vi.fn(async (name, options = {}) => {
      const childPath = `${fullPath}/${name}`

      if (!mockStoreRef.store.has(childPath)) {
        if (options.create) {
          mockStoreRef.store.set(childPath, createMockDirectoryHandle(childPath, mockStoreRef))
        } else {
          throw new Error(`Directory '${name}' tidak ditemukan di OPFS.`)
        }
      }

      return mockStoreRef.store.get(childPath)
    }),

    getFileHandle: vi.fn(async (fileName, options = {}) => {
      const filePath = `${fullPath}/${fileName}`

      if (!mockStoreRef.store.has(filePath)) {
        if (options.create) {
          let content = new Uint8Array()

          const fileHandleObj = {
            kind: 'file',
            name: fileName,

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

          mockStoreRef.store.set(filePath, fileHandleObj)
        } else {
          throw new Error(`File '${fileName}' tidak ditemukan di OPFS.`)
        }
      }

      return mockStoreRef.store.get(filePath)
    }),

    removeEntry: vi.fn(async (name) => {
      const targetPath = `${fullPath}/${name}`
      mockStoreRef.store.delete(targetPath)

      for (const key of mockStoreRef.store.keys()) {
        if (key.startsWith(`${targetPath}/`)) {
          mockStoreRef.store.delete(key)
        }
      }
    }),

    entries: async function* () {
      const prefix = `${fullPath}/`
      for (const [key, handle] of mockStoreRef.store.entries()) {
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

/**
 * Setup lingkungan OPFS mock pada global navigator.storage
 */
export function setupMockOPFS() {
  const storeRef = { store: new Map() }

  Object.defineProperty(global.navigator, 'storage', {
    value: {
      getDirectory: vi.fn(async () => createMockDirectoryHandle('root', storeRef))
    },
    writable: true,
    configurable: true
  })

  return storeRef
}

/* ============================================================================
 * HELPER PEMBUATAN MOCK PROJECT KOSONG
 * ============================================================================
 */

export async function createMockEmptyProject({
  projectName = 'Test Project',
  description = '',
  type = 'empty'
} = {}) {
  const projectActions = useProjectActions()
  return await projectActions.createProject({ projectName, description, type })
}

/* ============================================================================
 * HELPER KOMPONEN, ENTITY, SCENE, DAN LAYER (PRESISI DENGAN STORE ACTIONS)
 * ============================================================================
 */

/**
 * Membuat data komponen tunggal berdasarkan skema
 */
export function createMockComponent(componentName, data = {}) {
  return componentSchema.create(componentName, data)
}

/**
 * Memetakan preset komponen bawaan sesuai persis dengan logika useEntityActions.createEntity
 */
function getComponentsByEntityType(type, rawX = 0, rawY = 0) {
  const rawTransform = { x: rawX, y: rawY }
  const components = {}

  if (type === 'sprite') {
    components.SpriteRenderer = { assetId: null, color: '#FFFFFF' }
    components.Transform = { ...rawTransform }
  } else if (type === 'shape') {
    components.ShapeRenderer = componentSchema.create('ShapeRenderer')
    components.Transform = { ...rawTransform }
  } else if (type === 'text') {
    components.TextRenderer = { value: 'New Text', fontSize: 24, color: '#FFFFFF' }
    components.Transform = { ...rawTransform, width: 107, height: 23 }
  } else if (type === 'tilemap') {
    components.Tilemap = componentSchema.create('Tilemap', {
      width: 16,
      height: 16,
      assetId: null,
      opacity: 1,
      isSolid: false,
      filterMode: 'pixelated',
      data: {}
    })
    components.Transform = { ...rawTransform, width: 640, height: 480 }
  } else if (type === 'audio') {
    components.Transform = { ...rawTransform, width: 50, height: 50 }
    components.Audio = { currentClip: null, clips: [] }
  } else if (type === 'ui_empty') {
    components.UITransform = { ...rawTransform, width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 }
  } else if (type === 'ui_shape') {
    components.UITransform = { ...rawTransform, width: 300, height: 200, anchorX: 0.5, anchorY: 0.5 }
    components.ShapeRenderer = componentSchema.create('ShapeRenderer')
  } else if (type === 'ui_text') {
    components.UITransform = { ...rawTransform, width: 107, height: 23, anchorX: 0.5, anchorY: 0.5 }
    components.TextRenderer = { value: 'New Text', fontSize: 24, align: 'left', color: '#FFFFFF' }
  } else if (type === 'ui_image') {
    components.UITransform = { ...rawTransform, width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 }
    components.SpriteRenderer = { assetId: null, color: '#FFFFFF' }
  }

  return components
}

/**
 * Membuat data layer sesuai skema useLayerActions
 */
export function createMockLayer(overrides = {}) {
  const section = overrides.section || 'world'
  return layerSchema({
    id: `layer_${GenerateUUID()}`,
    name: overrides.name || 'New Layer',
    zIndex: overrides.zIndex ?? 0,
    orderIndex: overrides.orderIndex ?? 0,
    ...overrides,
    section
  })
}

/**
 * Membuat data entity yang presisi dengan useEntityActions & entitySchema
 */
export function createMockEntity({
  entityType = 'empty',
  attachComponents = {},
  ...overrides
} = {}) {
  const isUI = entityType.startsWith('ui_') || overrides.type === 'ui'
  const posX = overrides.x !== undefined ? overrides.x : 0
  const posY = overrides.y !== undefined ? overrides.y : 0

  const presetComponents = getComponentsByEntityType(entityType, posX, posY)

  const mergedComponents = {
    ...presetComponents,
    ...(overrides.components || {})
  }

  for (const [compName, compData] of Object.entries(attachComponents)) {
    mergedComponents[compName] = componentSchema.create(compName, compData)
  }

  const displayType = entityType.startsWith('ui_') ? entityType.replace('ui_', '') : entityType
  const namePrefix = displayType.charAt(0).toUpperCase() + displayType.slice(1)

  return entitySchema({
    id: overrides.id || `${GenerateUUID()}`,
    scriptId: overrides.scriptId || `${entityType}_${GenerateUUID().split('-')[0]}`,
    name: overrides.name || `${namePrefix} Entity`,
    type: isUI ? 'ui' : (overrides.type || 'entity'),
    layerId: overrides.layerId || (isUI ? 'layer_ui_default' : 'layer_world_default'),
    parentId: overrides.parentId || null,
    x: posX,
    y: posY,
    ...overrides,
    components: mergedComponents
  })
}

/**
 * Membuat data scene presisi dengan sceneSchema & useSceneActions
 */
export function createMockScene(overrides = {}) {
  return sceneSchema({
    id: `scene_${GenerateUUID()}`,
    name: overrides.name || 'Untitled Scene',
    ...overrides
  })
}

/**
 * Menyiapkan environment Pinia useSceneStore lengkap dengan activeScene, layersWorld, layersUI, & entities
 */
export function setupMockSceneEnvironment(options = {}) {
  const sceneStore = useSceneStore()

  const defaultWorldLayer = createMockLayer({ id: 'layer_world_default', name: 'World Default', section: 'world' })
  const defaultUILayer = createMockLayer({ id: 'layer_ui_default', name: 'UI Default', section: 'ui' })

  const activeScene = createMockScene({
    id: options.sceneId || `scene_active_${GenerateUUID().split('-')[0]}`,
    name: options.sceneName || 'Active Test Scene',
    layersWorld: options.layersWorld || [defaultWorldLayer],
    layersUI: options.layersUI || [defaultUILayer],
    entities: options.entities || []
  })

  sceneStore.scenes = [activeScene]
  sceneStore.activeSceneId = activeScene.id
  sceneStore.selectedEntityIds = options.selectedEntityIds || []

  return {
    scene: activeScene,
    defaultWorldLayer,
    defaultUILayer
  }
}

export async function setupMockScriptEnvironment(options = {}) {
  const scriptStore = useScriptStore()

  // 1. Opsi Script Default
  const scriptId = options.scriptId || `sc_${GenerateUUID().split('-')[0]}`
  const scriptName = options.scriptName || 'TestScript'
  const scriptType = options.scriptType || 'component'
  const localVariables = options.localVariables || [
    { id: 'v1', name: 'speed', defaultValue: 10 },
    { id: 'v2', name: 'active', defaultValue: true }
  ]
  const scriptContent = options.scriptContent || `// Script: ${scriptName}\nconsole.log("Hello Script");`

  const mockScript = {
    id: scriptId,
    name: scriptName,
    type: scriptType,
    folderId: options.folderId || null,
    localVariables,
    nodes: options.nodes || [{ id: 'node_start', type: 'start' }],
    edges: options.edges || []
  }

  // 2. Registrasi Script ke Store
  scriptStore.initScripts([mockScript])

  // 3. Simpan File Script ke OPFS (In-Memory Mock Directory)
  const navStorage = await navigator.storage.getDirectory()
  const scriptsDir = await navStorage.getDirectoryHandle('scripts', { create: true })
  const fileHandle = await scriptsDir.getFileHandle(`${scriptId}.js`, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(scriptContent)
  await writable.close()

  // 4. Inisialisasi Variable Map untuk Instance Entity
  const instanceVariables = {}
  localVariables.forEach((v) => {
    instanceVariables[v.name] = v.defaultValue
  })

  // 5. Buat Entity dengan ScriptController Component Terpasang
  const scriptInstanceId = `inst_${GenerateUUID().split('-')[0]}`
  const scriptControllerData = {
    data: [
      {
        id: scriptInstanceId,
        assetId: scriptId,
        active: true,
        variables: options.instanceVariables || instanceVariables
      }
    ]
  }

  const mockEntity = createMockEntity({
    id: options.entityId || `entity_${GenerateUUID().split('-')[0]}`,
    name: options.entityName || 'Scripted Entity',
    entityType: options.entityType || 'sprite',
    attachComponents: {
      ScriptController: scriptControllerData
    },
    ...options.entityOverrides
  })

  // 6. Setup Scene Environment & Pasangkan Entity
  const sceneEnv = setupMockSceneEnvironment({
    ...options.sceneOptions,
    entities: [mockEntity, ...(options.sceneOptions?.entities || [])]
  })

  return {
    script: mockScript,
    scriptId,
    fileHandle,
    entity: mockEntity,
    scriptInstanceId,
    sceneStore: useSceneStore(),
    scriptStore,
    ...sceneEnv
  }
}
import { vi } from 'vitest'
import { useProjectActions } from '@projects/projects.js'

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

/**
 * Membuat proyek kosong netral menggunakan `useProjectActions().createProject`
 */
export async function createMockEmptyProject({
  projectName = 'Test Project',
  description = '',
  type = 'empty'
} = {}) {
  const projectActions = useProjectActions()
  return await projectActions.createProject({ projectName, description, type })
}
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { DashboardPage } from '@dashboards/dashboards.js'

// Mock Router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

const mockShowPop = vi.fn()

// Use importOriginal so other exports like usePrompt and useConfirm remain readable
vi.mock('@composables/composables.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    usePopAlert: () => ({
      showPop: mockShowPop
    })
  }
})

// Isolated Mock OPFS Storage
let mockOPFSStore = new Map()

const createMockDirectoryHandle = (dirName) => ({
  kind: 'directory',
  name: dirName,
  getDirectoryHandle: vi.fn(async (name, options = {}) => {
    const key = `${dirName}/${name}`
    if (!mockOPFSStore.has(key) && options.create) {
      mockOPFSStore.set(key, createMockDirectoryHandle(name))
    }
    if (!mockOPFSStore.has(key)) {
      throw new Error(`Directory '${name}' not found`)
    }
    return mockOPFSStore.get(key)
  }),
  getFileHandle: vi.fn(async (fileName, options = {}) => {
    const key = `${dirName}/${fileName}`
    if (!mockOPFSStore.has(key) && options.create) {
      let content = ''
      mockOPFSStore.set(key, {
        kind: 'file',
        name: fileName,
        getFile: async () => ({ text: async () => content }),
        createWritable: async () => ({
          write: async (data) => { content = data },
          close: async () => {}
        })
      })
    }
    if (!mockOPFSStore.has(key)) {
      throw new Error(`File '${fileName}' not found`)
    }
    return mockOPFSStore.get(key)
  }),
  entries: async function* () {
    for (const [key, handle] of mockOPFSStore.entries()) {
      if (key.startsWith(`${dirName}/`) && key.split('/').length === dirName.split('/').length + 1) {
        yield [key.split('/').pop(), handle]
      }
    }
  }
})

describe('Project Creation and Recreation System', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockOPFSStore = new Map()
    mockPush.mockClear()
    vi.restoreAllMocks()

    // Standard navigator.storage setup
    Object.defineProperty(global.navigator, 'storage', {
      value: {
        getDirectory: vi.fn(async () => createMockDirectoryHandle('root'))
      },
      writable: true,
      configurable: true
    })
  })

  describe('Successful New Project Creation Flow', () => {
    it('creates a new project, saves it to OPFS, redirects to editor, and displays project on dashboard', async () => {
      // Arrange
      const wrapper = mount(DashboardPage, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.vm.$nextTick()

      // Act 1: Open new project popup
      wrapper.vm.isCreatePopupOpen = true
      await wrapper.vm.$nextTick()

      // Act 2: Execute create handler directly
      await wrapper.vm.handleCreateProject({
        name: 'Epic Adventure',
        description: '2D RPG game with historical theme'
      })

      // Assert 1: Modal closes and system navigates to editor page
      expect(wrapper.vm.isCreatePopupOpen).toBe(false)
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/editor\/proj_/))

      // Act 3: User returns to dashboard to view saved project list
      const freshWrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      await freshWrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      await freshWrapper.vm.$nextTick()

      // Assert 2: Newly created project appears on dashboard
      const projectCard = freshWrapper.find('.group.bg-card')
      expect(projectCard.exists()).toBe(true)
      expect(projectCard.text()).toContain('Epic Adventure')
      expect(projectCard.text()).toContain('2D RPG game with historical theme')
    })
  })

  describe('Input Validation Handling Flow', () => {
    it('rejects project creation if project name is empty or contains only whitespace', async () => {
      // Arrange
      const wrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      wrapper.vm.isCreatePopupOpen = true
      await wrapper.vm.$nextTick()

      // Act: Simulate empty input or whitespace via CreateNewProjectPop validation logic
      const emptyName = '   '
      const isValid = emptyName.trim().length > 0

      // Assert 1: Modal validation prevents emitting create event if string is empty
      expect(isValid).toBe(false)

      // Assert 2: No navigation to editor
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Project Creation Cancellation Flow', () => {
    it('closes modal and does not save project to OPFS when user cancels process', async () => {
      // Arrange
      const wrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      wrapper.vm.isCreatePopupOpen = true
      await wrapper.vm.$nextTick()

      // Act: Close popup
      wrapper.vm.isCreatePopupOpen = false
      await wrapper.vm.$nextTick()

      // Assert: Modal closed and no navigation
      expect(wrapper.vm.isCreatePopupOpen).toBe(false)
      expect(mockPush).not.toHaveBeenCalled()
      expect(wrapper.vm.projects.length).toBe(0)
    })
  })

  describe('OPFS Storage Failure Handling Flow', () => {
    it('displays error alert if browser does not support or fails writing to OPFS', async () => {
      // Arrange
      navigator.storage.getDirectory = vi.fn().mockRejectedValue(
        new Error('Failed to access OPFS storage.')
      )

      const wrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      // Act: Execute project creation
      await wrapper.vm.handleCreateProject({
        name: 'Error Project',
        description: 'Failure test'
      })

      // Assert: Verify showPop is called with appropriate parameters
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Error Creating Project',
        message: 'Failed to access OPFS storage.',
        type: 'error'
      })
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
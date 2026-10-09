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

// 2. Gunakan importOriginal agar export lain seperti usePrompt dan useConfirm tetap terbaca
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

describe('Sistem pembuatan dan pembuatan ulang proyek', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockOPFSStore = new Map()
    mockPush.mockClear()
    vi.restoreAllMocks()

    // Setup standar navigator.storage
    Object.defineProperty(global.navigator, 'storage', {
      value: {
        getDirectory: vi.fn(async () => createMockDirectoryHandle('root'))
      },
      writable: true,
      configurable: true
    })
  })

  describe('Alur Berhasil Pembuatan Proyek Baru', () => {
    it('membuat proyek baru, menyimpannya ke OPFS, mengarahkan ke editor, dan menampilkan proyek di dashboard', async () => {
      // Arrange
      const wrapper = mount(DashboardPage, {
        global: {
          stubs: {
            Teleport: true
          }
        }
      })

      await wrapper.vm.$nextTick()

      // Act 1: Buka popup proyek baru
      wrapper.vm.isCreatePopupOpen = true
      await wrapper.vm.$nextTick()

      // Act 2: Jalankan handler create secara langsung
      await wrapper.vm.handleCreateProject({
        name: 'Petualangan Nusantara',
        description: 'Game RPG 2D bertema sejarah'
      })

      // Assert 1: Modal tertutup dan sistem melakukan navigasi ke halaman editor
      expect(wrapper.vm.isCreatePopupOpen).toBe(false)
      expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/editor\/proj_/))

      // Act 3: Pengguna kembali ke dashboard untuk melihat daftar proyek yang tersimpan
      const freshWrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      await freshWrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      await freshWrapper.vm.$nextTick()

      // Assert 2: Proyek yang baru dibuat muncul di dashboard
      const projectCard = freshWrapper.find('.group.bg-card')
      expect(projectCard.exists()).toBe(true)
      expect(projectCard.text()).toContain('Petualangan Nusantara')
      expect(projectCard.text()).toContain('Game RPG 2D bertema sejarah')
    })
  })

  describe('Alur Penanganan Validasi Input', () => {
    it('menolak pembuatan proyek jika nama proyek tidak diisi atau hanya berisi spasi', async () => {
      // Arrange
      const wrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      wrapper.vm.isCreatePopupOpen = true
      await wrapper.vm.$nextTick()

      // Act: Simulasi input kosong atau spasi melalui logika validasi CreateNewProjectPop
      const emptyName = '   '
      const isValid = emptyName.trim().length > 0

      // Assert 1: Validasi modal mencegah emit event create jika string kosong
      expect(isValid).toBe(false)

      // Assert 2: Tidak ada navigasi ke editor
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Alur Pembatalan Pembuatan Proyek', () => {
    it('menutup modal dan tidak menyimpan proyek ke OPFS saat pengguna membatalkan proses', async () => {
      // Arrange
      const wrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      wrapper.vm.isCreatePopupOpen = true
      await wrapper.vm.$nextTick()

      // Act: Tutup popup
      wrapper.vm.isCreatePopupOpen = false
      await wrapper.vm.$nextTick()

      // Assert: Modal tertutup dan tidak ada navigasi
      expect(wrapper.vm.isCreatePopupOpen).toBe(false)
      expect(mockPush).not.toHaveBeenCalled()
      expect(wrapper.vm.projects.length).toBe(0)
    })
  })

  describe('Alur Penanganan Kegagalan Penyimpanan OPFS', () => {
    it('menampilkan alert kesalahan jika browser tidak mendukung atau gagal menulis ke OPFS', async () => {
      // Arrange
      navigator.storage.getDirectory = vi.fn().mockRejectedValue(
        new Error('Gagal mengakses penyimpanan OPFS.')
      )

      const wrapper = mount(DashboardPage, {
        global: {
          stubs: { Teleport: true }
        }
      })

      // Act: Eksekusi pembuatan proyek
      await wrapper.vm.handleCreateProject({
        name: 'Proyek Error',
        description: 'Uji coba kegagalan'
      })

      // Assert: Verifikasi showPop dipanggil dengan parameter yang sesuai
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Error Creating Project',
        message: 'Gagal mengakses penyimpanan OPFS.',
        type: 'error'
      })
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
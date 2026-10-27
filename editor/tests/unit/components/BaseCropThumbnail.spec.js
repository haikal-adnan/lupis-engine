import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCropThumbnail from '@components/display/BaseCropThumbnail.vue'

describe('BaseCropThumbnail Component', () => {
  let originalImage

  beforeEach(() => {
    // Mock global Image to simulate immediate image loading with custom dimensions
    originalImage = globalThis.Image
    globalThis.Image = class {
      constructor() {
        this.naturalWidth = 800
        this.naturalHeight = 800
        this.width = 800
        this.height = 800
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 10)
      }
      set src(val) {
        this._src = val
      }
      get src() {
        return this._src
      }
    }
  })

  it('renders thumbnail trigger and responds to rect and src', async () => {
    const wrapper = mount(BaseCropThumbnail, {
      props: {
        src: 'blob:http://localhost/test-image.png',
        rect: { x: 50, y: 50, w: 200, h: 200 },
        name: 'Test Sprite'
      }
    })

    // Wait for image load
    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    const trigger = wrapper.find('[data-element="crop-thumbnail-trigger"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('data-loaded')).toBe('true')
  })

  it('calculates workspace padding: 800x800 image with 100px pad becomes 1000x1000 workspace', async () => {
    const wrapper = mount(BaseCropThumbnail, {
      props: {
        src: 'blob:http://localhost/test-image.png',
        rect: { x: 0, y: 0, w: 800, h: 800 },
        padding: 100
      }
    })

    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.imgMeta.w).toBe(800)
    expect(wrapper.vm.imgMeta.h).toBe(800)
    expect(wrapper.vm.pad).toBe(100)
    expect(wrapper.vm.workspaceWidth).toBe(1000)
    expect(wrapper.vm.workspaceHeight).toBe(1000)
  })

  it('clamps crop boundaries so crop rectangle CANNOT exceed image boundaries (800x800)', async () => {
    const wrapper = mount(BaseCropThumbnail, {
      props: {
        src: 'blob:http://localhost/test-image.png',
        rect: { x: 100, y: 100, w: 400, h: 400 }
      }
    })

    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    // Test inputX clamping
    wrapper.vm.inputX = 750 // If width is 400, X cannot be 750 (max is 800 - 400 = 400)
    expect(wrapper.vm.localRect.x).toBe(400)

    // Test inputW clamping
    wrapper.vm.inputX = 0
    wrapper.vm.inputW = 1200 // Max is 800
    expect(wrapper.vm.localRect.w).toBe(800)

    // Test negative clamp
    wrapper.vm.inputX = -50
    expect(wrapper.vm.localRect.x).toBe(0)
  })

  it('opens modal and emits update:rect on resetToFullImage', async () => {
    const wrapper = mount(BaseCropThumbnail, {
      props: {
        src: 'blob:http://localhost/test-image.png',
        rect: { x: 50, y: 50, w: 100, h: 100 }
      }
    })

    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    // Open modal
    wrapper.vm.openModal()
    expect(wrapper.vm.isOpen).toBe(true)

    // Reset to full
    wrapper.vm.resetToFullImage()
    expect(wrapper.vm.localRect.x).toBe(0)
    expect(wrapper.vm.localRect.y).toBe(0)
    expect(wrapper.vm.localRect.w).toBe(800)
    expect(wrapper.vm.localRect.h).toBe(800)

    expect(wrapper.emitted('update:rect')).toBeTruthy()
    const lastEmit = wrapper.emitted('update:rect').pop()
    expect(lastEmit[0]).toEqual({ x: 0, y: 0, w: 800, h: 800 })
  })

  it('supports handle dragging and clamping within [0, 0, imgW, imgH]', async () => {
    const wrapper = mount(BaseCropThumbnail, {
      props: {
        src: 'blob:http://localhost/test-image.png',
        rect: { x: 100, y: 100, w: 200, h: 200 }
      }
    })

    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    wrapper.vm.openModal()
    wrapper.vm.zoom = 1

    // Simulate drag start on 'e' (east/right handle)
    wrapper.vm.startDrag('e', { clientX: 300, clientY: 200, stopPropagation: () => {} })
    expect(wrapper.vm.activeDrag).toBeTruthy()

    // Move mouse 50px to the right
    wrapper.vm.handleGlobalMouseMove({ clientX: 350, clientY: 200 })
    expect(wrapper.vm.localRect.w).toBe(250) // 200 + 50 = 250

    // End drag (flushes pending RAF notification)
    wrapper.vm.handleGlobalMouseUp()
    expect(wrapper.vm.activeDrag).toBeNull()

    expect(wrapper.emitted('update:rect')).toBeTruthy()
    const lastEmit = wrapper.emitted('update:rect').pop()
    expect(lastEmit[0].w).toBe(250)
  })
})

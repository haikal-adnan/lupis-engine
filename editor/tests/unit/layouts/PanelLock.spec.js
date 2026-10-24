import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LeftPanel from '@/layouts/parts/LeftPanel.vue'
import RightPanel from '@/layouts/parts/RightPanel.vue'
import EditorSettingsModal from '@settings/projects/layouts/EditorSettingsModal.vue'

describe('Panel Locking and Modal Scroll Behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  it('LeftPanel applies overflow-hidden and pointer-events-none when locked is true', () => {
    const wrapper = mount(LeftPanel, {
      props: {
        title: 'Hierarchy',
        locked: true
      },
      slots: {
        default: '<div class="content">Hierarchy Items</div>'
      }
    })

    const scrollContainer = wrapper.find('.scrollbar-thin')
    expect(scrollContainer.exists()).toBe(true)
    expect(scrollContainer.classes()).toContain('overflow-hidden')
    expect(scrollContainer.classes()).toContain('pointer-events-none')
    expect(scrollContainer.classes()).not.toContain('overflow-y-auto')
  })

  it('LeftPanel allows overflow-y-auto when locked is false', () => {
    const wrapper = mount(LeftPanel, {
      props: {
        title: 'Hierarchy',
        locked: false
      }
    })

    const scrollContainer = wrapper.find('.scrollbar-thin')
    expect(scrollContainer.classes()).toContain('overflow-y-auto')
    expect(scrollContainer.classes()).not.toContain('overflow-hidden')
  })

  it('RightPanel applies overflow-hidden and pointer-events-none when locked is true', () => {
    const wrapper = mount(RightPanel, {
      props: {
        title: 'Inspector',
        locked: true
      }
    })

    const scrollContainer = wrapper.find('.scrollbar-thin')
    expect(scrollContainer.exists()).toBe(true)
    expect(scrollContainer.classes()).toContain('overflow-hidden')
    expect(scrollContainer.classes()).toContain('pointer-events-none')
    expect(scrollContainer.classes()).not.toContain('overflow-y-auto')
  })

  it('RightPanel allows overflow-y-auto when locked is false', () => {
    const wrapper = mount(RightPanel, {
      props: {
        title: 'Inspector',
        locked: false
      }
    })

    const scrollContainer = wrapper.find('.scrollbar-thin')
    expect(scrollContainer.classes()).toContain('overflow-y-auto')
    expect(scrollContainer.classes()).not.toContain('overflow-hidden')
  })

  it('EditorSettingsModal contains overscroll-none on backdrop and overscroll-contain on modal card', () => {
    mount(EditorSettingsModal, {
      props: {
        isOpen: true
      },
      attachTo: document.body
    })

    const backdrop = document.body.querySelector('[data-testid="editor-settings-modal"]')
    expect(backdrop).not.toBeNull()
    expect(backdrop.classList.contains('overscroll-none')).toBe(true)

    const modalCard = backdrop.querySelector('.max-w-\\[1100px\\]')
    expect(modalCard).not.toBeNull()
    expect(modalCard.classList.contains('overscroll-contain')).toBe(true)
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/buttons/BaseButton.vue'

describe('BaseButton Component', () => {
  let wrapper = null

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  it('renders default slot content correctly', () => {
    wrapper = mount(BaseButton, {
      slots: {
        default: '<span>Click Me</span>'
      }
    })

    expect(wrapper.text()).toContain('Click Me')
    expect(wrapper.attributes('data-component')).toBe('base-button')
    expect(wrapper.classes()).toContain('border')
  })

  it('applies inactive ghost styles with border-border when inactive and ghost is true', () => {
    wrapper = mount(BaseButton, {
      props: {
        active: false,
        ghost: true
      }
    })

    expect(wrapper.classes()).toContain('border-border')
    expect(wrapper.classes()).toContain('bg-transparent')
    expect(wrapper.classes()).toContain('hover:bg-accent')
    expect(wrapper.classes()).not.toContain('border-transparent')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
  })

  it('applies inactive styles with border-border when variant is ghost or outline', () => {
    wrapper = mount(BaseButton, {
      props: {
        variant: 'ghost',
        active: false
      }
    })

    expect(wrapper.classes()).toContain('border-border')
    expect(wrapper.classes()).toContain('bg-transparent')
  })

  it('applies active styling when active is true', () => {
    wrapper = mount(BaseButton, {
      props: {
        active: true,
        ghost: true
      }
    })

    expect(wrapper.classes()).toContain('border-blue-500/40')
    expect(wrapper.classes()).toContain('text-blue-600')
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('toggles modelValue state on click when model is bound', async () => {
    const Component = {
      template: `<BaseButton v-model="isActive" ghost>Toggle</BaseButton>`,
      components: { BaseButton },
      data() {
        return { isActive: false }
      }
    }

    wrapper = mount(Component)
    const button = wrapper.find('button')

    expect(button.classes()).toContain('border-border')
    expect(wrapper.vm.isActive).toBe(false)

    await button.trigger('click')

    expect(wrapper.vm.isActive).toBe(true)
    expect(button.classes()).toContain('border-blue-500/40')
  })

  it('renders tooltip element when tooltip prop is provided', () => {
    wrapper = mount(BaseButton, {
      props: {
        tooltip: 'Helpful Tooltip'
      }
    })

    const tooltip = wrapper.find('[data-element="button-tooltip"]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toBe('Helpful Tooltip')
  })

  it('[Bad Path] does not toggle modelValue or trigger actions when disabled', async () => {
    const Component = {
      template: `<BaseButton v-model="isActive" :disabled="true">Disabled</BaseButton>`,
      components: { BaseButton },
      data() {
        return { isActive: false }
      }
    }

    wrapper = mount(Component)
    const button = wrapper.find('button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-disabled')).toBe('true')

    await button.trigger('click')

    expect(wrapper.vm.isActive).toBe(false)
  })
})

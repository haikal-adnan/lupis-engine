import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MainLayout from '@/layouts/MainLayout.vue'
import { useTheme } from '@composables/composables.js'

// Mock vue-router
const mockRoute = {
  name: 'Dashboard',
  fullPath: '/dashboard'
}
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
  },
  RouterView: {
    name: 'RouterView',
    template: '<div class="router-view-stub"></div>'
  }
}))

describe('MainLayout Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders Dashboard and Documentation navigation without Settings', () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          },
          'router-view': true
        }
      }
    })

    const links = wrapper.findAll('a')
    const hrefs = links.map(link => link.attributes('href'))
    
    // Checks that dashboard and docs links exist
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/docs')
    
    // Checks that settings link is removed
    expect(hrefs).not.toContain('/settings')
    expect(wrapper.text()).not.toContain('Settings')
  })

  it('provides a theme toggle icon button that switches theme between light and dark', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          'router-link': true,
          'router-view': true
        }
      }
    })

    const themeButton = wrapper.find('button[aria-label*="mode"]')
    expect(themeButton.exists()).toBe(true)

    const { isDark } = useTheme()
    const initialIsDark = isDark.value

    await themeButton.trigger('click')
    expect(isDark.value).toBe(!initialIsDark)

    await themeButton.trigger('click')
    expect(isDark.value).toBe(initialIsDark)
  })
})

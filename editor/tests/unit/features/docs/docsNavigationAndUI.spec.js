import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import router from '@/app/router.js';
import DocsSidebarRight from '@/features/docs/layouts/DocsSidebarRight.vue';
import DocsSidebarLeft from '@/features/docs/layouts/DocsSidebarLeft.vue';

describe('Docs Navigation and UI Components', () => {
  describe('1. Router Docs URL Language Contract', () => {
    beforeEach(async () => {
      await router.push('/');
    });

    it('redirects /docs to /docs/en/getting_started/introduction by default', async () => {
      await router.push('/docs');
      expect(router.currentRoute.value.fullPath).toBe('/docs/en/getting_started/introduction');
    });

    it('redirects /docs/id to /docs/id/getting_started/introduction', async () => {
      await router.push('/docs/id');
      expect(router.currentRoute.value.fullPath).toBe('/docs/id/getting_started/introduction');
    });

    it('redirects /docs/en to /docs/en/getting_started/introduction', async () => {
      await router.push('/docs/en');
      expect(router.currentRoute.value.fullPath).toBe('/docs/en/getting_started/introduction');
    });

    it('resolves /docs/id/components/physics_body with lang="id" and docPath', async () => {
      await router.push('/docs/id/components/physics_body');
      expect(router.currentRoute.value.name).toBe('Docs');
      expect(router.currentRoute.value.params.lang).toBe('id');
      const docPath = Array.isArray(router.currentRoute.value.params.docPath)
        ? router.currentRoute.value.params.docPath.join('/')
        : router.currentRoute.value.params.docPath;
      expect(docPath).toBe('components/physics_body');
    });

    it('resolves /docs/en/components/physics_body with lang="en" and docPath', async () => {
      await router.push('/docs/en/components/physics_body');
      expect(router.currentRoute.value.name).toBe('Docs');
      expect(router.currentRoute.value.params.lang).toBe('en');
      const docPath = Array.isArray(router.currentRoute.value.params.docPath)
        ? router.currentRoute.value.params.docPath.join('/')
        : router.currentRoute.value.params.docPath;
      expect(docPath).toBe('components/physics_body');
    });

    it('redirects legacy path without language prefix /docs/components/physics_body to /docs/en/components/physics_body', async () => {
      await router.push('/docs/components/physics_body');
      expect(router.currentRoute.value.fullPath).toBe('/docs/en/components/physics_body');
    });
  });

  describe('2. DocsSidebarRight Scrollable & Language Support', () => {
    const mockHeadings = [
      { id: 'overview', text: 'Overview', level: 2 },
      { id: 'add-the-component', text: 'Add the component', level: 2 },
      { id: 'properties', text: 'Properties', level: 2 }
    ];

    it('has overflow-y-auto and custom-scrollbar classes for vertical scrolling', () => {
      const wrapper = mount(DocsSidebarRight, {
        props: {
          headings: mockHeadings,
          activeId: 'overview',
          currentLang: 'en'
        }
      });

      const aside = wrapper.find('aside');
      expect(aside.exists()).toBe(true);
      expect(aside.classes()).toContain('overflow-y-auto');
      expect(aside.classes()).toContain('custom-scrollbar');
    });

    it('renders "On this page" when language is English', () => {
      const wrapper = mount(DocsSidebarRight, {
        props: {
          headings: mockHeadings,
          activeId: 'overview',
          currentLang: 'en'
        }
      });

      expect(wrapper.text()).toContain('On this page');
    });

    it('renders "Di halaman ini" when language is Indonesian', () => {
      const wrapper = mount(DocsSidebarRight, {
        props: {
          headings: mockHeadings,
          activeId: 'overview',
          currentLang: 'id'
        }
      });

      expect(wrapper.text()).toContain('Di halaman ini');
    });

    it('emits scrollTo event when a heading item is clicked', async () => {
      const wrapper = mount(DocsSidebarRight, {
        props: {
          headings: mockHeadings,
          activeId: 'overview',
          currentLang: 'en'
        }
      });

      const buttons = wrapper.findAll('button');
      expect(buttons).toHaveLength(3);
      await buttons[1].trigger('click');

      expect(wrapper.emitted('scrollTo')).toBeTruthy();
      expect(wrapper.emitted('scrollTo')[0]).toEqual(['add-the-component']);
    });
  });

  describe('3. DocsSidebarLeft Atomic BaseSelect Language Selector', () => {
    const mockNavItems = [
      {
        title: 'Getting Started',
        links: [{ id: 'getting_started/introduction', name: 'Introduction' }]
      }
    ];

    it('uses BaseSelect component for language selection', () => {
      const wrapper = mount(DocsSidebarLeft, {
        props: {
          navItems: mockNavItems,
          currentDocId: 'getting_started/introduction',
          currentLang: 'en'
        }
      });

      const baseSelect = wrapper.findComponent({ name: 'BaseSelect' });
      expect(baseSelect.exists()).toBe(true);
    });

    it('emits changeLanguage when a new language is selected', async () => {
      const wrapper = mount(DocsSidebarLeft, {
        props: {
          navItems: mockNavItems,
          currentDocId: 'getting_started/introduction',
          currentLang: 'en'
        }
      });

      const baseSelect = wrapper.findComponent({ name: 'BaseSelect' });
      await baseSelect.vm.$emit('update:modelValue', 'id');

      expect(wrapper.emitted('changeLanguage')).toBeTruthy();
      expect(wrapper.emitted('changeLanguage')[0]).toEqual(['id']);
    });
  });
});

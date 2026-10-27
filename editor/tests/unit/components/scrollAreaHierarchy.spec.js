import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ScrollArea from '@components/overlay/ScrollArea.vue';

describe('ScrollArea Component & Shift+Wheel Horizontal Scrolling', () => {
  it('supports orientation="both" with bidirectional overflow classes', () => {
    const wrapper = mount(ScrollArea, {
      props: {
        orientation: 'both'
      },
      slots: {
        default: '<div style="width: 800px; height: 1200px;">Long Content</div>'
      }
    });

    const viewport = wrapper.find('[data-testid="scroll-viewport"]');
    expect(viewport.classes()).toContain('overflow-y-auto');
    expect(viewport.classes()).toContain('overflow-x-auto');

    const content = viewport.find('div');
    expect(content.classes()).toContain('min-w-max');
    expect(content.classes()).toContain('min-h-full');
    expect(content.classes()).toContain('w-full');
  });

  it('supports orientation="vertical" with vertical-only overflow classes', () => {
    const wrapper = mount(ScrollArea, {
      props: {
        orientation: 'vertical'
      }
    });

    const viewport = wrapper.find('[data-testid="scroll-viewport"]');
    expect(viewport.classes()).toContain('overflow-y-auto');
    expect(viewport.classes()).toContain('overflow-x-hidden');
  });

  it('supports orientation="horizontal" with horizontal-only overflow classes', () => {
    const wrapper = mount(ScrollArea, {
      props: {
        orientation: 'horizontal'
      }
    });

    const viewport = wrapper.find('[data-testid="scroll-viewport"]');
    expect(viewport.classes()).toContain('overflow-x-auto');
    expect(viewport.classes()).toContain('overflow-y-hidden');
  });

  it('scrolls horizontally and calls preventDefault when holding Shift with mouse wheel', async () => {
    const wrapper = mount(ScrollArea, {
      props: {
        orientation: 'both'
      },
      slots: {
        default: '<div style="width: 800px;">Wide Child</div>'
      }
    });

    const viewportEl = wrapper.find('[data-testid="scroll-viewport"]').element;

    // Mock dimensions indicating horizontal overflow
    Object.defineProperty(viewportEl, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(viewportEl, 'scrollWidth', { value: 800, configurable: true });
    let scrollLeftVal = 0;
    Object.defineProperty(viewportEl, 'scrollLeft', {
      get: () => scrollLeftVal,
      set: (val) => { scrollLeftVal = val; },
      configurable: true
    });

    const preventDefault = vi.fn();
    const event = {
      deltaY: 75,
      deltaX: 0,
      shiftKey: true,
      preventDefault
    };

    // Dispatch Shift + Wheel event
    await wrapper.find('[data-testid="scroll-viewport"]').trigger('wheel', event);

    expect(scrollLeftVal).toBe(75);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('does not scroll horizontally when wheeling without Shift key', async () => {
    const wrapper = mount(ScrollArea, {
      props: {
        orientation: 'both'
      }
    });

    const viewportEl = wrapper.find('[data-testid="scroll-viewport"]').element;
    Object.defineProperty(viewportEl, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(viewportEl, 'scrollWidth', { value: 800, configurable: true });
    viewportEl.scrollLeft = 0;

    const preventDefault = vi.fn();
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      shiftKey: false
    });
    wheelEvent.preventDefault = preventDefault;

    await wrapper.find('[data-testid="scroll-viewport"]').trigger('wheel', wheelEvent);

    expect(viewportEl.scrollLeft).toBe(0);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('does not scroll or prevent default when there is no horizontal overflow', async () => {
    const wrapper = mount(ScrollArea, {
      props: {
        orientation: 'both'
      }
    });

    const viewportEl = wrapper.find('[data-testid="scroll-viewport"]').element;
    Object.defineProperty(viewportEl, 'clientWidth', { value: 500, configurable: true });
    Object.defineProperty(viewportEl, 'scrollWidth', { value: 300, configurable: true });
    viewportEl.scrollLeft = 0;

    const preventDefault = vi.fn();
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      shiftKey: true
    });
    wheelEvent.preventDefault = preventDefault;

    await wrapper.find('[data-testid="scroll-viewport"]').trigger('wheel', wheelEvent);

    expect(viewportEl.scrollLeft).toBe(0);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

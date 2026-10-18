import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import BaseNumber from '@/components/inputs/BaseNumber.vue'

function mountWithModel(initialVal, props = {}) {
  return mount({
    template: `<BaseNumber v-model="val" v-bind="extraProps" />`,
    components: { BaseNumber },
    data() {
      return { val: initialVal, extraProps: props }
    }
  })
}

describe('BaseNumber Component', () => {
  it('scrubs in whole integer steps (1, 2, 3, 4, 5) when step is 1 even if precision is 2', async () => {
    const wrapper = mountWithModel(0, {
      prefix: 'X',
      step: 1,
      precision: 2
    })

    const scrubHandle = wrapper.find('[data-part="scrub-handle"]')
    expect(scrubHandle.exists()).toBe(true)

    // Start scrubbing from clientX = 100
    await scrubHandle.trigger('mousedown', { clientX: 100 })

    // Move mouse +5px (1 step = 1)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 105 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(1)
    expect(wrapper.find('input').element.value).toBe('1')

    // Move mouse +10px (2 steps = 2)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(2)
    expect(wrapper.find('input').element.value).toBe('2')

    // Move mouse +15px (3 steps = 3)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 115 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(3)
    expect(wrapper.find('input').element.value).toBe('3')

    // Move mouse +20px (4 steps = 4)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(4)
    expect(wrapper.find('input').element.value).toBe('4')

    // Move mouse +25px (5 steps = 5)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 125 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(5)
    expect(wrapper.find('input').element.value).toBe('5')

    // Stop scrub
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    expect(wrapper.vm.val).toBe(5)
    expect(wrapper.find('input').element.value).toBe('5')
  })

  it('scrubs in decimal steps (1.1, 1.2, 1.3) when step is 0.1', async () => {
    const wrapper = mountWithModel(1, {
      prefix: 'X',
      step: 0.1,
      precision: 2
    })

    const scrubHandle = wrapper.find('[data-part="scrub-handle"]')
    await scrubHandle.trigger('mousedown', { clientX: 100 })

    // +5px -> +0.1 => 1.1
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 105 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(1.1)
    expect(wrapper.find('input').element.value).toBe('1.1')

    // +10px -> +0.2 => 1.2
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(1.2)
    expect(wrapper.find('input').element.value).toBe('1.2')

    // +15px -> +0.3 => 1.3
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 115 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(1.3)
    expect(wrapper.find('input').element.value).toBe('1.3')

    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    expect(wrapper.vm.val).toBe(1.3)
  })

  it('allows manual decimal input with precision 2 while step is 1', async () => {
    const wrapper = mountWithModel(0, {
      step: 1,
      precision: 2
    })

    const input = wrapper.find('input')
    await input.setValue('1.25')
    await input.trigger('blur')
    await nextTick()

    expect(wrapper.vm.val).toBe(1.25)
    expect(input.element.value).toBe('1.25')
  })

  it('converts comma input to dot and respects precision', async () => {
    const wrapper = mountWithModel(0, {
      step: 1,
      precision: 2
    })

    const input = wrapper.find('input')
    await input.setValue('3,75')
    await input.trigger('blur')
    await nextTick()

    expect(wrapper.vm.val).toBe(3.75)
    expect(input.element.value).toBe('3.75')
  })

  it('snaps cleanly to integer steps when scrubbing from a decimal initial value with step 1', async () => {
    const wrapper = mountWithModel(1.25, {
      prefix: 'X',
      step: 1,
      precision: 2
    })

    const scrubHandle = wrapper.find('[data-part="scrub-handle"]')
    await scrubHandle.trigger('mousedown', { clientX: 100 })

    // Move +5px (1 step right) -> snaps from 1.25 to 2
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 105 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(2)
    expect(wrapper.find('input').element.value).toBe('2')

    // Move +10px (2 steps right) -> 3
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(3)
    expect(wrapper.find('input').element.value).toBe('3')

    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    expect(wrapper.vm.val).toBe(3)
  })

  it('handles string step prop correctly (e.g. step="1")', async () => {
    const wrapper = mountWithModel(0, {
      prefix: 'X',
      step: '1',
      precision: '2'
    })

    const scrubHandle = wrapper.find('[data-part="scrub-handle"]')
    await scrubHandle.trigger('mousedown', { clientX: 100 })

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 105 }))
    await nextTick()
    expect(wrapper.vm.val).toBe(1)
    expect(wrapper.find('input').element.value).toBe('1')

    window.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('supports Shift and Alt modifiers during scrub', async () => {
    const wrapper = mountWithModel(0, {
      prefix: 'X',
      step: 1,
      precision: 2
    })

    const scrubHandle = wrapper.find('[data-part="scrub-handle"]')

    // Shift modifier (10x step)
    await scrubHandle.trigger('mousedown', { clientX: 100 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 105, shiftKey: true }))
    await nextTick()
    expect(wrapper.vm.val).toBe(10)
    expect(wrapper.find('input').element.value).toBe('10')
    window.dispatchEvent(new MouseEvent('mouseup'))

    // Alt modifier (0.1x step)
    await scrubHandle.trigger('mousedown', { clientX: 100 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 105, altKey: true }))
    await nextTick()
    expect(wrapper.vm.val).toBe(10.1)
    expect(wrapper.find('input').element.value).toBe('10.1')
    window.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('increments and decrements on Arrow Up / Down keys based on step', async () => {
    const wrapper = mountWithModel(5, {
      step: 1,
      precision: 2
    })

    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(wrapper.vm.val).toBe(6)

    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.vm.val).toBe(5)
  })
})

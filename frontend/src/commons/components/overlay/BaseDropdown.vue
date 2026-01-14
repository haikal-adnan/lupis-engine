<template>
  <div 
    class="relative inline-block text-left h-full"
    v-click-outside="close"
  >
    <div @click.stop="toggle" class="h-full cursor-pointer outline-none">
      <slot name="trigger" :isOpen="isOpen"></slot>
    </div>

    <transition name="fade-scale">
      <div
        v-if="isOpen"
        class="absolute z-50 min-w-[240px] origin-top-left rounded-md border border-border bg-popover text-popover-foreground shadow-lg focus:outline-none flex flex-col overflow-hidden py-1"
        :class="[
          align === 'right' ? 'right-0 left-auto origin-top-right mt-1.5 mr-1' : 'left-0 origin-top-left mt-1.5 ml-1'
        ]"
        tabindex="-1"
        @click.stop 
      >
        <slot :close="close" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  align: { type: String, default: 'left' } 
})

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

// Expose fungsi ke parent (TopBar)
defineExpose({ close, open: toggle })

// Custom Directive: v-click-outside
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      // Cek apakah klik terjadi di luar element ini
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
<template>
  <div class="flex flex-col w-full space-y-1.5 relative">
    <label
      v-if="label"
      :for="id"
      class="text-xs font-medium text-muted-foreground select-none"
    >
      {{ label }}
    </label>

    <button
      :id="id"
      type="button"
      @click="toggle"
      v-click-outside="close"
      class="flex items-center justify-between w-full px-3 text-sm text-left transition-all duration-200 border rounded-md bg-background 
             focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
             disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        isOpen ? 'border-primary ring-1 ring-primary' : 'border-input hover:border-muted-foreground/50'
      ]"
      :style="{ height: height, borderRadius: radius }"
    >
      <span class="truncate" :class="!model ? 'text-muted-foreground' : 'text-foreground'">
        {{ selectedLabel || placeholder }}
      </span>
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="text-muted-foreground transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : 'rotate-0'"
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>

    <transition name="fade-scale">
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 overflow-hidden border rounded-md shadow-lg bg-popover border-border text-popover-foreground"
        :style="{ top: '100%' }"
      >
        <ul class="max-h-60 overflow-auto py-1 custom-scrollbar">
          <li
            v-for="option in options"
            :key="option.value"
            @click="select(option)"
            class="relative flex items-center w-full px-3 py-1.5 text-xs cursor-pointer select-none hover:bg-accent hover:text-accent-foreground"
            :class="{ 'bg-accent text-accent-foreground font-medium': model === option.value }"
          >
            {{ option.label }}
            
            <svg 
              v-if="model === option.value"
              xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="absolute right-2 text-primary"
            >
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </li>
          
          <li v-if="options.length === 0" class="px-3 py-2 text-xs text-muted-foreground text-center">
            No options
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, useId } from 'vue'

const props = defineProps({
  label: String,
  options: { type: Array, default: () => [] }, 
  placeholder: { type: String, default: 'Select...' },
  height: { type: String, default: '32px' }, 
  radius: { type: String, default: '0.375rem' }
})

const model = defineModel()
const id = useId()
const isOpen = ref(false)

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === model.value)
  return found ? found.label : null
})

function toggle() { isOpen.value = !isOpen.value }
function close() { isOpen.value = false }

function select(option) {
  model.value = option.value
  close()
}

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
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
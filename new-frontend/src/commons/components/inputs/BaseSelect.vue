<template>
  <div 
    class="flex flex-col w-full space-y-1.5"
    v-click-outside="close"
  >
    <label
      v-if="label"
      :for="id"
      class="text-xs font-medium text-muted-foreground select-none"
    >
      {{ label }}
    </label>

    <div class="relative w-full">
      <button
        :id="id"
        type="button"
        @click="toggle"
        class="flex items-center justify-between w-full px-3 text-sm text-left transition-all duration-200 border rounded-md bg-background 
               focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
               disabled:cursor-not-allowed disabled:opacity-50 select-none"
        :class="[
          isOpen 
            ? 'border-primary ring-1 ring-primary' 
            : 'border-input hover:border-muted-foreground/50',
          !model && !placeholder ? 'text-muted-foreground' : 'text-foreground'
        ]"
        :style="{ height: height, borderRadius: radius }"
      >
        <span class="truncate block" :class="{ 'text-muted-foreground/70': !model }">
          {{ selectedLabel || placeholder }}
        </span>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="text-muted-foreground opacity-50 shrink-0 transition-transform duration-200 ml-2"
          :class="isOpen ? 'rotate-180' : 'rotate-0'"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <transition name="fade-scale">
        <div
          v-if="isOpen"
          class="absolute z-50 w-full mt-1 overflow-hidden border rounded-md shadow-md bg-popover border-border text-popover-foreground"
          :style="{ top: '100%', borderRadius: radius }"
        >
          <ul class="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            <li
              v-for="option in options"
              :key="option.value"
              @click="select(option)"
              class="relative flex items-center w-full px-3 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors
                     hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              :data-selected="model === option.value"
            >
              <span class="truncate pr-4">{{ option.label }}</span>
              
              <span v-if="model === option.value" class="absolute right-2 flex items-center justify-center h-full">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="text-primary"
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </li>
            
            <li v-if="options.length === 0" class="px-3 py-2.5 text-xs text-muted-foreground text-center">
              No options available
            </li>
          </ul>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, useId } from 'vue'

const props = defineProps({
  label: String,
  options: { type: Array, default: () => [] }, 
  placeholder: { type: String, default: 'Select...' },
  height: { type: String, default: '2rem' }, 
  radius: { type: String, default: '0.375rem' }
})

const model = defineModel()
const id = useId()
const isOpen = ref(false)

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === model.value)
  return found ? found.label : null
})

function toggle() { 
  isOpen.value = !isOpen.value 
}

function close() { 
  isOpen.value = false 
}

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
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
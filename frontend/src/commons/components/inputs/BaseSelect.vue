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
              v-if="editable"
              @click="triggerAction"
              class="relative flex items-center w-full px-3 py-2 text-sm cursor-pointer select-none outline-none transition-colors
                     text-primary font-medium hover:bg-primary/10 border-b border-border mb-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
              {{ actionLabel }}
            </li>
            <li
              v-for="option in options"
              :key="option.value"
              @click="select(option)"
              class="relative flex items-center w-full px-3 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors group
                     hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              :data-selected="model === option.value"
            >
              <span class="truncate pr-8 flex-1">{{ option.label }}</span>
              
              <span v-if="model === option.value" class="absolute right-2 flex items-center justify-center h-full text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>

              <button 
                v-if="editable && option.value !== 'untagged'"
                @click.stop="triggerDelete(option)"
                class="absolute right-2 hidden group-hover:flex items-center justify-center h-6 w-6 rounded-sm hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
                title="Delete Tag"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>

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
  radius: { type: String, default: '0.375rem' },
  // Props Baru
  editable: { type: Boolean, default: false },
  actionLabel: { type: String, default: 'Add New...' }
})

const emit = defineEmits(['action', 'delete']) // Event baru
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

// Handler untuk tombol Add (Index 0)
function triggerAction() {
  emit('action');
  close();
}

// Handler untuk tombol Delete
function triggerDelete(option) {
  emit('delete', option.value);
  // Jangan close dropdown agar user bisa hapus multiple jika perlu, 
  // atau close jika ingin strict. Disini saya biarkan open.
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
/* CSS sama seperti sebelumnya */
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
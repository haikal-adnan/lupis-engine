<template>
  <div 
    class="flex flex-col space-y-1.5 relative inline-block w-full"
    v-click-outside="close"
    data-testid="select-container"
  >
    <label
      v-if="label"
      :for="id"
      class="text-xs font-medium text-muted-foreground select-none block text-left"
    >
      {{ label }}
    </label>

    <div class="relative w-full">
      <button
        ref="buttonRef"
        :id="id"
        type="button"
        role="combobox"
        :aria-expanded="isOpen"
        data-testid="select-trigger"
        @click="toggle"
        class="flex items-center justify-between w-full px-3 text-sm transition-all duration-200 border rounded-md bg-background 
               focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
               disabled:cursor-not-allowed disabled:opacity-50 select-none whitespace-nowrap"
        :class="[
          isOpen 
            ? 'border-primary ring-1 ring-primary' 
            : 'border-input hover:border-muted-foreground/50',
          !model && !placeholder ? 'text-muted-foreground' : 'text-foreground'
        ]"
        :style="{ height: height, borderRadius: radius }"
      >
        <span 
          class="truncate block flex-1 text-left" 
          :class="{ 'text-muted-foreground/70': !model }"
        >
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

      <Teleport to="body">
        <transition name="fade-scale">
          <div
            v-if="isOpen"
            ref="dropdownRef"
            role="listbox"
            data-testid="select-dropdown"
            class="fixed z-[9999] overflow-hidden border flex flex-col rounded-md shadow-md bg-popover border-border text-popover-foreground w-max max-w-[300px]"
            :style="[dropdownStyle, { borderRadius: radius }]"
          >
            <ul class="overflow-y-auto py-1 custom-scrollbar">
              
              <li 
                v-if="editable"
                role="option"
                data-testid="select-action-item"
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
                role="option"
                :aria-selected="model === option.value"
                :aria-disabled="option.disabled"
                :data-option-value="option.value"
                data-testid="select-option"
                @click="!option.disabled && select(option)"
                class="relative flex items-center w-full px-3 py-1.5 text-sm select-none outline-none transition-colors group"
                :class="[
                  option.disabled 
                    ? 'opacity-40 cursor-not-allowed bg-muted/20' 
                    : 'cursor-pointer hover:bg-accent hover:text-accent-foreground',
                  model === option.value ? 'bg-accent text-accent-foreground' : ''
                ]"
              >
                <span 
                  class="truncate pr-16 flex-1 block text-left"
                  :class="{ 'italic text-muted-foreground/60': option.disabled }"
                >
                  {{ option.label }}
                </span>
                
                <span v-if="model === option.value" class="absolute right-2 flex items-center justify-center h-full text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>

                <div 
                  v-if="editable && String(option.value).toLowerCase() !== 'untagged' && !option.disabled"
                  class="absolute right-2 hidden group-hover:flex items-center gap-1 z-10"
                >
                  <button 
                    type="button"
                    :aria-label="`Rename ${option.label}`"
                    :data-testid="`rename-option-${option.value}`"
                    @click.stop="triggerRename(option)"
                    class="flex items-center justify-center h-6 w-6 rounded-sm hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                    title="Rename Tag"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                  </button>
                  <button 
                    type="button"
                    :aria-label="`Delete ${option.label}`"
                    :data-testid="`delete-option-${option.value}`"
                    @click.stop="triggerDelete(option)"
                    class="flex items-center justify-center h-6 w-6 rounded-sm hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
                    title="Delete Tag"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </li>
              
              <li v-if="options.length === 0" class="px-3 py-2.5 text-xs text-muted-foreground text-center" data-testid="select-empty">
                No options available
              </li>
            </ul>
          </div>
        </transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, useId, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  label: String,
  options: { type: Array, default: () => [] }, 
  placeholder: { type: String, default: 'Select...' },
  height: { type: String, default: '2rem' }, 
  radius: { type: String, default: '0.375rem' },
  editable: { type: Boolean, default: false },
  actionLabel: { type: String, default: 'Add New...' },
  align: { 
    type: String, 
    default: 'left',
    validator: (value) => ['left', 'center', 'right'].includes(value)
  }
})

const emit = defineEmits(['action', 'delete', 'rename', 'select'])
const model = defineModel()
const id = useId()

const isOpen = ref(false)
const buttonRef = ref(null)
const dropdownRef = ref(null)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === model.value)
  return found ? found.label : null
})

const updatePosition = () => {
  if (!buttonRef.value || !isOpen.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  
  const GAP = 4; 
  const MAX_DROPDOWN_HEIGHT = 240; 
  
  const spaceBelow = window.innerHeight - rect.bottom - GAP;
  const spaceAbove = rect.top - GAP;

  const clampedLeft = Math.max(10, Math.min(rect.left, window.innerWidth - (rect.width || 200) - 10));
  let style = {
    left: `${clampedLeft}px`,
    minWidth: `${rect.width}px` 
  };

  if (spaceBelow < MAX_DROPDOWN_HEIGHT && spaceAbove > spaceBelow) {
    style.top = 'auto';
    style.bottom = `${window.innerHeight - rect.top + GAP}px`;
    style.maxHeight = `${Math.min(MAX_DROPDOWN_HEIGHT, spaceAbove)}px`;
  } else {
    style.top = `${rect.bottom + GAP}px`;
    style.bottom = 'auto';
    style.maxHeight = `${Math.min(MAX_DROPDOWN_HEIGHT, spaceBelow)}px`;
  }

  dropdownStyle.value = style;
}

function toggle() { 
  isOpen.value = !isOpen.value 
  if (isOpen.value) {
    nextTick(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
  } else {
    removeListeners()
  }
}

function close() { 
  if (isOpen.value) {
    isOpen.value = false 
    removeListeners()
  }
}

function removeListeners() {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
}

function select(option) {
  if (option.disabled) return
  model.value = option.value
  emit('select', option.value)
  close()
}

function triggerAction() {
  emit('action');
  close();
}

function triggerDelete(option) {
  emit('delete', option.value);
}

function triggerRename(option) {
  emit('rename', option.value);
}

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      const isInsideMain = el === event.target || el.contains(event.target)
      const isInsideDropdown = dropdownRef.value && (dropdownRef.value === event.target || dropdownRef.value.contains(event.target))
      
      if (!isInsideMain && !isInsideDropdown) {
        binding.value(event)
      }
    }
    document.addEventListener('mousedown', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el.clickOutsideEvent)
  }
}

onUnmounted(() => {
  removeListeners()
})
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
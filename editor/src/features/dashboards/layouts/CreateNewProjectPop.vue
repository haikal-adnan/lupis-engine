<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        data-testid="create-project-modal-overlay"
        @click.self="handleCancel"
      >
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="New Project"
          data-testid="create-project-modal"
          class="w-full max-w-sm bg-background border border-border rounded-lg shadow-xl overflow-hidden transform transition-all"
          :class="{ 'scale-100': isOpen, 'scale-95': !isOpen }"
        >
          <div class="px-4 py-3 border-b border-border bg-muted/30">
            <h3 class="text-sm font-semibold text-foreground" data-testid="modal-title">
              New Project
            </h3>
          </div>

          <div class="px-4 py-4 space-y-4">
            <div class="space-y-1.5">
              <BaseInput 
                ref="inputRef"
                v-model="projectName" 
                label="Project Name"
                placeholder="My Awesome Game"
                data-testid="project-name-input"
                @keydown.enter="handleConfirm"
              />
            </div>

            <div class="space-y-1.5">
              <BaseInput 
                v-model="projectDescription" 
                label="Description"
                placeholder="Brief description of your game..."
                data-testid="project-desc-input"
                @keydown.enter="handleConfirm"
              />
            </div>
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2">
            <button 
              type="button"
              data-testid="cancel-create-project-btn"
              @click="handleCancel"
              class="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent hover:bg-muted border border-border rounded transition-colors"
            >
              Cancel
            </button>
            
            <button 
              type="button"
              data-testid="submit-create-project-btn"
              @click="handleConfirm"
              :disabled="!projectName.trim()"
              class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { BaseInput } from '@components/components.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'create']);

const inputRef = ref(null);
const projectName = ref('');
const projectDescription = ref('');

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    projectName.value = '';
    projectDescription.value = ''; 
    
    await nextTick();
    if (inputRef.value?.$el) {
       const inputEl = inputRef.value.$el.querySelector('input') || inputRef.value.$el;
       inputEl.focus();
    }
  }
});

const handleCancel = () => {
  emit('close');
};

const handleConfirm = () => {
  if (!projectName.value.trim()) return;
  
  emit('create', {
    name: projectName.value.trim(),
    description: projectDescription.value.trim(),
    template: 'Empty Project'
  });
};
</script>
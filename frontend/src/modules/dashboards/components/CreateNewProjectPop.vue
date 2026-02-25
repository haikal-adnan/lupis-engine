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
        @click.self="handleCancel"
      >
        <div 
          class="w-full max-w-sm bg-background border border-border rounded-lg shadow-xl overflow-hidden transform transition-all"
          :class="{ 'scale-100': isOpen, 'scale-95': !isOpen }"
        >
          <div class="px-4 py-3 border-b border-border bg-muted/30">
            <h3 class="text-sm font-semibold text-foreground">
              Create New Project
            </h3>
          </div>

          <div class="px-4 py-4 space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground ml-1">Project Name</label>
              <BaseInput 
                ref="inputRef"
                v-model="projectName" 
                placeholder="My Awesome Game"
                @keyup.enter="handleConfirm"
              />
            </div>

            <div class="space-y-1.5">
                <div class="flex items-center justify-between ml-1">
                    <label class="text-xs font-medium text-muted-foreground">Description</label>
                    <span class="text-[10px] text-muted-foreground/60">Optional</span>
                </div>
                <BaseInput 
                    v-model="projectDescription" 
                    placeholder="A short description of your game..."
                    @keyup.enter="handleConfirm"
                />
                </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground ml-1">Template</label>
              <BaseSelect 
                v-model="selectedTemplate" 
                :options="templateOptions" 
                placeholder="Select Template"
              />
            </div>
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2">
            <button 
              @click="handleCancel"
              class="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent hover:bg-muted border border-border rounded transition-colors"
            >
              Cancel
            </button>
            
            <button 
              @click="handleConfirm"
              :disabled="!projectName.trim()"
              class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'create']);

const inputRef = ref(null);
const projectName = ref('');
const selectedTemplate = ref('Empty Project');
const projectDescription = ref('');

const templateOptions = ref([
  { label: 'Empty Project', value: 'Empty Project' },
  { label: 'Top Down', value: 'Top Down' },
  { label: 'Visual Novel', value: 'Visual Novel' },
  { label: 'Platformer', value: 'Platformer' }
]);

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    projectName.value = '';
    projectDescription.value = ''; 
    selectedTemplate.value = 'Empty Project';
    
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
    template: selectedTemplate.value
  });
};
</script>
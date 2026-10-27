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
              Buat Proyek Baru
            </h3>
          </div>

          <div class="px-4 py-4 space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground ml-1">Nama Proyek</label>
              <!-- Menambahkan @input agar nilai projectName langsung ter-update secara real-time saat mengetik -->
              <BaseInput 
                ref="inputRef"
                v-model="projectName" 
                placeholder="Game Keren Saya"
                @input="projectName = $event.target.value"
                @keyup.enter="handleConfirm"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between ml-1">
                <label class="text-xs font-medium text-muted-foreground">Deskripsi</label>
                <span class="text-[10px] text-muted-foreground/60">Opsional</span>
              </div>
              <BaseInput 
                v-model="projectDescription" 
                placeholder="Deskripsi singkat tentang game Anda..."
                @input="projectDescription = $event.target.value"
                @keyup.enter="handleConfirm"
              />
            </div>
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2">
            <button 
              @click="handleCancel"
              class="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent hover:bg-muted border border-border rounded transition-colors"
            >
              Batal
            </button>
            
            <button 
              @click="handleConfirm"
              :disabled="!projectName.trim()"
              class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
            >
              Buat
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
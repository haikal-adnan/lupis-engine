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
        v-if="state.isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="handleCancel"
      >
        
        <div 
          class="w-full max-w-sm bg-background border border-border rounded-lg shadow-xl overflow-hidden transform transition-all"
          :class="{ 'scale-100': state.isOpen, 'scale-95': !state.isOpen }"
        >
          
          <div class="px-4 py-3 border-b border-border bg-muted/30">
            <h3 class="text-sm font-semibold text-foreground">
              {{ state.title }}
            </h3>
          </div>

          <div class="px-4 py-4">
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ state.message }}
            </p>
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2">
            <button 
              @click="handleCancel"
              class="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent hover:bg-muted border border-border rounded transition-colors"
            >
              {{ state.cancelText }}
            </button>
            
            <button 
              @click="handleConfirm"
              class="px-3 py-1.5 text-xs font-medium text-white rounded transition-colors shadow-sm"
              :class="state.type === 'danger' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'"
            >
              {{ state.confirmText }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useConfirm } from '@/composables/useConfirm';

// Mengambil state dan method dari composable
const { state, handleConfirm, handleCancel } = useConfirm();
</script>
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
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
        @click.self="handleCancel"
        data-testid="base-confirm-overlay"
      >
        
        <div 
          class="w-full max-w-sm max-h-[calc(100vh-2rem)] flex flex-col bg-background border border-border rounded-lg shadow-xl overflow-hidden transform transition-all"
          :class="{ 'scale-100': state.isOpen, 'scale-95': !state.isOpen }"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          data-testid="base-confirm"
          :data-type="state.type"
        >
          
          <div class="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <h3 id="confirm-title" class="text-sm font-semibold text-foreground truncate" data-testid="confirm-title">
              {{ state.title }}
            </h3>
          </div>

          <div class="px-4 py-4 overflow-y-auto custom-scroll">
            <p id="confirm-message" class="text-sm text-muted-foreground leading-relaxed" data-testid="confirm-message">
              {{ state.message }}
            </p>
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2 shrink-0">
            <button 
              @click="handleCancel"
              type="button"
              data-testid="confirm-cancel-button"
              class="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent hover:bg-muted border border-border rounded transition-colors"
            >
              {{ state.cancelText }}
            </button>
            
            <button 
              @click="handleConfirm"
              type="button"
              data-testid="confirm-action-button"
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
import { useConfirm } from '@composables/composables.js';

const { state, handleConfirm, handleCancel } = useConfirm();
</script>
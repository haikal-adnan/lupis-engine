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
        data-testid="base-prompt-overlay"
      >
        <div 
          class="w-full max-w-sm max-h-[calc(100vh-2rem)] flex flex-col bg-background border border-border rounded-lg shadow-xl overflow-hidden transform transition-all"
          :class="{ 'scale-100': state.isOpen, 'scale-95': !state.isOpen }"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-title"
          data-testid="base-prompt"
        >
          <div class="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <h3 id="prompt-title" class="text-sm font-semibold text-foreground truncate" data-testid="prompt-title">
              {{ state.title }}
            </h3>
          </div>

          <div class="px-4 py-4 space-y-3 overflow-y-auto custom-scroll">
            <p v-if="state.message" class="text-sm text-muted-foreground leading-relaxed" data-testid="prompt-message">
              {{ state.message }}
            </p>

            <input 
              ref="inputRef"
              v-model="state.inputValue"
              type="text"
              :placeholder="state.placeholder"
              data-testid="prompt-input"
              class="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/50"
              @keyup.enter="handleConfirm"
              @keyup.esc="handleCancel"
            />
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end gap-2 shrink-0">
            <button 
              @click="handleCancel"
              type="button"
              data-testid="prompt-cancel-button"
              class="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent hover:bg-muted border border-border rounded transition-colors"
            >
              {{ state.cancelText }}
            </button>
            
            <button 
              @click="handleConfirm"
              type="button"
              data-testid="prompt-confirm-button"
              class="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors shadow-sm"
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
import { ref, watch, nextTick } from 'vue';
import { usePrompt } from '@composables/composables.js';

const { state, handleConfirm, handleCancel } = usePrompt();
const inputRef = ref(null);

watch(() => state.value.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  }
});
</script>
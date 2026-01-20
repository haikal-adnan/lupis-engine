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
        @click.self="handleClose"
      >
        <div 
          class="w-full max-w-sm bg-background border border-border rounded-lg shadow-xl overflow-hidden transform transition-all"
          :class="{ 'scale-100': state.isOpen, 'scale-95': !state.isOpen }"
        >
          
          <div class="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <component 
              :is="iconMap[state.type]" 
              class="w-4 h-4"
              :class="colorMap[state.type]"
            />
            <h3 class="text-sm font-semibold text-foreground">
              {{ state.title }}
            </h3>
          </div>

          <div class="px-4 py-4">
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ state.message }}
            </p>
          </div>

          <div class="px-4 py-3 bg-muted/30 border-t border-border flex justify-end">
            <button 
              @click="handleClose"
              ref="okButtonRef"
              class="px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-primary"
            >
              {{ state.buttonText }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useAlert } from '@/composables/useAlert';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-vue-next';

const { state, handleClose } = useAlert();
const okButtonRef = ref(null);

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle
};

const colorMap = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500'
};

watch(() => state.value.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    okButtonRef.value?.focus();
  }
});
</script>
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 -translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-4 scale-95"
    >
      <div 
        v-if="popState.isOpen" 
        class="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 md:px-0"
      >
        <div 
          class="flex items-start gap-3 p-4 bg-background border border-border rounded-lg shadow-xl"
          :class="borderClass[popState.type]"
        >
          <div class="flex-shrink-0 mt-0.5">
            <component 
              :is="iconMap[popState.type]" 
              class="w-5 h-5"
              :class="colorMap[popState.type]"
            />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-foreground">
              {{ popState.title }}
            </h3>
            <p v-if="popState.message" class="mt-1 text-sm text-muted-foreground leading-snug">
              {{ popState.message }}
            </p>
          </div>

          <button 
            @click="closePop"
            class="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { usePopAlert } from '@/composables/usePopAlert';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-vue-next';

const { popState, closePop } = usePopAlert();

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

// Opsional: Memberikan border kiri berwarna agar lebih jelas tipenya
const borderClass = {
  info: 'border-l-4 border-l-blue-500',
  success: 'border-l-4 border-l-green-500',
  warning: 'border-l-4 border-l-amber-500',
  error: 'border-l-4 border-l-red-500'
};
</script>
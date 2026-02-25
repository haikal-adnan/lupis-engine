<script setup>
import { useProjectStore } from '@/stores/useProjectStore'
import { useAppInit } from '@/composables/useAppInit'

import AppLoading from '@/commons/components/overlay/AppLoading.vue'

import BaseConfirm from '@ui/overlay/BaseConfirm.vue';
import BasePrompt from '@ui/overlay/BasePrompt.vue';
import BaseAlert from '@ui/overlay/BaseAlert.vue';
import BasePopAlert from '@ui/overlay/BasePopAlert.vue'; 

useAppInit()
const projectStore = useProjectStore()
</script>

<template>
  <div class="relative w-full h-full">
    <router-view />

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="projectStore.isLoading" 
        class="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <AppLoading />
      </div>
    </transition>

    <BaseConfirm />
    <BasePrompt />
    <BaseAlert />
    <BasePopAlert /> 
  </div>
</template>
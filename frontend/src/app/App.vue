<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/stores/useProjectStore'
import { useAppInit } from '@/composables/useAppInit'

// 1. Import ke-4 Layout kamu di sini
import LandingLayout from '@/layouts/LandingLayout.vue';
import MainLayout from '@/layouts/MainLayout.vue';

import AppLoading from '@/commons/components/overlay/AppLoading.vue'
import BaseConfirm from '@ui/overlay/BaseConfirm.vue';
import BasePrompt from '@ui/overlay/BasePrompt.vue';
import BaseAlert from '@ui/overlay/BaseAlert.vue';
import BasePopAlert from '@ui/overlay/BasePopAlert.vue'; 
import BasePopImage from '@ui/overlay/BasePopImage.vue';
import BasePopAudio from '@ui/overlay/BasePopAudio.vue';

useAppInit()
const projectStore = useProjectStore()
const route = useRoute();

// 2. Mapping nama layout dari router.js ke komponen aslinya
const layoutComponents = {
  LandingLayout,
  MainLayout,
};

// 3. Ambil komponen layout, default ke div biasa jika tidak ada
const layout = computed(() => {
  return layoutComponents[route.meta.layout] || 'div';
});
</script>

<template>
  <div class="relative w-full h-full">
    <component :is="layout">
      <router-view />
    </component>

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
    <BasePopImage />
    <BasePopAudio />
  </div>
</template>
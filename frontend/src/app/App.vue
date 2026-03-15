<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/stores/useProjectStore'
import { useAppInit } from '@/composables/useAppInit'
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 

import LandingLayout from '@/layouts/LandingLayout.vue';
import MainLayout from '@/layouts/MainLayout.vue';

import AppLoading from '@/commons/components/overlay/AppLoading.vue'
import BaseConfirm from '@ui/overlay/BaseConfirm.vue';
import BasePrompt from '@ui/overlay/BasePrompt.vue';
import BaseAlert from '@ui/overlay/BaseAlert.vue';
import BasePopAlert from '@ui/overlay/BasePopAlert.vue'; 
import BasePopImage from '@ui/overlay/BasePopImage.vue';
import BasePopAudio from '@ui/overlay/BasePopAudio.vue';

const authActions = useAuthActions();

onMounted(() => {
  authActions.initAuth();
});

useAppInit();
const projectStore = useProjectStore();
const route = useRoute();

const layoutComponents = {
  LandingLayout,
  MainLayout,
};

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
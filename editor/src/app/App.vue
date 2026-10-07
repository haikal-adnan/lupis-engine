<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import MainLayout from '@layouts/MainLayout.vue';

import { 
  BaseConfirm, 
  BasePrompt, 
  BaseAlert, 
  BasePopAlert, 
  BasePopImage, 
  BasePopAudio 
} from '@components/components.js';

const route = useRoute();

const layoutComponents = {
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

    <BaseConfirm />
    <BasePrompt />
    <BaseAlert />
    <BasePopAlert /> 
    <BasePopImage />
    <BasePopAudio />
  </div>
</template>
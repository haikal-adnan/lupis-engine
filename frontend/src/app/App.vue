<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 

import LandingLayout from '@/layouts/LandingLayout.vue';
import MainLayout from '@/layouts/MainLayout.vue';

// Base component tetap di-import normal agar instant stand-by untuk global event (misal: Auth Error)
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

    <BaseConfirm />
    <BasePrompt />
    <BaseAlert />
    <BasePopAlert /> 
    <BasePopImage />
    <BasePopAudio />
  </div>
</template>
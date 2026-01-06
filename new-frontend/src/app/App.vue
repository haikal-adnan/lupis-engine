<script setup>
import { useProjectStore } from '@/stores/useProjectStore'
import { useAppInit } from '@/composables/useAppInit'

import AppLoading from '@/commons/components/overlay/AppLoading.vue'
import EditorView from '@/layouts/EditorView.vue'

useAppInit()
const projectStore = useProjectStore()
</script>

<template>
  <div class="relative w-full h-full">
    <EditorView />

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="projectStore.isLoading" 
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <AppLoading />
      </div>
    </transition>
  </div>
</template>
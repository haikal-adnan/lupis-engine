<script setup>
import { useProjectStore } from '@/stores/useProjectStore'
const projectStore = useProjectStore()
</script>

<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-background z-[9999]">
    <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
    
    <p class="text-muted-foreground animate-pulse">
      Loading project data...
      <span v-if="projectStore.project">({{ projectStore.project.name }})</span>
    </p>

    <div v-if="projectStore.error" class="mt-4 p-3 bg-destructive/10 text-destructive rounded text-sm border border-destructive/20">
        Error: {{ projectStore.error }}
    </div>
  </div>
</template>
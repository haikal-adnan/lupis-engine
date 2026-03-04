<script setup>
import { useProjectStore } from '@/stores/useProjectStore'
import { Loader2 } from 'lucide-vue-next'

const projectStore = useProjectStore()
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 rounded-2xl bg-background border border-border shadow-2xl min-w-[300px]">
    
    <Loader2 class="w-12 h-12 text-primary animate-spin mb-4" :stroke-width="2" />
    
    <p class="text-foreground text-lg font-medium animate-pulse text-center">
      {{ projectStore.loadingMessage || 'Memproses...' }}
    </p>

    <p v-if="projectStore.project" class="text-sm text-muted-foreground mt-2">
      Project: <span class="font-semibold">{{ projectStore.project.name }}</span>
    </p>

    <div v-if="projectStore.error" class="mt-6 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 text-center w-full">
        <span class="font-bold block mb-1">Terjadi Kesalahan:</span>
        {{ projectStore.error }}
    </div>
  </div>
</template>
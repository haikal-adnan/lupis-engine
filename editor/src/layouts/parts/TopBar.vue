<template>
  <header class="h-12 flex items-center justify-between bg-background border-b border-border select-none text-foreground font-sans z-50 relative shadow-sm">
    
    <div class="shrink-0 h-full">
      <HeaderProjectMenu />
    </div>

    <div class="flex-1 h-full min-w-0 border-l border-border">
      <HeaderTabs />
    </div>

  </header>
</template>

<script setup>
import { HeaderProjectMenu, HeaderTabs } from '@viewports/viewports.js'

defineEmits(['settings']);
</script>
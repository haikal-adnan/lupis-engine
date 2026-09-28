<template>
  <header class="h-12 flex items-center justify-between bg-background border-b border-border select-none text-foreground font-sans z-50 relative shadow-sm">
    
    <div class="shrink-0 h-full">
      <HeaderProjectMenu />
    </div>

    <div class="flex-1 h-full min-w-0 border-l border-border">
      <HeaderTabs />
    </div>

    <div class="shrink-0 h-full">
      <HeaderActions 
        @undo="onUndo"
        @redo="onRedo"
        @settings="onOpenSettings"
      />
    </div>

  </header>
</template>

<script setup>
import { HeaderProjectMenu, HeaderTabs, HeaderActions } from '@viewports/viewports.js'

const emit = defineEmits(['settings']);

const onUndo = () => {
  console.log("Undo triggered");
};

const onRedo = () => {
  console.log("Redo triggered");
};

const onOpenSettings = () => {
  emit('settings');
};
</script>
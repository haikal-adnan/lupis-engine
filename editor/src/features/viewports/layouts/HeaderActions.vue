<template>
  <div class="flex items-center gap-1 px-2 h-full bg-background z-10 border-l border-border shrink-0" data-testid="header-actions">
    <!-- Action buttons container (Settings and Theme have moved to Project Dropdown) -->
    <slot />
  </div>
</template>

<script setup>
defineEmits(['undo', 'redo', 'settings']);
</script>
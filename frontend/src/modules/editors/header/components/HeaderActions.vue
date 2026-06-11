<template>
  <div class="flex items-center gap-1 px-4 h-full bg-background z-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] border-l border-border shrink-0">
    
    <div class="flex items-center gap-0.5 mr-3">
      <IconButton tooltip="Undo (Ctrl+Z)" ghost @click="$emit('undo')">
        <Undo2 class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
      </IconButton>
      <IconButton tooltip="Redo (Ctrl+Y)" ghost @click="$emit('redo')">
        <Redo2 class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
      </IconButton>
    </div>

    <div class="w-px h-5 bg-border mr-3"></div>

    <IconButton @click="toggleTheme" :tooltip="isDark ? 'Switch to Light' : 'Switch to Dark'" ghost>
      <Moon v-if="isDark" class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
      <Sun v-else class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
    </IconButton>

    <IconButton tooltip="Project Settings" ghost @click="$emit('settings')">
      <Settings class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" :stroke-width="1.5" />
    </IconButton>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTheme } from "@commons/composables/useTheme.js";
import IconButton from "@ui/buttons/IconButton.vue";
import { Undo2, Redo2, Sun, Moon, Settings } from 'lucide-vue-next';

defineEmits(['undo', 'redo', 'settings']);

const { isDark, toggleTheme, initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>
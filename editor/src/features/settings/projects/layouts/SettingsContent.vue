<template>
  <div class="flex-1 flex flex-col min-w-0 bg-background">
    <div class="h-14 px-8 border-b border-border flex items-center justify-between shrink-0 bg-background z-10">
      <div class="flex items-center gap-3">
        <component :is="activeTabInfo.icon" class="w-5 h-5 text-muted-foreground" />
        <div>
          <h3 class="text-sm font-bold text-foreground">{{ activeTabInfo.label }}</h3>
        </div>
      </div>
      <IconButton 
        data-testid="close-settings-modal-btn"
        ghost
        tooltip="Close (Esc)"
        aria-label="Close Settings"
        @click="$emit('close')"
      >
        <X class="w-4 h-4" />
      </IconButton>
    </div>

    <div class="flex-1 overflow-y-auto custom-scroll p-8 overscroll-contain">
      <div class="max-w-2xl mx-auto w-full">
        <SettingsTabProject v-if="activeTabId === 'project'" :info="activeTabInfo" />
        <SettingsTabPreferences v-else-if="activeTabId === 'preferences'" :info="activeTabInfo" />
        <SettingsTabEngine v-else-if="activeTabId === 'engine'" :info="activeTabInfo" />
        <SettingsTabPhysics v-else-if="activeTabId === 'physics'" :info="activeTabInfo" />
        <SettingsTabGrid v-else-if="activeTabId === 'grid'" :info="activeTabInfo" />
        <SettingsTabResources v-else-if="activeTabId === 'resources'" :info="activeTabInfo" />
        <SettingsTabDebug v-else-if="activeTabId === 'debug'" :info="activeTabInfo" />
        <SettingsTabPublish v-else-if="activeTabId === 'publish'" :info="activeTabInfo" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { X } from 'lucide-vue-next';
import { IconButton } from '@components/components.js';
import {
  SettingsTabEngine,
  SettingsTabPhysics,
  SettingsTabGrid,
  SettingsTabResources,
  SettingsTabDebug,
  SettingsTabPublish,
  SettingsTabProject,
  SettingsTabPreferences
} from '@settings/settings.js'

defineProps({
  activeTabInfo: Object,
  activeTabId: String
});

defineEmits(['close']);
</script>

<style scoped>
.custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.4) transparent; }
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 9999px; }
</style>
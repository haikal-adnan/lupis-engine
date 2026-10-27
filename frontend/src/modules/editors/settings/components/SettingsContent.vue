<template>
  <div class="flex-1 flex flex-col min-w-0 bg-background">
    <div class="h-14 px-8 border-b border-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur z-10">
      <div class="flex items-center gap-3">
        <component :is="activeTabInfo.icon" class="w-5 h-5 text-muted-foreground" />
        <div>
          <h3 class="text-sm font-bold text-foreground">{{ activeTabInfo.label }}</h3>
        </div>
      </div>
      <button 
        @click="$emit('close')" 
        class="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all outline-none focus:ring-2 focus:ring-primary/20"
        title="Close (Esc)"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto custom-scroll p-8">
      <div class="max-w-2xl mx-auto w-full">
        <SettingsTabProject v-if="activeTabId === 'project'" :info="activeTabInfo" />
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
import SettingsTabEngine from '@editors/settings/parts/SettingsTabEngine.vue';
import SettingsTabPhysics from '@editors/settings/parts/SettingsTabPhysics.vue';
import SettingsTabGrid from '@editors/settings/parts/SettingsTabGrid.vue';
import SettingsTabResources from '@editors/settings/parts/SettingsTabResources.vue';
import SettingsTabDebug from '@editors/settings/parts/SettingsTabDebug.vue';
import SettingsTabPublish from '@editors/settings/parts/SettingsTabPublish.vue';
import SettingsTabProject from '@editors/settings/parts/SettingsTabProject.vue';

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
<template>
  <div class="flex-1 flex items-center h-full overflow-hidden relative">
    <div class="flex items-center h-full overflow-x-auto no-scrollbar border-l border-border w-full">
      
      <BaseTab
        v-for="tab in tabs"
        :key="tab.id"
        :label="tab.name"
        :active="activeTabId === tab.id"
        :icon="tab.icon"
        :icon-color="tab.iconColor"
        :closable="!tab.fixed" 
        @click="setActiveTab(tab.id)"
        @close="closeTab(tab.id)"
      />

    </div>
    
    <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
  </div>
</template>

<script setup>
import { useTab } from '@/composables/useTab.js' // Import composable
import BaseTab from "@commons/components/navigations/BaseTab.vue"; 

// Gunakan destructuring dari composable
const { tabs, activeTabId, setActiveTab, closeTab } = useTab()
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
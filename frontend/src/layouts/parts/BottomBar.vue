<template>
  <div class="h-10 w-full flex items-center justify-between bg-background border-t border-border select-none relative z-50">
    
    <div class="flex items-end h-full">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="handleTabClick(tab)"
        class="group relative flex items-center gap-2 px-4 h-full text-xs font-medium border-x border-t transition-all duration-200 outline-none focus:outline-none"
        :class="[
          isActive(tab.id) && editorStore.isBottomBarOpen
            ? 'bg-background border-border border-t-transparent text-primary z-20' 
            : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
        ]"
      >
        <div 
          v-if="isActive(tab.id) && editorStore.isBottomBarOpen" 
          class="absolute -top-px left-0 right-0 h-[1px] bg-background"
        ></div>

        <component 
          :is="tab.icon" 
          class="w-3.5 h-3.5 transition-colors"
          :class="isActive(tab.id) && editorStore.isBottomBarOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'" 
        />
        {{ tab.label }}
      </button>
    </div>

    <div class="flex items-center gap-4 text-[10px] text-muted-foreground px-2">
      <div class="flex items-center gap-1.5">
         <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
         <span>Ready</span>
      </div>
      <span class="opacity-30">|</span>
      <span>UTF-8</span>
    </div>

  </div>
</template>

<script setup>
import { markRaw, watch } from 'vue'
import { FolderOpen, Terminal, Library, ScrollText } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/useEditorStore'

import AssetPanel from '@/modules/assets/AssetPanel.vue'
import ConsolePanel from '@/modules/console/ConsolePanel.vue'
import PrefabPanel from '@/modules/prefab/PrefabPanel.vue'
import ScriptPanel from '@/modules/scripts/ScriptPanel.vue'

const emit = defineEmits(['update:component'])
const editorStore = useEditorStore()

const tabs = [
  { id: 'assets', label: 'Assets', icon: FolderOpen, component: markRaw(AssetPanel) },
  { id: 'scripts', label: 'Scripts', icon: ScrollText, component: markRaw(ScriptPanel) },
  { id: 'console', label: 'Console', icon: Terminal, component: markRaw(ConsolePanel) },
  { id: 'prefabs', label: 'Prefabs', icon: Library, component: markRaw(PrefabPanel) },
]

const isActive = (id) => editorStore.activeBottomTabId === id

const handleTabClick = (tab) => {
  if (isActive(tab.id) && editorStore.isBottomBarOpen) {
    editorStore.toggleBottomBar()
    return
  }

  editorStore.setActiveBottomTab(tab.id)
}

watch(
  () => editorStore.activeBottomTabId,
  (newId) => {
    const foundTab = tabs.find(t => t.id === newId)
    if (foundTab) {
      emit('update:component', foundTab.component)
    }
  },
  { immediate: true }
)
</script>
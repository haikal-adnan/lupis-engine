<template>
  <div class="h-10 w-full flex items-center justify-between bg-background border-t border-border select-none relative z-50">
    
    <div class="flex items-end h-full">
      <button 
        v-for="tab in visibleTabs" 
        :key="tab.id"
        @click="handleTabClick(tab)"
        class="group relative flex items-center gap-2 px-4 h-full text-xs font-medium border-x border-t transition-all duration-200 outline-none focus:outline-none"
        :class="[
          active(tab.id) && editorStore.isBottomBarOpen
            ? 'bg-background border-border border-t-transparent text-primary z-20' 
            : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
        ]"
      >
        <div 
          v-if="active(tab.id) && editorStore.isBottomBarOpen" 
          class="absolute -top-px left-0 right-0 h-[1px] bg-background"
        ></div>

        <component 
          :is="tab.icon" 
          class="w-3.5 h-3.5 transition-colors"
          :class="active(tab.id) && editorStore.isBottomBarOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'" 
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
import { markRaw, watch, computed } from 'vue'
import { FolderOpen, Terminal, Library, ScrollText, Film } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/useEditorStore'

import AssetPanel from '@editors/assets/AssetPanel.vue'
import ConsolePanel from '@editors/console/ConsolePanel.vue'
import PrefabPanel from '@editors/prefab/PrefabPanel.vue'
import ScriptPanel from '@editors/scripts/ScriptPanel.vue'
import AnimatorTimeline from '@editors/animator/parts/AnimatorTimeline.vue'

const emit = defineEmits(['update:component'])
const editorStore = useEditorStore()

const allTabDefinitions = {
  assets: { id: 'assets', label: 'Assets', icon: FolderOpen, component: markRaw(AssetPanel) },
  scripts: { id: 'scripts', label: 'Scripts', icon: ScrollText, component: markRaw(ScriptPanel) },
  console: { id: 'console', label: 'Console', icon: Terminal, component: markRaw(ConsolePanel) },
  prefabs: { id: 'prefabs', label: 'Prefabs', icon: Library, component: markRaw(PrefabPanel) },
  timeline: { id: 'timeline', label: 'Timeline', icon: Film, component: markRaw(AnimatorTimeline) }
}

const visibleTabs = computed(() => {
  if (editorStore.activeTab?.type === 'animator') {
    return [
      allTabDefinitions.timeline,
      allTabDefinitions.assets
    ]
  }

  return [
    allTabDefinitions.assets,
    allTabDefinitions.scripts,
    allTabDefinitions.console,
    allTabDefinitions.prefabs
  ]
})

const active = (id) => editorStore.activeBottomTabId === id

const handleTabClick = (tab) => {
  if (active(tab.id) && editorStore.isBottomBarOpen) {
    editorStore.toggleBottomBar()
    return
  }
  editorStore.setActiveBottomTab(tab.id)
}

watch(
  () => editorStore.activeBottomTabId,
  (newId) => {
    const foundTab = allTabDefinitions[newId]
    if (foundTab) {
      emit('update:component', foundTab.component)
    }
  },
  { immediate: true }
)
</script>
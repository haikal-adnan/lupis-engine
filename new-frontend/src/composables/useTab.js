import { ref, computed, markRaw } from 'vue'
import { Box, Grid, FileCode2, Network } from 'lucide-vue-next'

import SceneHierarchy from '@/modules/scene/SceneHierarchy.vue'
import PropertyPanel from '@/modules/properties/PropertyPanel.vue'
import CanvasView from '@/modules/canvas/CanvasView.vue'
import TilemapPanel from '@/modules/tilemap/TilemapPanel.vue'
import ScriptPanel from '@/modules/script/ScriptPanel.vue'
import GraphPanel from '@/modules/graph/GraphPanel.vue'

const LAYOUT_CONFIG = {
  scene: {
    left: markRaw(SceneHierarchy),
    leftTitle: 'Hierarchy',
    right: markRaw(PropertyPanel),
    rightTitle: 'Inspector',
    center: markRaw(CanvasView),
    showBottom: true,
    overlay: {
      showCoords: true,
      showGrid: true,
      showPlay: true
    }
  },

  tilemap: {
    left: markRaw(SceneHierarchy),
    leftTitle: 'Hierarchy',
    right: markRaw(TilemapPanel),
    rightTitle: 'Tile Palette',
    center: markRaw(CanvasView),
    showBottom: true,
    overlay: {
      showCoords: true,
      showGrid: true,
      showPlay: true
    }
  },

  script: {
    left: markRaw(SceneHierarchy),
    leftTitle: 'Explorer',
    right: null,
    center: markRaw(ScriptPanel),
    showBottom: true,
    overlay: null
  },

  diagram: {
    left: null,
    right: markRaw(PropertyPanel),
    rightTitle: 'Node Settings',
    center: markRaw(GraphPanel),
    showBottom: false,
    overlay: {
      showCoords: false,
      showGrid: true,
      showPlay: false
    }
  }
}

const tabs = ref([
  { 
    id: 'scene-main', 
    name: 'Main Scene', 
    type: 'scene', 
    fixed: true,
    icon: markRaw(Box), 
    iconColor: 'text-primary' 
  },
  { 
    id: 'level-1', 
    name: 'Tilemap', 
    type: 'tilemap', 
    fixed: false,
    icon: markRaw(Grid), 
    iconColor: 'text-emerald-500' 
  },
  { 
    id: 'player-script', 
    name: 'Player.js', 
    type: 'script', 
    fixed: false,
    icon: markRaw(FileCode2), 
    iconColor: 'text-yellow-500' 
  },
  { 
    id: 'ai-behavior', 
    name: 'Graph Node', 
    type: 'diagram', 
    fixed: false,
    icon: markRaw(Network), 
    iconColor: 'text-blue-500' 
  }
])

const activeTabId = ref('scene-main')

export function useTab() {
  const activeTab = computed(() => {
    return tabs.value.find(t => t.id === activeTabId.value) || tabs.value[0]
  })

  const currentLayout = computed(() => {
    const type = activeTab.value?.type || 'scene'
    return LAYOUT_CONFIG[type] || LAYOUT_CONFIG['scene']
  })

  const setActiveTab = (id) => {
    activeTabId.value = id
  }

  const closeTab = (id) => {
    const index = tabs.value.findIndex(t => t.id === id)

    if (index !== -1 && !tabs.value[index].fixed) {
      if (activeTabId.value === id) {
        const nextTab = tabs.value[index - 1] || tabs.value[index + 1] || tabs.value[0]
        activeTabId.value = nextTab.id
      }

      tabs.value.splice(index, 1)
    }
  }

  const openTab = (tabData) => {
    const existing = tabs.value.find(t => t.id === tabData.id)

    if (existing) {
      setActiveTab(existing.id)
    } else {
      tabs.value.push({
        ...tabData,
        fixed: false,
        icon: markRaw(tabData.icon || Box)
      })
      setActiveTab(tabData.id)
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    currentLayout,
    setActiveTab,
    closeTab,
    openTab
  }
}

import { computed, markRaw } from 'vue'
import { useEditorStore } from '@/stores/useEditorStore'
import { Box, Grid, FileCode2, Network, LayoutTemplate } from 'lucide-vue-next'

import SceneHierarchy from '@/modules/scene/SceneHierarchy.vue'
import PropertyPanel from '@/modules/properties/PropertyPanel.vue'
import CanvasView from '@/modules/canvas/CanvasView.vue'
import TilemapPanel from '@/modules/tilemap/TilemapPanel.vue'
import IdePanel from '@/modules/ide/IdePanel.vue'
import GraphPanel from '@/modules/graph/GraphPanel.vue'
import NodePanel from '@/modules/node/NodePanel.vue'
import VariabelPanel from '@/modules/variable/VariablePanel.vue'

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
  
  ui: {
    left: markRaw(SceneHierarchy), 
    leftTitle: 'UI Structure',
    right: markRaw(PropertyPanel), 
    rightTitle: 'UI Inspector',
    center: markRaw(CanvasView), 
    showBottom: true,
    overlay: {
      showCoords: true,
      showGrid: false, 
      showPlay: true
    }
  },

  tilemap: {
    left: null,
    right: markRaw(TilemapPanel),
    rightTitle: 'Tile Palette',
    center: markRaw(CanvasView),
    showBottom: true,
    overlay: {
      showCoords: true,
      showGrid: false,
      showPlay: true
    }
  },

  ide: {
    left: markRaw(SceneHierarchy),
    leftTitle: 'Explorer',
    right: null,
    center: markRaw(IdePanel),
    showBottom: true,
    overlay: null
  },

  diagram: {
    rightTitle: 'Library Nodes',
    left: markRaw(VariabelPanel),
    right: markRaw(NodePanel),
    rightTitle: 'Node Settings',
    center: markRaw(GraphPanel),
    showBottom: false,
    overlay: {
      showCoords: true,
      showGrid: false,
      showPlay: true
    }
  }
}

const TYPE_ICONS = {
    scene: { icon: markRaw(Box), color: 'text-primary' },
    ui: { icon: markRaw(LayoutTemplate), color: 'text-purple-500' }, 
    tilemap: { icon: markRaw(Grid), color: 'text-emerald-500' },
    ide: { icon: markRaw(FileCode2), color: 'text-yellow-500' },
    diagram: { icon: markRaw(Network), color: 'text-blue-500' }
}

export function useTab() {
  const editorStore = useEditorStore()

  const tabs = computed(() => {
    return editorStore.tabs.map(tab => {
        const visual = TYPE_ICONS[tab.type] || TYPE_ICONS['scene']
        return {
            ...tab,
            icon: visual.icon,
            iconColor: visual.color
        }
    })
  })

  const currentLayout = computed(() => {
    const type = editorStore.activeTab?.type || 'scene'
    return LAYOUT_CONFIG[type] || LAYOUT_CONFIG['scene']
  })

  return {
    tabs,
    activeTabId: computed(() => editorStore.activeTabId),
    currentLayout,
    setActiveTab: editorStore.setActiveTab,
    closeTab: editorStore.closeTab,
    openTab: editorStore.openTab
  }
}
import { computed, markRaw } from 'vue'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneStore } from '@scenes/scenes.js'
import { Box, Grid, Network, LayoutTemplate, Film, Shapes, Code } from 'lucide-vue-next'

import { SceneHierarchy } from '@scenes/scenes.js'
import { PropertyPanel } from '@inspectors/inspectors.js'
import { CanvasView } from '@viewports/viewports.js'
import { ShapePanel, TilemapPanel } from '@builders/builders.js'
import { GraphPanel, VariablePanel, NodePanel, CodePanel } from '@nodes/nodes.js'
import { AnimatorClip, AnimatorHelper, AnimatorPanel } from '@animators/animators.js'

export function useTab() {
  const workspaceStore = useWorkspaceStore()
  const sceneStore = useSceneStore()

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

    shape_editor: {
      left: null,
      right: markRaw(ShapePanel),
      rightTitle: 'Custom Shape Inspector',
      center: markRaw(CanvasView),
      showBottom: true,
      overlay: {
        showCoords: true,
        showGrid: true,
        showPlay: true
      }
    },

    diagram: {
      left: markRaw(VariablePanel),
      right: markRaw(NodePanel),
      rightTitle: 'Node Settings',
      center: markRaw(GraphPanel),
      showBottom: false,
      overlay: {
        showCoords: true,
        showGrid: false,
        showPlay: true
      }
    },

    animator: {
      left: markRaw(AnimatorClip),
      leftTitle: 'Clip',
      right: markRaw(AnimatorHelper),
      rightTitle: 'Properties',
      center: markRaw(AnimatorPanel),
      showBottom: true,
      overlay: null
    },

    code_editor: {
      left: markRaw(VariablePanel),
      right: markRaw(NodePanel),
      rightTitle: 'Node Settings',
      center: markRaw(CodePanel),
      showBottom: false,
      overlay: null
    }
  }

  const TYPE_ICONS = {
    scene: { icon: markRaw(Box), color: 'text-primary' },
    ui: { icon: markRaw(LayoutTemplate), color: 'text-purple-500' }, 
    tilemap: { icon: markRaw(Grid), color: 'text-emerald-500' },
    shape_editor: { icon: markRaw(Shapes), color: 'text-amber-500' },
    diagram: { icon: markRaw(Network), color: 'text-blue-500' },
    animator: { icon: markRaw(Film), color: 'text-rose-500' },
    code_editor: { icon: markRaw(Code), color: 'text-cyan-500' }
  }

  const tabs = computed(() => {
    return workspaceStore.tabs.map(tab => {
      const visual = TYPE_ICONS[tab.type] || TYPE_ICONS['scene']
      
      const dynamicName = tab.type === 'scene' && sceneStore.activeScene
        ? sceneStore.activeScene.name
        : tab.name

      return {
        ...tab,
        name: dynamicName,
        icon: visual.icon,
        iconColor: visual.color
      }
    })
  })

  const currentLayout = computed(() => {
    const type = workspaceStore.activeTab?.type || 'scene'
    return LAYOUT_CONFIG[type] || LAYOUT_CONFIG['scene']
  })

  return {
    tabs,
    activeTabId: computed(() => workspaceStore.activeTabId),
    currentLayout,
    setActiveTab: workspaceStore.setActiveTab,
    closeTab: workspaceStore.closeTab,
    openTab: workspaceStore.openTab
  }
}
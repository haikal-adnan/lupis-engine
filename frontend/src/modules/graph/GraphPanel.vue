<template>
  <div 
    ref="panelRef"
    class="w-full h-screen relative overflow-hidden font-sans select-none transition-colors duration-300"
    :class="isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50'"
    @mousedown.middle="startPan" 
    @mousedown.left="handleCanvasClick" 
    @wheel.prevent="handleWheel"
    @contextmenu.prevent="handleBackgroundContext"
    @dragover.prevent 
    @drop="onDrop"
    @click="closeMenu"
  >
    <div 
      class="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out" 
      :class="interaction.hoveredId || selectedNodeId ? 'opacity-5' : 'opacity-10'"
      :style="{
        /* Jika dark mode gunakan kode lama (#ffffff), jika light mode gunakan kode baru (var) */
        backgroundImage: isDark 
          ? 'radial-gradient(#ffffff 1px, transparent 1px)' 
          : 'radial-gradient(#232323 1px, transparent 1px)',
        backgroundSize: `${GRID_SIZE * camera.scale}px ${GRID_SIZE * camera.scale}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`
      }"
    ></div>

    <div 
      class="absolute top-0 left-0 w-full h-full origin-top-left gpu-layer"
      :class="{ 'is-interacting': interaction.mode !== null }"
      :style="{ 
        transform: `translate3d(${Math.round(camera.x)}px, ${Math.round(camera.y)}px, 0) scale(${camera.scale})` 
      }"
    >
      <svg class="absolute top-0 left-0 overflow-visible pointer-events-none z-0">
        <g v-for="edge in edges" :key="edge._id">
          <path 
            :d="getEdgeData(edge).path"
            stroke="transparent" 
            stroke-width="20" 
            fill="none"
            class="pointer-events-auto cursor-pointer"
            @mouseenter="interaction.hoveredId = edge._id"
            @mouseleave="interaction.hoveredId = null"
            @mousedown.stop="startMoveEdge($event, edge)"
          />

          <path 
            :d="getEdgeData(edge).path"
            stroke-width="2" 
            fill="none"
            class="pointer-events-none transition-colors duration-200"
            :class="[
              interaction.mode === 'drag' ? 'transition-none' : '',
              edge.sourceHandle.includes('exec') 
                ? (isDark ? 'stroke-slate-400' : 'stroke-slate-500')
                : (isDark ? 'stroke-emerald-500' : 'stroke-emerald-600'),
              interaction.hoveredId === edge._id 
                ? (isDark ? 'stroke-white shadow-glow filter drop-shadow(0 0 2px white)' : 'stroke-black shadow-none')
                : (isRelated(edge._id) ? 'opacity-100' : 'opacity-20 grayscale')
            ]"
          />
        </g>

        <g v-if="interaction.mode === 'connect' && interaction.tempParams">
          <path 
            :d="getPathD(interaction.tempParams.p1, interaction.tempParams.p2)"
            stroke="#3b82f6" 
            stroke-width="3" 
            stroke-dasharray="8,4"  
            fill="none" 
            class="pointer-events-none opacity-80" 
          />
          <circle 
            v-if="interaction.candidate"
            :cx="interaction.tempParams.p2.x" 
            :cy="interaction.tempParams.p2.y" 
            r="6" 
            fill="#3b82f6"
            stroke="white"
            stroke-width="2"
            class="animate-pulse"
          />
        </g>
      </svg>

      <div class="relative z-10">
        <GraphNode 
          v-for="node in nodes" 
          :key="node._id"
          :data="node"
          :position="(interaction.mode === 'drag' && interaction.activeId === node._id) 
              ? interaction.dragPos 
              : node.position"
          :is-selected="selectedNodeId === node._id"
          :is-dimmed="!isRelated(node._id)" 
          :is-dragging="interaction.mode === 'drag' && interaction.activeId === node._id"
          @drag-start="startDragNode($event, node)"
          @connect-start="(e, portId, portType) => startConnect(e, node._id, portId, portType)"
          @node-hover="(id) => interaction.hoveredId = id"
          @node-contextmenu="openMenu"
        />
      </div>
    </div>

    <div class="absolute bottom-5 right-5 flex gap-2 pointer-events-none">
      <div 
        class="px-3 py-1 text-[10px] rounded border backdrop-blur font-mono tabular-nums shadow-sm transition-all"
        :class="isDark 
          ? 'bg-black/50 text-slate-300 border-white/10' 
          : 'bg-white/80 text-slate-600 border-black/10'"
      >
        X: {{ camera.x.toFixed(0) }} Y: {{ camera.y.toFixed(0) }} | Zoom: {{ (camera.scale * 100).toFixed(0) }}%
      </div>
    </div>

    <BaseContextMenu 
      v-if="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :items="contextMenu.items"
      @close="closeMenu"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import GraphNode from './parts/GraphNode.vue'
import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue' 
import { useGraphEditor } from './composables/useGraphEditor.js'
import { useNodeMenu } from './composables/useNodeMenu.js'
import { useTheme } from '@/commons/composables/useTheme.js' // Import useTheme

const { isDark } = useTheme() // Ambil status isDark

const {
  panelRef, camera, nodes, edges, interaction, selectedNodeId,
  handleWheel, startPan, startDragNode, 
  startConnect, startMoveEdge,
  handleGlobalMouseMove, handleGlobalMouseUp, 
  onCanvasMouseDown, onDrop,
  getEdgeData, getPathD, isRelated, GRID_SIZE
} = useGraphEditor()

const { contextMenu, openMenu, closeMenu } = useNodeMenu()

const handleCanvasClick = (e) => {
  closeMenu()
  onCanvasMouseDown(e)
}

const handleBackgroundContext = () => {
  closeMenu()
}

onMounted(() => {
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
})
</script>

<style scoped>
.grid-dots {
  --grid-dot-color: rgba(0, 0, 0, 0.3); /* Warna titik light mode */
}

.gpu-layer {
  transform-origin: 0 0;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased; 
}

.gpu-layer.is-interacting {
  will-change: transform;
}

path {
  transition: stroke 0.2s ease, opacity 0.2s ease;
}
</style>
<template>
  <div 
    ref="panelRef"
    class="w-full h-screen bg-[#1e1e1e] relative overflow-hidden font-sans select-none"
    @mousedown.middle="startPan" 
    @mousedown.left="onCanvasMouseDown" 
    @wheel.prevent="handleWheel"
    @contextmenu.prevent
    @dragover.prevent 
    @drop="onDrop"
  >
    <div 
      class="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out" 
      :class="interaction.hoveredId || selectedNodeId ? 'opacity-5' : 'opacity-10'"
      :style="{
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
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
             @mousedown.stop="store.setSelectedNode(edge._id)" 
           />

           <path 
             :d="getEdgeData(edge).path"
             stroke-width="2" 
             fill="none"
             class="pointer-events-none"
             :class="[
               /* Matikan transisi garis saat sedang drag agar tidak tertinggal */
               interaction.mode === 'drag' ? 'transition-none' : 'transition-all duration-300 ease-in-out',
               edge.sourceHandle.includes('exec') ? 'stroke-slate-400' : 'stroke-emerald-500',
               isRelated(edge._id) ? 'opacity-100' : 'opacity-10 grayscale'
             ]"
           />
        </g>

        <path 
          v-if="interaction.mode === 'connect' && interaction.tempParams"
          :d="getPathD(interaction.tempParams.p1, interaction.tempParams.p2)"
          stroke="#3b82f6" 
          stroke-width="2" 
          stroke-dasharray="5,5"  
          fill="none" 
          class="opacity-70 pointer-events-none" 
        />
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
          @connect-start="(e, portId) => startConnect(e, node._id, portId)"
          @connect-end="(targetPortId) => endConnect(node._id, targetPortId)"
          @node-hover="(id) => interaction.hoveredId = id"
        />
      </div>
    </div>

    <div class="absolute bottom-5 right-5 flex gap-2 pointer-events-none">
       <div class="px-3 py-1 bg-black/50 text-slate-300 text-xs rounded border border-white/10 backdrop-blur font-mono tabular-nums">
         X: {{ camera.x.toFixed(0) }} Y: {{ camera.y.toFixed(0) }} | Zoom: {{ (camera.scale * 100).toFixed(0) }}%
       </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import GraphNode from './parts/GraphNode.vue'
import { useGraphEditor } from './composables/useGraphEditor.js'
import { useScriptStore } from '@/stores/useScriptStore'

const store = useScriptStore()

const {
  panelRef, camera, nodes, edges, interaction, selectedNodeId,
  handleWheel, startPan, startDragNode, startConnect, endConnect, 
  handleGlobalMouseMove, handleGlobalMouseUp, 
  onCanvasMouseDown,
  onDrop,
  getEdgeData, getPathD, isRelated, GRID_SIZE
} = useGraphEditor()

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
.gpu-layer {
  transform-origin: 0 0;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased; 
  -moz-osx-font-smoothing: grayscale;
}

.gpu-layer.is-interacting {
  will-change: transform;
}
</style>
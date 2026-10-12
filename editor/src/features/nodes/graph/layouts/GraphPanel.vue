<template>
  <div 
    ref="panelRef"
    data-testid="graph-canvas-panel"
    class="w-full h-screen relative overflow-hidden font-sans select-none transition-colors duration-300"
    :class="[
      isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50',
      interaction.mode === 'pan' ? 'cursor-grabbing' : 'cursor-default'
    ]"
    @mousedown.middle="startPan" 
    @mousedown.left="onCanvasMouseDown" 
    @wheel.prevent="handleWheel"
    @contextmenu.prevent="handleBackgroundContext"
    @dragover.prevent 
    @drop="onDrop"
  >
    <div 
      class="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out" 
      :class="interaction.hoveredId || selectedNodeIds.length || selectedEdgeId ? 'opacity-5' : 'opacity-10'"
      :style="{
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
      <svg class="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
        <g v-for="edge in edges" :key="edge.id">
          <path 
            :d="getEdgeData(edge).path"
            stroke="transparent" 
            stroke-width="20" 
            fill="none"
            class="pointer-events-auto cursor-pointer"
            @mouseenter="interaction.hoveredId = edge.id"
            @mouseleave="interaction.hoveredId = null"
            @mousedown.stop="startMoveEdge($event, edge)"
          />

          <path 
            data-testid="graph-canvas-edge"
            :data-edge-id="edge.id"
            :d="getEdgeData(edge).path"
            stroke-width="2.5" 
            fill="none"
            class="pointer-events-none transition-colors duration-200"
            :class="[
              interaction.mode === 'drag' ? 'transition-none' : '',
              selectedEdgeId === edge.id 
                ? 'stroke-blue-500 shadow-glow filter drop-shadow(0 0 4px #3b82f6)' 
                : (edge.sourceHandle.includes('exec') 
                    ? (isDark ? 'stroke-slate-400' : 'stroke-slate-500')
                    : (isDark ? 'stroke-emerald-500' : 'stroke-emerald-600')),
              interaction.hoveredId === edge.id && selectedEdgeId !== edge.id
                ? (isDark ? 'stroke-white shadow-glow filter drop-shadow(0 0 2px white)' : 'stroke-black shadow-none')
                : (selectedNodeIds.length >= 2 
                    ? (selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target) ? 'opacity-100' : 'opacity-20 grayscale')
                    : (isRelated(edge.id) ? 'opacity-100' : 'opacity-20 grayscale'))
            ]"
          />

          <g 
            v-if="edge.modifier && edge.modifier.type && edge.modifier.type !== 'none'" 
            :transform="`translate(${getEdgeData(edge).center.x}, ${getEdgeData(edge).center.y})`"
            class="pointer-events-none select-none"
          >
            <rect 
              x="-14" y="-9" width="28" height="18" rx="4" 
              class="fill-background stroke-primary border shadow-sm"
              stroke-width="1"
            />
            <text 
              text-anchor="middle" 
              dominant-baseline="central" 
              class="text-[9px] font-mono font-bold fill-foreground"
            >
              {{ getModifierBadgeText(edge.modifier) }}
            </text>
          </g>
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

        <g v-if="marqueeBox">
          <rect 
            :x="marqueeBox.x"
            :y="marqueeBox.y"
            :width="marqueeBox.w"
            :height="marqueeBox.h"
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            stroke-width="1.5"
            stroke-dasharray="6,4"
            class="pointer-events-none"
          />
        </g>
      </svg>

      <div class="relative z-20 pointer-events-auto">
        <GraphNode 
          v-for="node in nodes" 
          :key="node.id"
          :data="node"
          :position="selectedNodeIds.includes(node.id) 
            ? { 
                x: node.position.x + interaction.dragDelta.x, 
                y: node.position.y + interaction.dragDelta.y 
              } 
            : node.position"
          :is-selected="selectedNodeIds.includes(node.id) || selectedNodeId === node.id"
          :is-dimmed="!isRelated(node.id)" 
          :is-dragging="interaction.mode === 'drag' && selectedNodeIds.includes(node.id)"
          @drag-start="startDragNode($event, node)"
          @connect-start="(e, portId, portType) => startConnect(e, node.id, portId, portType)"
          @node-hover="(id) => interaction.hoveredId = id"
          @node-contextmenu="openMenu"
        />
      </div>
    </div>

    <div class="absolute bottom-5 right-5 flex gap-2 pointer-events-none z-30">
      <div 
        data-testid="graph-canvas-camera-badge"
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
import { BaseContextMenu } from "@components/components.js";
import { useGraphEditor, useNodeMenu, GraphNode } from '@nodes/nodes.js'
import { useTheme } from '@composables/composables.js';

const { isDark } = useTheme() 

const {
  panelRef, 
  camera, 
  nodes, 
  edges, 
  interaction, 
  selectedNodeId, 
  selectedNodeIds, 
  selectedEdgeId, 
  marqueeBox,
  handleWheel, 
  startPan, 
  startDragNode, 
  startConnect, 
  startMoveEdge,
  handleGlobalMouseMove, 
  handleGlobalMouseUp, 
  onCanvasMouseDown, 
  onDrop,
  getEdgeData, 
  getPathD, 
  getModifierBadgeText, 
  isRelated, 
  GRID_SIZE,
  handleKeyDown
} = useGraphEditor()

const { contextMenu, openMenu, closeMenu } = useNodeMenu()

const handleBackgroundContext = () => {
  closeMenu()
}

onMounted(() => {
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
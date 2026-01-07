<template>
  <div class="select-none font-sans relative min-w-max">
    <div
      ref="dragGhostRef"
      class="fixed -top-[9999px] bg-foreground text-background px-2 py-1 rounded text-xs font-bold z-50 shadow-md border border-border"
    >
      {{ node.name }}
    </div>

    <div
      v-show="isDragOver && dragPosition === 'top'"
      class="absolute z-[100] h-[2px] bg-blue-500 pointer-events-none -top-[1px]"
      :style="{ left: `${indentation}px`, width: `calc(100% - ${indentation}px)` }"
    >
      <div class="absolute -left-[3px] -top-[2px] w-[6px] h-[6px] rounded-full border-2 border-blue-500 bg-background"></div>
    </div>

    <div
      class="group/node relative flex items-center w-full border border-transparent py-0.5 pr-2 text-xs cursor-default transition-none whitespace-nowrap"
      :class="[
        isSelected
          ? 'bg-blue-600/20 text-white'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        isDragOver && dragPosition === 'inside'
          ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/10 z-10'
          : ''
      ]"
      :style="{ paddingLeft: `${indentation}px` }"
      @click.stop="handleSelect"
      @contextmenu.prevent="handleContextMenu"
      draggable="true"
      @dragstart="onDragStart"
      @dragenter.prevent.stop="onDragOver"
      @dragover.prevent.stop="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent.stop="onDrop"
    >
      <div
        class="w-4 h-5 flex items-center justify-center -ml-1 mr-0.5 shrink-0 cursor-pointer hover:bg-white/10 rounded"
        @click.stop="toggle"
        @mousedown.stop
      >
        <component
          :is="isOpen ? ChevronDown : ChevronRight"
          class="w-3 h-3 transition-transform pointer-events-none"
          :class="[
            (!hasChildren && node.type !== 'group' && node.type !== 'layer') ? 'opacity-0' : 'opacity-70',
            isSelected ? 'text-white' : 'text-muted-foreground'
          ]"
        />
      </div>

      <component
        :is="getIcon"
        class="w-3.5 h-3.5 mr-2 shrink-0 pointer-events-none"
        :class="isSelected ? 'text-white' : (node.type === 'layer' ? 'text-blue-500' : 'opacity-70')"
      />

      <span class="truncate py-1 pointer-events-none" :class="{ 'font-bold': node.type === 'layer' }">
        {{ node.name }}
      </span>

      <div
        class="flex items-center opacity-0 group-hover/node:opacity-100 transition-opacity ml-auto pl-2 pointer-events-none"
        :class="{ 'opacity-100': isSelected }"
      >
        <Lock v-if="node._editor?.locked" class="w-3 h-3 mr-1" />
        <Eye class="w-3 h-3" />
      </div>
    </div>

    <div
      v-show="isDragOver && dragPosition === 'bottom'"
      class="absolute z-[100] h-[2px] bg-blue-500 pointer-events-none -bottom-[1px]"
      :style="{ left: `${indentation}px`, width: `calc(100% - ${indentation}px)` }"
    >
      <div class="absolute -left-[3px] -top-[2px] w-[6px] h-[6px] rounded-full border-2 border-blue-500 bg-background"></div>
    </div>

    <div v-if="isOpen" class="relative">
      <div
        v-if="hasChildren || node.type === 'group' || (node.type === 'layer' && node.children.length === 0)"
        class="absolute top-0 bottom-0 w-[1px] z-0 pointer-events-none"
        :class="isSelected ? 'bg-white/30' : 'bg-zinc-300 dark:bg-zinc-600'"
        :style="{ left: `${indentation + 6}px` }"
      ></div>

      <template v-if="hasChildren">
        <SceneNode
          v-for="child in node.children"
          :key="child._id || child.id"
          :node="child"
          :depth="depth + 1"
          :selected-ids="selectedIds"
          @select="$emit('select', $event)"
          @contextmenu="(p) => $emit('contextmenu', p)"
          @node-drop="(p) => $emit('node-drop', p)"
        />
      </template>

      <div
        v-else-if="(node.type === 'layer' || node.type === 'group') && node.children.length === 0"
        class="relative py-1 pr-1 opacity-50 transition-opacity pointer-events-none"
      >
        <div
          class="text-[10px] italic ml-2 text-muted-foreground pl-2 border-l border-dashed border-border whitespace-nowrap"
          :style="{ marginLeft: `${indentation + 6}px` }"
        >
          Empty {{ node.type }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Folder,
  FolderOpen,
  Cuboid,
  Type,
  Image,
  Box,
  Lock,
  Eye
} from 'lucide-vue-next'

defineOptions({ name: 'SceneNode' })

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  selectedIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'contextmenu', 'node-drop'])

const dragGhostRef = ref(null)
const isOpen = ref(true)
const isDragOver = ref(false)
const dragPosition = ref(null)

const indentation = computed(() => (props.depth * 16) + 12)
const isSelected = computed(() =>
  props.selectedIds.some(id => String(id) === String(props.node._id || props.node.id))
)
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

const getIcon = computed(() => {
  if (props.node.type === 'layer') return Layers
  if (props.node.type === 'group') return isOpen.value ? FolderOpen : Folder
  const name = (props.node.name || '').toLowerCase()
  if (name.includes('text')) return Type
  if (name.includes('sprite')) return Image
  if (name.includes('chest') || name.includes('box')) return Box
  return Cuboid
})

const toggle = () => (isOpen.value = !isOpen.value)
const handleSelect = () => emit('select', props.node._id || props.node.id)
const handleContextMenu = (e) => emit('contextmenu', { event: e, node: props.node })

const onDragStart = (e) => {
  e.stopPropagation()
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('nodeId', props.node._id || props.node.id)
  e.dataTransfer.setData('nodeType', props.node.type)

  if (props.node.type === 'layer') {
    e.dataTransfer.setData('application/x-layer', 'true')
  }

  if (dragGhostRef.value) {
    e.dataTransfer.setDragImage(dragGhostRef.value, 0, 0)
  }
}

const onDragOver = (e) => {
  const isDraggingLayer = e.dataTransfer.types.includes('application/x-layer')
  const targetType = props.node.type

  if (isDraggingLayer && targetType !== 'layer') return

  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'

  const rect = e.currentTarget.getBoundingClientRect()
  const y = e.clientY - rect.top
  const percentage = y / rect.height

  isDragOver.value = true

  if (isDraggingLayer) {
    dragPosition.value = percentage < 0.5 ? 'top' : 'bottom'
  } else {
    if (targetType === 'layer') {
      dragPosition.value = 'inside'
    } else {
      if (percentage < 0.3) dragPosition.value = 'top'
      else if (percentage > 0.7) dragPosition.value = 'bottom'
      else dragPosition.value = 'inside'
    }
  }
}

const onDragLeave = () => {
  isDragOver.value = false
  dragPosition.value = null
}

const onDrop = (e) => {
  e.preventDefault()
  e.stopPropagation()

  const draggedId = e.dataTransfer.getData('nodeId')

  if (draggedId) {
    emit('node-drop', {
      draggedId,
      targetNode: props.node,
      position: dragPosition.value
    })
  }

  isDragOver.value = false
  dragPosition.value = null
}
</script>

<template>
  <div class="select-none font-sans relative min-w-max" data-testid="hierarchy-node-root">
    <div
      ref="dragGhostRef"
      class="fixed -top-[9999px] bg-foreground text-background px-2 py-1 rounded text-xs font-bold z-50 shadow-md border border-border"
    >
      {{ node.scriptId }}
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
      data-testid="hierarchy-node"
      :data-node-id="node.id"
      :data-node-name="node.scriptId"
      :data-node-script-id="node.scriptId"
      :data-node-type="node.type"
      :data-parent-id="node.parentId || null"
      :data-prefab="isPrefab ? 'true' : 'false'"
      :data-locked="locked ? 'true' : 'false'"
      :data-visible="visible ? 'true' : 'false'"
      :aria-selected="isSelected ? 'true' : 'false'"
      :aria-disabled="isInactive ? 'true' : 'false'"
      :class="[
        isSelected
          ? 'bg-blue-600/20 text-white'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        isDragOver && dragPosition === 'inside'
          ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/10 z-10'
          : ''
      ]"
      :style="{ paddingLeft: `${indentation}px` }"
      @click.stop="handleSelect($event)"
      @contextmenu.prevent="handleContextMenu"
      draggable="true"
      @dragstart="onDragStart"
      @dragenter.prevent.stop="onDragOver"
      @dragover.prevent.stop="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent.stop="onDrop"
    >
      <button
        type="button"
        class="w-4 h-5 flex items-center justify-center -ml-1 mr-0.5 shrink-0 cursor-pointer hover:bg-white/10 rounded border-none bg-transparent p-0"
        data-testid="hierarchy-node-toggle"
        :aria-label="isOpen ? 'Collapse node' : 'Expand node'"
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
      </button>

      <component
        :is="getIcon"
        class="w-3.5 h-3.5 mr-2 shrink-0 pointer-events-none"
        :class="[
            isSelected ? 'text-white' : '',
            node.type === 'layer' ? 'text-blue-500' : 
            (node.type === 'group' ? 'text-yellow-500' : 
            (isPrefab && !isSelected ? 'text-sky-400' : 'opacity-70'))
        ]"
      />

      <span 
        class="truncate py-1 pointer-events-none mr-2 flex-grow flex items-center gap-2" 
        :class="{ 
            'font-bold': node.type === 'layer',
            'text-sky-400 font-medium': isPrefab && !isSelected,
            'opacity-50': !visible || isInactive 
        }"
      >
        {{ node.scriptId }}
        
        <span 
          v-if="node.zIndex !== undefined && node.zIndex !== null" 
          class="text-[9px] bg-white/10 px-1 rounded text-muted-foreground font-mono min-w-[14px] text-center"
          title="Z-Index Layer"
          data-z-index
        >
          {{ node.zIndex }}
        </span>
      </span>

      <div 
        class="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity"
        :class="{ 'opacity-100': locked || !visible }"
      >
        <button 
          type="button"
          class="p-1 rounded hover:bg-white/20 cursor-pointer border-none bg-transparent" 
          data-testid="hierarchy-node-lock-button"
          :aria-label="locked ? 'Unlock node' : 'Lock node'"
          title="Toggle Lock"
          @click.stop="toggleLock"
        >
            <Lock v-if="locked" class="w-3 h-3 text-amber-500" />
            <Unlock v-else class="w-3 h-3 text-muted-foreground opacity-50 hover:opacity-100" />
        </button>
        <button 
          type="button"
          class="p-1 rounded hover:bg-white/20 cursor-pointer border-none bg-transparent" 
          data-testid="hierarchy-node-visibility-button"
          :aria-label="visible ? 'Hide node' : 'Show node'"
          title="Toggle Visibility"
          @click.stop="toggleVisibility"
        >
            <EyeOff v-if="!visible" class="w-3.5 h-3.5 text-muted-foreground" />
            <Eye v-else class="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100" />
        </button>
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
        v-if="hasChildren"
        class="absolute top-0 bottom-0 w-[1px] z-0 pointer-events-none"
        :class="isSelected ? 'bg-white/30' : 'bg-zinc-300 dark:bg-zinc-700'"
        :style="{ left: `${indentation + 6}px` }"
      ></div>

      <template v-if="hasChildren">
        <SceneNode
          v-for="child in sortedChildren"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :selected-ids="selectedIds"
          @select="$emit('select',$event)"
          @contextmenu="(p) => $emit('contextmenu', p)"
          @node-drop="(p) => $emit('node-drop', p)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ChevronRight, ChevronDown, Layers, Folder, FolderOpen, Cuboid,
  Type, Image, Box, Lock, Unlock, Eye, EyeOff, FileCode
} from 'lucide-vue-next'
import { useSceneStore, useNodeDragDrop } from '@scenes/scenes.js';

defineOptions({ name: 'SceneNode' })

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  selectedIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'contextmenu', 'node-drop'])
const sceneStore = useSceneStore()

const isOpen = ref(true)

const isLayer = computed(() => props.node.type === 'layer')

const isPrefab = computed(() => !!props.node.prefabId)

const sortedChildren = computed(() => {
  if (!props.node.children) return []
  return [...props.node.children].sort((a, b) => {
    const zA = a.zIndex ?? 0
    const zB = b.zIndex ?? 0
    if (zA !== zB) return zA - zB
    
    const oA = a.orderIndex ?? 0
    const oB = b.orderIndex ?? 0
    if (oA !== oB) return oA - oB

    const idA = a.id || ""
    const idB = b.id || ""
    return idA.localeCompare(idB)
  })
})

const indentation = computed(() => (props.depth * 16) + 12)
const isSelected = computed(() => props.selectedIds.some(id => String(id) === String(props.node.id)))
const hasChildren = computed(() => sortedChildren.value.length > 0)

const locked = computed(() => {
    if (isLayer.value) return !!props.node.locked;
    return props.node._editor?.locked || props.node.locked || false;
})

const visible = computed(() => {
    if (isLayer.value) return props.node.visible !== false;
    return props.node.visible !== false;
})

const isInactive = computed(() => props.node.active === false)

const {
  dragGhostRef, isDragOver, dragPosition,
  onDragStart, onDragOver, onDragLeave, onDrop
} = useNodeDragDrop(props, emit)

const getIcon = computed(() => {
  if (isLayer.value) return Layers
  if (props.node.type === 'group') return isOpen.value ? FolderOpen : Folder
  
  if (isPrefab.value) return Box
  
  const scriptId = (props.node.scriptId || '').toLowerCase()
  if (scriptId.includes('text')) return Type
  if (scriptId.includes('sprite')) return Image
  if (scriptId.includes('script')) return FileCode
  if (scriptId.includes('chest') || scriptId.includes('box')) return Box
  return Cuboid
})

const toggle = () => (isOpen.value = !isOpen.value)

const handleSelect = (event) => {
  emit('select', { 
    id: props.node.id, 
    event: event 
  })
}

const handleContextMenu = (e) => emit('contextmenu', { event: e, node: props.node })

const toggleVisibility = () => {
    const id = props.node.id;
    const newVal = !visible.value;
    
    if (isLayer.value) {
        sceneStore.updateLayerProp(id, 'visible', newVal);
    } else {
        sceneStore.updateEntityProp(id, 'visible', newVal); 
    }
}

const toggleLock = () => {
    const id = props.node.id;
    const newVal = !locked.value;
    
    if (isLayer.value) {
        sceneStore.updateLayerProp(id, 'locked', newVal);
    } else {
        sceneStore.updateEntityProp(id, 'locked', newVal);
    }
}
</script>

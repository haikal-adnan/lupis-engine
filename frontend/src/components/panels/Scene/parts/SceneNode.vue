<script setup>
import { ref, computed, inject } from 'vue';
import { 
  ChevronRight, ChevronDown, 
  Layers, Folder, FolderOpen, Box, Type, Image, Shapes, 
  Grid3X3, Music, FileCode, User, Ghost, Bot, Gamepad2, Cuboid, Plus 
} from 'lucide-vue-next';
import { bus } from '@engine/Util/EventBus.js';

// Recursive Component Self-Reference
defineOptions({ name: 'SceneNode' });

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  selectedIds: { type: Array, default: () => [] },
  isLayer: { type: Boolean, default: false }
});

const emit = defineEmits(['select', 'contextmenu', 'drag-start', 'drop-on']);

// Inject state global dragging dari SceneTree
const dragHoverState = inject('dragHoverState', { targetId: null, position: null }); 

// State Expand/Collapse (Default expanded)
const isOpen = ref(props.node._editor?.expanded ?? true); 

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

const isSelected = computed(() => props.selectedIds.includes(props.node.id));

// Visual feedback saat item di-drag ke DALAM node ini
const isDragInside = computed(() => {
  return dragHoverState.value.targetId === props.node.id && 
         dragHoverState.value.position === 'inside';
});

// Penentuan Icon berdasarkan Tipe & Komponen
const currentIcon = computed(() => {
  if (props.isLayer) return Layers;
  
  // Icon khusus Group
  if (props.node.type === 'group') {
    return isOpen.value ? FolderOpen : Folder;
  }

  // Icon berdasarkan Tag (Opsional/Flavor)
  const tag = (props.node.tag || '').toLowerCase();
  if (tag === 'player' || tag === 'hero') return User;
  if (tag === 'enemy' || tag === 'monster') return Ghost;
  if (tag === 'npc') return Bot;
  if (tag === 'gamemanager') return Gamepad2;

  // Icon berdasarkan Component
  const comps = props.node.components || {};
  if (comps.TilemapRenderer) return Grid3X3;
  if (comps.TextRenderer) return Type;
  if (comps.SpriteRenderer) return Image;
  if (comps.ShapeRenderer) return Shapes;
  if (comps.AudioSource) return Music;
  if (comps.ScriptComponent) return FileCode;
  
  // Default Entity
  return Cuboid; 
});

const toggle = (e) => {
  if (e) e.stopPropagation();
  // Group atau Layer selalu bisa di-toggle
  if (hasChildren.value || props.node.type === 'group' || props.isLayer) {
      isOpen.value = !isOpen.value;
  }
};

const handleClick = () => emit('select', props.node.id);

const handleContextMenu = (e) => {
  if (e) e.stopPropagation(); 
  emit('contextmenu', { event: e, node: props.node, isLayer: props.isLayer });
};

// Helper untuk tombol "Add Entity" di dalam Layer Kosong
const createEntityInLayer = () => {
  bus.emit('entity:create', { 
    type: 'empty', 
    parentId: null, 
    layerId: props.node.id 
  });
};

// ==============================
// DRAG AND DROP HANDLERS
// ==============================

const onDragStart = (e) => {
  // Layer tidak bisa dipindah (untuk saat ini/logic backend)
  if (props.isLayer) { e.preventDefault(); return; } 

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('application/json', JSON.stringify({ id: props.node.id }));
  e.stopPropagation(); 
  
  emit('drag-start', props.node);
};

const onDragOver = (e) => {
  e.preventDefault(); 
  e.stopPropagation(); 
  e.dataTransfer.dropEffect = 'move';

  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position = 'inside';

  // Logic Zona Drop:
  // Layer & Group memiliki zona 'inside' yang lebih besar
  if (props.isLayer || props.node.type === 'group') {
      const insideThreshold = 0.25; 
      if (y < height * insideThreshold) position = 'top';
      else if (y > height * (1 - insideThreshold)) position = 'bottom';
      else position = 'inside';
  } else {
      // Entity biasa lebih mudah untuk reorder (top/bottom)
      const topThreshold = height * 0.4;
      const bottomThreshold = height * 0.6;
      if (y < topThreshold) position = 'top';
      else if (y > bottomThreshold) position = 'bottom';
      else position = 'inside';
  }

  // Emit ke Parent (SceneTree) untuk update visual garis biru
  emit('drop-on', { isHovering: true, targetId: props.node.id, position: position });
};

const onDrop = (e) => {
  e.preventDefault(); 
  e.stopPropagation();
  
  const dataString = e.dataTransfer.getData('application/json');
  if (!dataString) return;

  // Tentukan posisi akhir berdasarkan state visual terakhir
  const finalPos = dragHoverState.value.targetId === props.node.id ? dragHoverState.value.position : 'inside';

  // Emit Final Drop ke SceneTree untuk diproses Backend
  emit('drop-on', { 
    draggedId: JSON.parse(dataString).id, 
    targetNode: props.node, 
    isLayer: props.isLayer,
    position: finalPos
  });
};
</script>

<template>
  <div class="select-none font-sans relative">
    
    <div 
      v-if="dragHoverState.targetId === node.id && dragHoverState.position === 'top'"
      class="h-0.5 w-full bg-blue-500 absolute -top-[1px] z-50 pointer-events-none"
      :style="{ left: `${(depth * 12) + 4}px` }"
    >
        <div class="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-blue-500"></div>
    </div>

    <div 
      class="group relative flex items-center w-full transition-colors duration-75 border border-transparent rounded-sm overflow-hidden py-1 pr-2 text-xs cursor-pointer"
      :class="{ 
        'bg-primary/20 text-primary font-medium': isSelected,
        'hover:bg-muted/50 text-foreground/80': !isSelected,
        'bg-blue-500/10 ring-1 ring-blue-500 ring-inset': isDragInside
      }"
      :style="{ paddingLeft: `${(depth * 12) + 4}px` }" 
      
      @click.stop="handleClick"
      @contextmenu.prevent="handleContextMenu"
      
      draggable="true"
      @dragstart="onDragStart"
      @dragover.prevent.stop="onDragOver"
      @drop.prevent.stop="onDrop"
    >
      
      <div 
        class="w-4 h-4 flex items-center justify-center mr-1 rounded-sm hover:bg-white/10 shrink-0 z-10"
        @click.stop="toggle"
      >
        <component 
            v-if="hasChildren || node.type === 'group' || (isLayer && node.children.length === 0)" 
            :is="isOpen ? ChevronDown : ChevronRight" 
            class="w-3 h-3 opacity-70 pointer-events-none" 
        />
      </div>

      <component :is="currentIcon" class="w-3.5 h-3.5 mr-2 shrink-0 opacity-70 pointer-events-none"
        :class="{ 
            'text-blue-400': isLayer,
            'text-yellow-500': node.type === 'group'
        }"
      />

      <span class="truncate flex-1 pointer-events-none" :class="{ 'font-bold': isLayer }">
        {{ node.name }}
      </span>
      
      <span v-if="isLayer" class="ml-2 text-[8px] border border-blue-500/30 px-1 rounded text-blue-400 pointer-events-none">LAYER</span>

    </div>

    <div 
      v-if="dragHoverState.targetId === node.id && dragHoverState.position === 'bottom'"
      class="h-0.5 w-full bg-blue-500 absolute -bottom-[1px] z-50 pointer-events-none"
      :style="{ left: `${(depth * 12) + 4}px` }"
    >
        <div class="absolute -left-1 -top-0.5 w-2 h-2 rounded-full bg-blue-500"></div>
    </div>

    <div v-if="isOpen" class="relative">
      
      <div 
        v-if="hasChildren || node.type === 'group' || (isLayer && node.children.length === 0)"
        class="absolute top-0 bottom-0 w-[1px] transition-colors duration-200"
        :class="isDragInside ? 'bg-blue-500 z-10' : 'bg-white/10 group-hover:bg-white/20'"
        :style="{ left: `${(depth * 12) + 11}px` }"
      ></div>

      <template v-if="hasChildren">
        <SceneNode 
          v-for="child in node.children" 
          :key="child.id" 
          :node="child" 
          :depth="depth + 1"
          :selectedIds="selectedIds"
          :isLayer="false" 
          @select="$emit('select', $event)"
          @contextmenu="(p) => $emit('contextmenu', p)"
          @drag-start="$emit('drag-start', $event)"
          @drop-on="(p) => $emit('drop-on', p)"
        />
      </template>

      <div 
        v-else-if="isLayer && node.children.length === 0" 
        class="relative py-1 pr-1"
      >
        <button 
          @click.stop="createEntityInLayer"
          class="flex items-center gap-2 w-[calc(100%-16px)] ml-4 py-1 px-2 rounded-sm border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-[10px] group/empty text-left"
          :style="{ marginLeft: `${(depth * 12) + 16}px` }"
        >
           <div class="p-0.5 rounded bg-muted-foreground/20 group-hover/empty:bg-primary/20">
              <Plus class="w-3 h-3" />
           </div>
           <span>Add Entity</span>
           <span class="ml-auto text-[9px] opacity-50 hidden group-hover/empty:inline">or Right Click</span>
        </button>
      </div>

    </div>
  </div>
</template>
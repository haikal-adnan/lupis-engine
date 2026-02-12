<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none">
    
    <PropertySection title="World" :defaultOpen="true" class="border-b border-border/50">
      <template #menu="{ close }">
        <div class="p-1 space-y-0.5 min-w-[140px]">
           <button @click="handleAddLayer('world'); close()" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add World Layer</span>
           </button>
        </div>
      </template>

      <div 
        class="min-h-[80px] relative pb-4 transition-colors duration-200" 
        @dragover.prevent="allowDrop" 
        @drop.prevent="(e) => handleEmptyDrop(e, 'world')"
      >
        <SceneNode 
          v-for="node in worldTree" 
          :key="node.id || node._id" 
          :node="node" 
          :selected-ids="selectedIds"
          @select="$emit('select', $event)"
          @contextmenu="$emit('contextmenu', $event)"
          @node-drop="handleDrop"
        />
        
        <div v-if="worldTree.length === 0" class="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border/20 m-2 rounded-md">
          No world layers. Drag entities here.
        </div>
      </div>
    </PropertySection>

    <PropertySection title="User Interface" :defaultOpen="true">
      <template #menu="{ close }">
        <div class="p-1 space-y-0.5 min-w-[150px]">
           <button @click="openUIEditor(); close()" :disabled="isUIEditorActive" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
               <LayoutTemplate class="w-3.5 h-3.5 mr-2 text-blue-500" />
               <span>Open UI Editor</span>
           </button>
           <button @click="toggleUIBorder(); close()" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
               <AppWindow class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
               <span>{{ showUIBorder ? 'Hide UI Border' : 'Show UI Border' }}</span>
           </button>
           <div class="h-[1px] bg-border my-1"></div>
           <button @click="handleAddLayer('ui'); close()" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add UI Layer</span>
           </button>
        </div>
      </template>

      <div 
        class="min-h-[120px] relative pb-6" 
        @dragover.prevent="allowDrop" 
        @drop.prevent="(e) => handleEmptyDrop(e, 'ui')"
      >
        <SceneNode 
          v-for="node in uiTree" 
          :key="node.id || node._id" 
          :node="node" 
          :selected-ids="selectedIds"
          @select="$emit('select', $event)"
          @contextmenu="$emit('contextmenu', $event)"
          @node-drop="handleDrop"
        />
        
        <div v-if="uiTree.length === 0" class="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border/20 m-2 rounded-md">
          No UI layers. Drag UI elements here.
        </div>
      </div>
    </PropertySection>

    <div 
      class="h-32 w-full cursor-default" 
      @contextmenu.prevent="$emit('contextmenu', { event: $event, node: null })"
    ></div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LayoutTemplate, AppWindow, Plus } from 'lucide-vue-next';
import SceneNode from './SceneNode.vue';
import PropertySection from "@ui/display/PropertySection.vue"; 
import { useEditorStore } from '@/stores/useEditorStore';
import { useLayerActions } from '@/stores/scene/layerActions';
import { useSceneStore } from '@/stores/scene/useSceneStore';

const props = defineProps({
  data: { type: Object, default: () => ({ worldTree: [], uiTree: [] }) },
  selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['select', 'contextmenu', 'drop']);

const editorStore = useEditorStore();
const sceneStore = useSceneStore();
const activeScene = computed(() => sceneStore.activeScene);
const { addLayer } = useLayerActions(activeScene);

// --- STABLE SORTING LOGIC ---
const sortNodes = (nodes) => {
  return [...nodes].sort((a, b) => {
      const zA = a.zIndex ?? 0;
      const zB = b.zIndex ?? 0;
      if (zA !== zB) return zA - zB;
      
      const oA = a.orderIndex ?? 0;
      const oB = b.orderIndex ?? 0;
      if (oA !== oB) return oA - oB;

      const idA = a.id || a._id || "";
      const idB = b.id || b._id || "";
      return idA.localeCompare(idB);
  });
};

const worldTree = computed(() => sortNodes(props.data.worldTree || []));
const uiTree = computed(() => sortNodes(props.data.uiTree || []));

// --- Actions ---
const isUIEditorActive = computed(() => editorStore.activeTab?.type === 'ui');
const showUIBorder = computed(() => sceneStore.activeScene?.settings?.ui?.showUIBorder ?? true);

const openUIEditor = () => {
    const rootUILayer = uiTree.value[0];
    if (rootUILayer) {
        editorStore.openTab({
            id: `tab_ui_${rootUILayer._id}`, 
            name: `UI Editor`,
            type: 'ui', entityId: rootUILayer._id        
        });
    }
};

const toggleUIBorder = () => sceneStore.toggleUIBorder();
const handleAddLayer = (section) => addLayer("New Layer", section);

// --- Drag Drop ---
const handleDrop = (payload) => emit('drop', payload);
const allowDrop = (e) => { e.dataTransfer.dropEffect = 'move'; };

const handleEmptyDrop = (e, section) => {
  const draggedId = e.dataTransfer.getData('nodeId');
  if (draggedId) {
    emit('drop', { draggedId, targetNode: null, position: 'root', section: section });
  }
};
</script>
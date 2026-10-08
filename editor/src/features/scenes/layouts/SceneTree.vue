<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none">
    
    <PropertySection 
      title="World" 
      :defaultOpen="true" 
      class="border-b border-border/50"
      data-section="world"
      role="region"
      aria-label="World"
    >
      <template #menu="{ close }">
        <div class="p-1 space-y-0.5 min-w-[140px]">
           <button 
             type="button"
             @click="handleAddLayer('world'); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             aria-label="Add World Layer"
           >
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
          v-for="node in sortedWorldTree" 
          :key="node.id" 
          :node="node" 
          :selected-ids="selectedIds"
          @select="$emit('select',$event)"
          @contextmenu="$emit('contextmenu',$event)"
          @node-drop="handleDrop"
        />
        
        <div v-if="data.worldTree.length === 0" class="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border/20 m-2 rounded-md">
          No world layers. Drag entities here.
        </div>
      </div>
    </PropertySection>

    <PropertySection 
      title="User Interface" 
      :defaultOpen="true"
      data-section="ui"
      role="region"
      aria-label="User Interface"
    >
      <template #menu="{ close }">
        <div class="p-1 space-y-0.5 min-w-[150px]">
           <button 
             type="button"
             @click="openUIEditor(); close()" 
             :disabled="workspaceStore.activeTab?.type === 'ui'" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
             aria-label="Open UI Editor"
           >
               <LayoutTemplate class="w-3.5 h-3.5 mr-2 text-blue-500" />
               <span>Open UI Editor</span>
           </button>
           <button 
             type="button"
             @click="sceneStore.toggleUIBorder(); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             aria-label="Toggle UI Border"
           >
               <AppWindow class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
               <span>{{ (sceneStore.activeScene?.settings?.ui?.showUIBorder ?? true) ? 'Hide UI Border' : 'Show UI Border' }}</span>
           </button>
           <div class="h-[1px] bg-border my-1"></div>
           <button 
             type="button"
             @click="handleAddLayer('ui'); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             aria-label="Add UI Layer"
           >
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
          v-for="node in sortedUiTree" 
          :key="node.id" 
          :node="node" 
          :selected-ids="selectedIds"
          @select="$emit('select',$event)"
          @contextmenu="$emit('contextmenu',$event)"
          @node-drop="handleDrop"
        />
        
        <div v-if="data.uiTree.length === 0" class="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border/20 m-2 rounded-md">
          No UI layers. Drag UI elements here.
        </div>
      </div>
    </PropertySection>

    <div 
      class="h-32 w-full cursor-default" 
      @contextmenu.prevent="$emit('contextmenu', { event:$event, node: null })"
    ></div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LayoutTemplate, AppWindow, Plus } from 'lucide-vue-next';
import { PropertySection } from '@components/components.js';

import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore, SceneNode } from '@scenes/scenes.js';

const props = defineProps({
  data: { type: Object, default: () => ({ worldTree: [], uiTree: [] }) },
  selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['select', 'contextmenu', 'drop']);

const workspaceStore = useWorkspaceStore();
const sceneStore = useSceneStore();

const sortNodes = (nodes) => {
  return [...nodes].sort((a, b) => {
      const zA = a.zIndex ?? 0;
      const zB = b.zIndex ?? 0;
      if (zA !== zB) return zA - zB;
      
      const oA = a.orderIndex ?? 0;
      const oB = b.orderIndex ?? 0;
      if (oA !== oB) return oA - oB;

      const idA = a.id || "";
      const idB = b.id || "";
      return idA.localeCompare(idB);
  });
};

const sortedWorldTree = computed(() => sortNodes(props.data.worldTree || []));
const sortedUiTree = computed(() => sortNodes(props.data.uiTree || []));

const openUIEditor = () => {
    const rootUILayer = sortedUiTree.value[0];
    if (rootUILayer) {
        workspaceStore.openTab({
            id: `tab_ui_${rootUILayer.id}`, 
            name: `UI Editor`,
            type: 'ui', 
            entityId: rootUILayer.id        
        });
    }
};

const handleAddLayer = (section) => sceneStore.addLayer("New Layer", section);
const handleDrop = (payload) => emit('drop', payload);
const allowDrop = (e) => { e.dataTransfer.dropEffect = 'move'; };

const handleEmptyDrop = (e, section) => {
  const draggedId = e.dataTransfer.getData('nodeId');
  if (draggedId) {
    emit('drop', { draggedId, targetNode: null, position: 'root', section: section });
  }
};
</script>
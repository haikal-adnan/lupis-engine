<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none" data-testid="hierarchy-tree-root">
    
    <PropertySection 
      title="World" 
      test-id="hierarchy-section-world"
      :defaultOpen="true" 
      class="border-b border-border/50"
      data-section="world"
      role="region"
      aria-label="World"
    >
      <template #header-extra>
        <button
          v-if="!isWorldVisible"
          type="button"
          @click.stop="toggleWorldVisibility"
          class="p-0.5 rounded text-amber-500 hover:text-amber-400 cursor-pointer"
          title="World Layer Hidden (Click to Show)"
          data-testid="hierarchy-world-visibility-indicator"
        >
          <EyeOff class="w-3.5 h-3.5" />
        </button>
      </template>

      <template #menu="{ close }">
        <div class="p-1 space-y-0.5 min-w-[150px]">
           <button 
             type="button"
             @click="toggleWorldVisibility(); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             :aria-label="isWorldVisible ? 'Hide World Layer' : 'Show World Layer'"
             data-testid="hierarchy-world-toggle-visibility-button"
           >
              <component :is="isWorldVisible ? EyeOff : Eye" class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>{{ isWorldVisible ? 'Hide World Layer' : 'Show World Layer' }}</span>
           </button>

           <div class="h-[1px] bg-border my-1"></div>

           <button 
             type="button"
             @click="handleAddLayer('world'); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             aria-label="Add World Layer"
             data-testid="hierarchy-world-add-layer-button"
           >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add World Layer</span>
           </button>
        </div>
      </template>

      <div 
        class="min-h-[80px] relative pb-4 transition-colors duration-200 w-full min-w-full" 
        @dragover.prevent="allowDrop" 
        @drop.prevent="(e) => handleEmptyDrop(e, 'world')"
        data-testid="hierarchy-world-tree"
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
        
        <div 
          v-if="data.worldTree.length === 0" 
          class="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border/20 m-2 rounded-md"
          data-testid="hierarchy-world-empty-state"
        >
          No world layers. Drag entities here.
        </div>
      </div>
    </PropertySection>

    <PropertySection 
      title="User Interface" 
      test-id="hierarchy-section-ui"
      :defaultOpen="true"
      data-section="ui"
      role="region"
      aria-label="User Interface"
    >
      <template #header-extra>
        <button
          v-if="!isUIVisible"
          type="button"
          @click.stop="toggleUIVisibility"
          class="p-0.5 rounded text-amber-500 hover:text-amber-400 cursor-pointer"
          title="UI Layer Hidden (Click to Show)"
          data-testid="hierarchy-ui-visibility-indicator"
        >
          <EyeOff class="w-3.5 h-3.5" />
        </button>
      </template>

      <template #menu="{ close }">
        <div class="p-1 space-y-0.5 min-w-[150px]">
           <button 
             type="button"
             @click="toggleUIVisibility(); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             :aria-label="isUIVisible ? 'Hide UI Layer' : 'Show UI Layer'"
             data-testid="hierarchy-ui-toggle-visibility-button"
           >
              <component :is="isUIVisible ? EyeOff : Eye" class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>{{ isUIVisible ? 'Hide UI Layer' : 'Show UI Layer' }}</span>
           </button>

           <div class="h-[1px] bg-border my-1"></div>

           <button 
             type="button"
             @click="openUIEditor(); close()" 
             :disabled="workspaceStore.activeTab?.type === 'ui'" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
             aria-label="Open UI Editor"
             data-testid="hierarchy-ui-open-editor-button"
           >
               <LayoutTemplate class="w-3.5 h-3.5 mr-2 text-blue-500" />
               <span>Open UI Editor</span>
           </button>

           <div class="h-[1px] bg-border my-1"></div>
           <button 
             type="button"
             @click="handleAddLayer('ui'); close()" 
             class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
             aria-label="Add UI Layer"
             data-testid="hierarchy-ui-add-layer-button"
           >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add UI Layer</span>
           </button>
        </div>
      </template>

      <div 
        class="min-h-[120px] relative pb-6 w-full min-w-full" 
        @dragover.prevent="allowDrop" 
        @drop.prevent="(e) => handleEmptyDrop(e, 'ui')"
        data-testid="hierarchy-ui-tree"
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
        
        <div 
          v-if="data.uiTree.length === 0" 
          class="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border/20 m-2 rounded-md"
          data-testid="hierarchy-ui-empty-state"
        >
          No UI layers. Drag UI elements here.
        </div>
      </div>
    </PropertySection>

    <div 
      class="h-32 w-full cursor-default" 
      @contextmenu.prevent="$emit('contextmenu', { event:$event, node: null })"
      data-testid="hierarchy-empty-space"
    ></div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LayoutTemplate, AppWindow, Plus, Eye, EyeOff } from 'lucide-vue-next';
import { PropertySection } from '@components/components.js';

import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore, useLayerActions, SceneNode } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';

const props = defineProps({
  data: { type: Object, default: () => ({ worldTree: [], uiTree: [] }) },
  selectedIds: { type: Array, default: () => [] }
});

const emit = defineEmits(['select', 'contextmenu', 'drop']);

const workspaceStore = useWorkspaceStore();
const sceneStore = useSceneStore();
const { addLayer } = useLayerActions();
const projectStore = useProjectStore();

const isWorldVisible = computed(() => projectStore.project?.settings?.world?.visible !== false && projectStore.project?.settings?.world?.active !== false);
const isUIVisible = computed(() => projectStore.project?.settings?.ui?.visible !== false && projectStore.project?.settings?.ui?.active !== false);

const toggleWorldVisibility = () => {
  projectStore.toggleWorldVisibility();
};

const toggleUIVisibility = () => {
  projectStore.toggleUIVisibility();
};

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

const handleAddLayer = (section) => addLayer("New Layer", section);
const handleDrop = (payload) => emit('drop', payload);
const allowDrop = (e) => { e.dataTransfer.dropEffect = 'move'; };

const handleEmptyDrop = (e, section) => {
  const draggedId = e.dataTransfer.getData('nodeId');
  if (draggedId) {
    emit('drop', { draggedId, targetNode: null, position: 'root', section: section });
  }
};
</script>

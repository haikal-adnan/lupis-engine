<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none bg-background border-r border-border font-sans" @click="closeMenu" data-testid="animator-tree-section">
    
    <div class="px-4 py-3 border-b border-border bg-muted/10 space-y-3">
      <div class="flex items-center gap-1.5 justify-between">
        <div class="text-xs font-bold text-foreground uppercase tracking-wider">Animation Clips</div>
        <BaseDropdown align="right">
          <template #trigger="{ isOpen }">
            <button class="h-8 w-8 flex items-center justify-center rounded-md border border-transparent hover:bg-muted text-muted-foreground transition-colors" data-testid="animator-tree-more-menu">
              <MoreVertical class="w-4 h-4" />
            </button>
          </template>
          <template #default="{ close }">
            <div class="flex flex-col text-xs min-w-[160px] p-1">
              <button @click="handlers.createNewCategory(); close()" class="dropdown-item flex items-center px-2 py-2 rounded-md hover:bg-accent" data-testid="animator-tree-new-category-btn">
                <FolderPlus class="w-4 h-4 mr-2" /> <span>New Category</span>
              </button>
              <button @click="handlers.createNewClip(); close()" class="dropdown-item flex items-center px-2 py-2 rounded-md hover:bg-accent" data-testid="animator-tree-new-clip-btn">
                <Film class="w-4 h-4 mr-2" /> <span>New Clip</span>
              </button>
              <div class="h-px bg-border my-1"></div>
              <button @click="handlers.deleteSelectedClip(); close()" class="dropdown-item flex items-center px-2 py-2 rounded-md text-destructive hover:bg-destructive/10" data-testid="animator-tree-delete-selected-btn">
                <Trash2 class="w-4 h-4 mr-2" /> <span>Delete Selected</span>
              </button>
            </div>
          </template>
        </BaseDropdown>
      </div>

      <div class="relative flex-1">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search clips..." 
          class="w-full h-8 pl-8 pr-8 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          data-testid="animator-tree-search-input"
        />
      </div>
    </div>

    <div class="flex-1 min-h-0 relative w-full">
      <ScrollArea>
        <!-- Klik pada area kosong di hierarki akan membatalkan seleksi klip -->
        <div class="pb-6 px-2 relative pt-2 h-full min-h-[150px] w-full" 
             @click.self="selectClip(null)"
             @contextmenu.prevent="handleContextMenu($event, null)"
             @dragover.prevent="onRootDragOver"
             @drop.prevent="onRootDrop"
             @dragleave="onDragLeave"
             data-testid="animator-tree-content">
          
          <div v-for="node in filteredTreeData" :key="node.id" class="flex flex-col w-full">
            <div class="relative w-full">
              <div v-show="dragState.targetId === node.id && dragState.position === 'top'" class="absolute -top-[1px] left-1 right-1 h-[2px] bg-primary z-10 pointer-events-none rounded-full"></div>

              <div class="group flex items-center w-full py-2 px-2 cursor-pointer transition-all duration-200 relative my-0.5"
                draggable="true"
                @dragstart.stop="onDragStart($event, node)"
                @dragover.prevent.stop="onDragOver($event, node)"
                @dragleave.prevent.stop="onDragLeave"
                @drop.prevent.stop="onDrop($event, node)"
                :class="[
                  node.type === 'category' ? 'rounded-md hover:bg-muted/50' : 'rounded-lg border',
                  activeClipId === node.id ? 'bg-primary/15 border-primary text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground border-transparent',
                  dragState.targetId === node.id && dragState.position === 'inside' ? 'ring-2 ring-primary bg-primary/20 rounded-lg' : ''
                ]"
                @click.stop="node.type === 'category' ? toggleCategory(node.id) : selectClip(node.id)"
                @contextmenu.prevent.stop="handleContextMenu($event, node)"
                data-testid="animator-tree-node"
                :aria-selected="activeClipId === node.id ? 'true' : 'false'"
                :data-node-id="node.id"
                :data-node-type="node.type"
                :data-node-name="node.scriptId"
                :data-node-script-id="node.scriptId"
              >
                <div v-if="node.type === 'category'" class="flex items-center justify-center w-5 h-5 mr-1 text-muted-foreground">
                  <component :is="node.isOpen ? ChevronDown : ChevronRight" class="w-3.5 h-3.5" />
                </div>

                <component :is="node.type === 'category' ? (node.isOpen ? FolderOpen : Folder) : Film" class="w-4 h-4 mr-2 shrink-0" :class="[ node.type === 'category' ? 'text-yellow-500' : (activeClipId === node.id ? 'text-primary' : 'opacity-70') ]"/>
                <span class="text-sm flex-grow truncate" :class="node.type === 'category' ? 'font-semibold tracking-wide text-foreground' : 'font-medium'">{{ node.scriptId }}</span>
                
                <span v-if="node.type === 'category'" class="text-[10px] font-bold opacity-50 bg-muted px-2 py-0.5 rounded-full ml-1">
                  {{ node._uiChildren?.length || 0 }}
                </span>
                <PlayCircle v-else-if="activeClipId === node.id" class="w-4 h-4 text-primary animate-pulse shrink-0 ml-1" />
              </div>

              <div v-show="dragState.targetId === node.id && dragState.position === 'bottom'" class="absolute -bottom-[1px] left-1 right-1 h-[2px] bg-primary z-10 pointer-events-none rounded-full"></div>
            </div>

            <!-- Hierarchy Child Items di dalam Kategori -->
            <div v-if="node.type === 'category' && node.isOpen" class="relative pl-4 space-y-0.5 my-0.5 w-full">
              <!-- Indent Line -->
              <div class="absolute top-0 bottom-0 left-2.5 w-[1.5px] pointer-events-none transition-all duration-300" :class="selectedInside(node) ? 'bg-primary opacity-70' : 'bg-border/60'"></div>
              
              <div v-for="child in node._uiChildren" :key="child.id" class="relative w-full">
                <div v-show="dragState.targetId === child.id && dragState.position === 'top'" class="absolute -top-[1px] left-0 right-0 h-[2px] bg-primary z-10 pointer-events-none rounded-full"></div>

                <div class="group flex items-center w-full my-0.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 border"
                  draggable="true"
                  @dragstart.stop="onDragStart($event, child)"
                  @dragover.prevent.stop="onDragOver($event, child)"
                  @dragleave.prevent.stop="onDragLeave"
                  @drop.prevent.stop="onDrop($event, child)"
                  :class="activeClipId === child.id ? 'bg-primary/15 border-primary text-primary shadow-sm' : 'bg-transparent border-transparent text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border/50'"
                  @click.stop="selectClip(child.id)"
                  @contextmenu.prevent.stop="handleContextMenu($event, child)"
                  data-testid="animator-tree-node"
                  :aria-selected="activeClipId === child.id ? 'true' : 'false'"
                  :data-node-id="child.id"
                  :data-node-type="child.type"
                  :data-node-name="child.scriptId"
                  :data-node-script-id="child.scriptId"
                  :data-parent-id="node.id"
                >
                  <Film class="w-4 h-4 mr-2 shrink-0" :class="activeClipId === child.id ? 'text-primary' : 'opacity-60'" />
                  <span class="text-sm font-medium flex-grow truncate">{{ child.scriptId }}</span>
                  <PlayCircle v-if="activeClipId === child.id" class="w-4 h-4 text-primary opacity-80 shrink-0 ml-1" />
                </div>

                <div v-show="dragState.targetId === child.id && dragState.position === 'bottom'" class="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary z-10 pointer-events-none rounded-full"></div>
              </div>
            </div>
          </div>

          <div v-if="dragState.position === 'root' && dragState.id" class="mt-4 h-12 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-xs text-primary bg-primary/5">
            Drop to move out of category
          </div>

          <div v-if="filteredTreeData.length === 0" class="flex flex-col items-center justify-center p-8 text-center opacity-50" data-testid="animator-tree-empty-state">
            <Film class="w-8 h-8 mb-2" />
            <span class="text-xs">No clips found</span>
          </div>
        </div>
      </ScrollArea>
    </div>

    <BaseContextMenu v-if="contextMenu.visible" :position="{ x: contextMenu.x, y: contextMenu.y }" :items="contextMenu.items" @close="closeMenu" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Search, MoreVertical, FolderPlus, Film, Folder, FolderOpen, ChevronRight, ChevronDown, PlayCircle, Trash2 } from 'lucide-vue-next';
import { BaseDropdown, BaseContextMenu, ScrollArea } from "@components/components.js";
import { useAnimatorLogic, useAnimatorMenu } from '@animators/animators.js';

const { 
  activeClipId, realClipsData, treeVisualData, selectClip, createCategory, createClip, deleteNode, 
  duplicateNode, copyNode, cutNode, pasteNode, hasClipboard, toggleCategory, moveNode, renameNode
} = useAnimatorLogic();

const handlers = {
  createNewCategory: () => createCategory(activeClipId.value),
  createNewClip: () => createClip(activeClipId.value),
  deleteSelectedClip: () => { if (activeClipId.value) deleteNode(activeClipId.value); },
  toggleCategory, createCategory, createClip, deleteNode, duplicateNode, copyNode, cutNode, pasteNode, renameNode,
  duplicate: (id) => duplicateNode(id || activeClipId.value),
  copy: (id) => copyNode(id || activeClipId.value),
  cut: (id) => cutNode(id || activeClipId.value),
  paste: (id) => pasteNode(id || activeClipId.value),
  hasClipboardData: hasClipboard
};

const { contextMenu, openMenu, closeMenu } = useAnimatorMenu(handlers);
const searchQuery = ref('');

const filteredTreeData = computed(() => {
  if (!searchQuery.value) return treeVisualData.value;
  const q = searchQuery.value.toLowerCase();
  return treeVisualData.value.filter(n => {
    if (n.scriptId && n.scriptId.toLowerCase().includes(q)) return true;
    if (n._uiChildren && n._uiChildren.some(c => c.scriptId && c.scriptId.toLowerCase().includes(q))) return true;
    return false;
  }).map(n => {
    if (n._uiChildren) {
      return { ...n, _uiChildren: n._uiChildren.filter(c => (c.scriptId && c.scriptId.toLowerCase().includes(q)) || (n.scriptId && n.scriptId.toLowerCase().includes(q))) };
    }
    return n;
  });
});

const dragState = ref({ id: null, targetId: null, position: null });

const onDragStart = (e, node) => {
  dragState.value.id = node.id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', node.id);
};

const onDragOver = (e, node) => {
  e.preventDefault();
  e.stopPropagation();
  if (dragState.value.id === node.id) return;

  const draggedType = realClipsData.value.find(c => c.id === dragState.value.id)?.type;
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const h = rect.height;

  let position = 'inside';
  if (node.type === 'category') {
    if (draggedType === 'category') {
      position = y < h / 2 ? 'top' : 'bottom';
    } else {
      if (y < h * 0.25) position = 'top';
      else if (y > h * 0.75) position = 'bottom';
      else position = 'inside';
    }
  } else {
    position = y < h / 2 ? 'top' : 'bottom';
  }

  dragState.value.targetId = node.id;
  dragState.value.position = position;
};

const onDragLeave = () => {
  dragState.value.targetId = null;
  dragState.value.position = null;
};

const onDrop = (e, node) => {
  e.preventDefault();
  e.stopPropagation();
  if (dragState.value.id && dragState.value.targetId) {
    moveNode(dragState.value.id, dragState.value.targetId, dragState.value.position);
  }
  onDragLeave();
};

const onRootDragOver = (e) => {
  e.preventDefault();
  if (!dragState.value.targetId) dragState.value.position = 'root';
};

const onRootDrop = (e) => {
  e.preventDefault();
  if (dragState.value.id && dragState.value.position === 'root') {
    moveNode(dragState.value.id, null, 'root');
  }
  onDragLeave();
};

const selectedInside = (parent) => parent._uiChildren?.some(c => c.id === activeClipId.value);

const handleContextMenu = (event, node) => {
  if (node && node.type === 'clip' && activeClipId.value !== node.id) selectClip(node.id);
  openMenu(event, node);
};

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'c': if (activeClipId.value) handlers.copy(activeClipId.value); break;
      case 'x': if (activeClipId.value) handlers.cut(activeClipId.value); break;
      case 'v': handlers.paste(activeClipId.value); break;
      case 'd': e.preventDefault(); if (activeClipId.value) handlers.duplicate(activeClipId.value); break;
    }
  } else if (e.key === 'Delete') {
    handlers.deleteSelectedClip();
  }
};

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown));
</script>
<script setup>
import { ref, onMounted, onUnmounted, watch, triggerRef, computed } from 'vue';
import { useBackend } from '@/composables/useBackend.js';
import { useEditorState } from '@/composables/useEditorState.js';
import { bus } from '@engine/Util/EventBus.js';
import { Plus, Layers, RefreshCw, FolderPlus, Cuboid, MousePointer2 } from 'lucide-vue-next';
import SceneTree from './parts/SceneTree.vue';
import SceneContextMenu from './parts/SceneContextMenu.vue';

const { activeProjectId } = useEditorState();
const { 
  scenes, currentScene, projectData,
  fetchAllProjectResources, fetchScene, fetchProjectDetails, loading 
} = useBackend();

const selectedIds = ref([]);
const panelContextMenu = ref({ visible: false, x: 0, y: 0, items: [] });

// Cek ketersediaan Layer
const hasLayers = computed(() => {
  return projectData.value?.layers && projectData.value.layers.length > 0;
});

const handleTreeSelect = (idsToSelect) => {
   bus.emit("ui:select-by-id", idsToSelect);
};

const createNewLayer = () => bus.emit('layer:create');

// Logic Create Entity untuk Empty State / Context Menu
const createNewEntity = () => {
  const defaultLayerId = projectData.value?.layers?.[0]?.id;
  if (!defaultLayerId) return;
  bus.emit('entity:create', { type: 'empty', parentId: null, layerId: defaultLayerId });
};

const refreshScene = async () => {
    if (currentScene.value) await fetchScene(currentScene.value._id);
};

const handlePanelRightClick = (event) => {
  const items = [
    { label: 'Create New Layer', icon: Layers, action: createNewLayer },
    { separator: true },
    { label: 'Create Empty Entity', icon: Cuboid, action: createNewEntity, disabled: !hasLayers.value },
    { label: 'Create Group', icon: FolderPlus, action: () => bus.emit('entity:create', { type: 'group', parentId: null }), disabled: !hasLayers.value },
    { separator: true },
    { label: 'Refresh Scene', icon: RefreshCw, action: refreshScene }
  ];

  panelContextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items
  };
};

const closePanelMenu = () => { panelContextMenu.value.visible = false; };

const onGlobalSelected = (list) => {
  if (!list || list.length === 0) {
    selectedIds.value = [];
    return;
  }
  selectedIds.value = list.map(e => e._id || e.id);
};

const onGlobalDeselected = () => { selectedIds.value = []; };
const onPrefabSelected = () => { selectedIds.value = []; };

const onEntityModified = (modifiedEntities) => {
  if (!currentScene.value || !currentScene.value.entities) return;

  const list = Array.isArray(modifiedEntities) ? modifiedEntities : [modifiedEntities];
  let requireSortUpdate = false;

  list.forEach(engineEntity => {
    const vueEntity = currentScene.value.entities.find(e => e._id === engineEntity._id);
    
    if (vueEntity) {
      vueEntity.parentId = engineEntity.parentId || null;
      vueEntity.layerId = engineEntity.layerId;
      
      const newZIndex = engineEntity.transform?.zIndex ?? 0;
      if (vueEntity.transform?.zIndex !== newZIndex) requireSortUpdate = true;

      vueEntity.transform = {
          ...(vueEntity.transform || {}),
          x: engineEntity.transform?.x ?? 0,
          y: engineEntity.transform?.y ?? 0,
          zIndex: newZIndex
      };
    }
  });

  if (requireSortUpdate || list.length > 0) {
      currentScene.value.entities = [...currentScene.value.entities];
  }
  triggerRef(currentScene); 
};

const loadProjectData = async () => {
  const pId = activeProjectId.value;
  if (!pId) return;

  try {
      await fetchProjectDetails(pId);
      await fetchAllProjectResources(pId);
      
      if (scenes.value.length > 0) {
        const firstSceneId = scenes.value[0]._id;
        const needLoad = !currentScene.value || 
                          currentScene.value._id !== firstSceneId || 
                          !currentScene.value.entities;

        if (needLoad) await fetchScene(firstSceneId);
      }
  } catch (err) {
      console.error(err);
  }
};

onMounted(async () => {
  await loadProjectData();
  bus.on("entity:selected", onGlobalSelected);
  bus.on("entity:deselected", onGlobalDeselected);
  bus.on("prefab:selected", onPrefabSelected);
  bus.on("entity:modified", onEntityModified);
});

onUnmounted(() => {
  bus.off("entity:selected", onGlobalSelected);
  bus.off("entity:deselected", onGlobalDeselected);
  bus.off("prefab:selected", onPrefabSelected);
  bus.off("entity:modified", onEntityModified);
});

watch(activeProjectId, async (newId) => {
  if (newId) {
    selectedIds.value = [];
    await loadProjectData();
  }
});
</script>

<template>
  <div class="flex flex-col h-full bg-background text-foreground select-none" @contextmenu.prevent>
    
    <div v-if="scenes.length > 0" class="p-2 border-b border-border bg-muted/20 shrink-0 flex gap-2">
       <select 
          :value="currentScene?._id" 
          @change="fetchScene($event.target.value)" 
          class="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/50 font-medium truncate"
        >
          <option v-for="s in scenes" :key="s._id" :value="s._id">🎬 {{ s.name }}</option>
        </select>
        <button @click="refreshScene" class="p-1.5 bg-background border border-border rounded hover:bg-muted text-muted-foreground" title="Refresh Scene">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        </button>
    </div>

    <div 
      class="flex-1 overflow-y-auto scrollbar-thin relative p-1"
      @contextmenu.prevent="handlePanelRightClick"
    >
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-background/60 z-20 backdrop-blur-[1px]">
        <RefreshCw class="animate-spin h-5 w-5 text-primary" />
      </div>

      <SceneTree 
        v-if="hasLayers && currentScene && currentScene.entities" 
        :data="currentScene.entities" 
        :selectedIds="selectedIds"
        @select="handleTreeSelect"
      />
      
      <div 
        v-else-if="!loading" 
        class="flex flex-col items-center justify-center h-full text-muted-foreground select-none gap-4 p-4 text-center opacity-80"
      >
        <div class="p-4 bg-muted/30 rounded-full mb-2">
            <Layers class="w-8 h-8 opacity-50" />
        </div>
        <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-foreground">Scene is Empty</span>
            <span class="text-[10px]">Create a layer to start adding objects</span>
        </div>
        
        <button 
            @click="createNewLayer" 
            class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
        >
            <Plus class="w-4 h-4" /> Create First Layer
        </button>

        <div class="flex items-center gap-1.5 text-[10px] opacity-60 mt-4 bg-background/50 px-2 py-1 rounded border border-border/50">
            <MousePointer2 class="w-3 h-3" />
            <span>Right Click to create</span>
        </div>
      </div>

      <SceneContextMenu 
        v-if="panelContextMenu.visible"
        :position="{ x: panelContextMenu.x, y: panelContextMenu.y }"
        :menuItems="panelContextMenu.items"
        @close="closePanelMenu"
      />
    </div>
  </div>
</template>
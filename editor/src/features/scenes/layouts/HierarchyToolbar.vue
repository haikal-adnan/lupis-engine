<template>
  <div 
    class="px-2 py-2 border-b border-border bg-background space-y-2"
    data-testid="hierarchy-toolbar"
    :data-active-scene-id="sceneStore.activeSceneId"
  >
    <!-- Scene Selector & Actions Section -->
    <div class="flex items-center gap-1.5" data-section="scene-selector-section">
      <div class="flex-1 min-w-0">
        <BaseSelect 
          :modelValue="sceneStore.activeSceneId" 
          @update:modelValue="handleSwitchScene"
          :options="sceneStore.sceneOptions"
          placeholder="Select Scene..."
          height="1.75rem"
          class="w-full"
          data-testid="hierarchy-scene-select"
        />
      </div>

      <BaseDropdown align="right">
        <template #trigger="{ isOpen }">
          <button 
            class="h-7 w-7 flex items-center justify-center rounded-md border border-transparent hover:bg-muted text-muted-foreground transition-colors"
            :class="{ 'bg-muted text-foreground': isOpen }"
            title="Scene Options"
            data-testid="hierarchy-scene-options-button"
            aria-label="Scene Options"
            :aria-expanded="isOpen"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </template>

        <template #default="{ close }">
          <div 
            class="flex flex-col text-xs min-w-[160px]"
            role="menu"
            aria-label="Scene Actions Menu"
            data-testid="hierarchy-scene-options-menu"
          >
            <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Scene Actions
            </div>
            
            <button 
              @click="handleCreate(close)" 
              class="dropdown-item"
              role="menuitem"
              data-testid="hierarchy-scene-action-new"
            >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>New Scene</span>
            </button>

            <button 
              @click="handleRename(close)" 
              :disabled="!sceneStore.activeSceneId" 
              class="dropdown-item"
              role="menuitem"
              data-testid="hierarchy-scene-action-rename"
              :aria-disabled="!sceneStore.activeSceneId"
            >
              <Edit2 class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>Rename Scene</span>
            </button>

            <button 
              @click="handleDuplicate(close)" 
              :disabled="!sceneStore.activeSceneId" 
              class="dropdown-item"
              role="menuitem"
              data-testid="hierarchy-scene-action-duplicate"
              :aria-disabled="!sceneStore.activeSceneId"
            >
              <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>Duplicate Scene</span>
            </button>

            <div class="h-[1px] bg-border my-1"></div>

            <button 
              @click="handleDelete(close)" 
              :disabled="!sceneStore.activeSceneId" 
              class="dropdown-item text-destructive hover:text-destructive hover:bg-destructive/10"
              role="menuitem"
              data-testid="hierarchy-scene-action-delete"
              :aria-disabled="!sceneStore.activeSceneId"
            >
              <Trash2 class="w-3.5 h-3.5 mr-2" /> <span>Delete Scene</span>
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <!-- Search Section -->
    <div class="flex items-center gap-1.5" data-section="search-and-controls">
      <div class="relative flex-1">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input 
          type="text" 
          :value="modelValue"
          @input="$emit('update:modelValue',$event.target.value)"
          placeholder="Search..." 
          class="w-full h-7 pl-7 pr-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50"
          data-testid="hierarchy-search-input"
          aria-label="Search Hierarchy"
        />
        <button 
          v-if="modelValue"
          @click="$emit('update:modelValue', '')"
          class="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full"
          data-testid="hierarchy-search-clear-button"
          aria-label="Clear Search"
        >
          <X class="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { 
  Search, X, MoreVertical, 
  Plus, Trash2, Edit2, Copy
} from 'lucide-vue-next'

import { 
  BaseSelect,
  BaseDropdown
} from "@components/components.js";

import { useProjectStore } from '@projects/projects.js'
import { useSceneStore } from '@scenes/scenes.js';
import { useAssetStore } from '@assets/assets.js'
import { useScriptStore } from '@scripts/scripts.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { toRaw } from 'vue';
import { engineBridge } from "@engines/engines.js";

import {
  usePrompt,
  useConfirm,
  useAlert,
  usePopAlert
} from '@composables/composables.js'

defineProps({
  modelValue: String
});

defineEmits(['update:modelValue', 'add-layer']);

const projectStore = useProjectStore();
const sceneStore = useSceneStore();
const assetStore = useAssetStore();
const scriptStore = useScriptStore();
const prefabStore = usePrefabStore();

const { prompt } = usePrompt();
const { confirm } = useConfirm();
const { alert } = useAlert();
const { showPop } = usePopAlert();

const syncSceneWithEngine = () => {
  const activeScene = sceneStore.activeScene;
  if (!activeScene) return;

  const safeScene = JSON.parse(JSON.stringify(toRaw(activeScene)));

  const payload = {
    project: projectStore.project ? JSON.parse(JSON.stringify(toRaw(projectStore.project))) : null,
    scene: safeScene,
    prefabs: JSON.parse(JSON.stringify(toRaw(Object.values(prefabStore.prefabs || {})))), 
    scripts: JSON.parse(JSON.stringify(toRaw(Object.values(scriptStore.scripts || {})))),
    assets: JSON.parse(JSON.stringify(toRaw(assetStore.assets || [])))
  };

  engineBridge.reloadScene(payload);

  sceneStore.clearSelection();
  engineBridge.clearSelection();
};

const handleSwitchScene = (sceneId) => {
  sceneStore.setActiveScene(sceneId);
  syncSceneWithEngine();
};

const handleCreate = async (close) => {
  close();
  const name = await prompt({ title: 'New Scene', message: 'Enter scene name:', defaultValue: 'New Scene' });
  
  if (name) {
    try {
      const newScene = sceneStore.addScene({ scriptId: name });
      
      if (newScene?.id) {
        sceneStore.setActiveScene(newScene.id);
      } else if (sceneStore.scenes?.length) {
        const created = sceneStore.scenes.find(s => s.scriptId === name);
        if (created) sceneStore.setActiveScene(created.id);
      }

      syncSceneWithEngine();
      showPop({ title: 'Success', message: `Scene "${name}" created.`, type: 'success' });
    } catch (e) {
      showPop({ title: 'Failed', message: 'Failed to create scene.', type: 'error' });
    }
  }
};

const handleRename = async (close) => {
  close();
  const scene = sceneStore.activeScene;
  if (!scene) return;

  const currentName = scene.scriptId;
  const name = await prompt({ title: 'Rename Scene', defaultValue: currentName });
  if (name && name !== currentName) {
    try {
      sceneStore.updateSceneScriptId(scene.id, name);
      showPop({ title: 'Renamed', message: 'Scene identifier updated.', type: 'success' });
    } catch (e) {
      showPop({ title: 'Error', message: 'Failed to rename scene.', type: 'error' });
    }
  }
};

const handleDuplicate = async (close) => {
  close();
  if (sceneStore.activeSceneId) {
    try {
      sceneStore.duplicateScene(sceneStore.activeSceneId);
      syncSceneWithEngine();
      showPop({ title: 'Duplicated', message: 'Scene duplicated.', type: 'success' });
    } catch (e) {
      showPop({ title: 'Error', message: 'Failed to duplicate scene.', type: 'error' });
    }
  }
};

const handleDelete = async (close) => {
  close();
  
  if (sceneStore.scenes.length <= 1) {
    await alert({ 
      title: 'Cannot Delete', 
      message: 'You must have at least one scene.', 
      type: 'warning'
    });
    return;
  }

  const sceneName = sceneStore.activeScene?.scriptId;
  const confirmed = await confirm({ 
    title: 'Delete Scene', 
    message: `Are you sure you want to delete "${sceneName}"?`,
    confirmText: 'Yes, Delete',
    type: 'danger'
  });
  
  if (confirmed) {
    try {
      const targetDeleteId = sceneStore.activeSceneId;
      const remainingScene = sceneStore.scenes.find(s => s.id !== targetDeleteId);
      
      sceneStore.removeScene(targetDeleteId);
      if (remainingScene) {
        sceneStore.setActiveScene(remainingScene.id);
      }
      
      syncSceneWithEngine();
      showPop({ title: 'Deleted', message: `Scene "${sceneName}" removed.`, type: 'success' });
    } catch (e) {
      showPop({ title: 'Error', message: 'Failed to delete scene.', type: 'error' });
    }
  }
};
</script>

<style scoped>
.dropdown-item {
  @apply flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>

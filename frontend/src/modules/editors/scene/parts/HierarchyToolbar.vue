<template>
  <div class="px-2 py-2 border-b border-border bg-background space-y-2">
    
    <div class="flex items-center gap-1.5">
      <div class="flex-1 min-w-0">
        <BaseSelect 
          v-model="sceneStore.activeSceneId" 
          :options="sceneStore.sceneOptions"
          placeholder="Select Scene..."
          height="1.75rem"
          class="w-full"
        />
      </div>

      <BaseDropdown align="right">
        <template #trigger="{ isOpen }">
          <button 
            class="h-7 w-7 flex items-center justify-center rounded-md border border-transparent hover:bg-muted text-muted-foreground transition-colors"
            :class="{ 'bg-muted text-foreground': isOpen }"
            title="Scene Options"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </template>

        <template #default="{ close }">
          <div class="flex flex-col text-xs min-w-[160px]">
            <div class="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Scene Actions
            </div>
            <button @click="handleCreate(close)" class="dropdown-item">
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>New Scene</span>
            </button>
            <button @click="handleRename(close)" :disabled="!sceneStore.activeSceneId" class="dropdown-item">
              <Edit2 class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>Rename Scene</span>
            </button>
            <button @click="handleDuplicate(close)" :disabled="!sceneStore.activeSceneId" class="dropdown-item">
              <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>Duplicate Scene</span>
            </button>
            <div class="h-[1px] bg-border my-1"></div>
            <button @click="handleDelete(close)" :disabled="!sceneStore.activeSceneId" class="dropdown-item text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 class="w-3.5 h-3.5 mr-2" /> <span>Delete Scene</span>
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <div class="flex items-center gap-1.5">
      <div class="relative flex-1">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input 
          type="text" 
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="Search..." 
          class="w-full h-7 pl-7 pr-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50"
        />
        <button 
          v-if="modelValue"
          @click="$emit('update:modelValue', '')"
          class="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full"
        >
          <X class="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      
      <BaseDropdown align="right">
        <template #trigger="{ isOpen }">
            <button 
                class="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                :class="{ 'bg-accent text-accent-foreground': isOpen }"
                title="Add Layer"
            >
                <Layers class="w-3.5 h-3.5" />
            </button>
        </template>
        <template #default="{ close }">
            <div class="flex flex-col text-xs min-w-[140px]">
                <button @click="$emit('add-layer', 'world'); close()" class="dropdown-item">
                    <Cuboid class="w-3.5 h-3.5 mr-2 text-blue-500" /> World Layer
                </button>
                <button @click="$emit('add-layer', 'ui'); close()" class="dropdown-item">
                    <Maximize class="w-3.5 h-3.5 mr-2 text-orange-500" /> UI Layer
                </button>
            </div>
        </template>
      </BaseDropdown>

      <button 
        @click="$emit('refresh')"
        class="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        :class="{ 'animate-spin': isRefreshing }"
        title="Refresh Tree"
      >
        <RefreshCw class="w-3.5 h-3.5" />
      </button>
    </div>

  </div>
</template>

<script setup>
import { 
  Search, X, RefreshCw, Layers, MoreVertical, 
  Plus, Trash2, Edit2, Copy, Cuboid, Maximize
} from 'lucide-vue-next'
import BaseSelect from '@ui/inputs/BaseSelect.vue'
import BaseDropdown from '@ui/overlay/BaseDropdown.vue'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { usePrompt } from '@/composables/usePrompt'
import { useConfirm } from '@/composables/useConfirm'
import { useAlert } from '@/composables/useAlert'

const props = defineProps({
  modelValue: String, 
  isRefreshing: Boolean
});

defineEmits(['update:modelValue', 'add-layer', 'refresh']);

const sceneStore = useSceneStore();
const { prompt } = usePrompt();
const { confirm } = useConfirm();
const { alert } = useAlert();

const handleCreate = async (close) => {
  const name = await prompt({ title: 'New Scene', message: 'Enter scene name:', defaultValue: 'New Scene' });
  if (name) sceneStore.addScene({ name });
  close();
};

const handleRename = async (close) => {
  const scene = sceneStore.activeScene;
  if (!scene) return;
  const name = await prompt({ title: 'Rename Scene', defaultValue: scene.name });
  if (name) sceneStore.updateSceneName(scene._id, name);
  close();
};

const handleDuplicate = async (close) => {
  if (sceneStore.activeSceneId) sceneStore.duplicateScene(sceneStore.activeSceneId);
  close();
};

const handleDelete = async (close) => {
  if (sceneStore.scenes.length <= 1) {
    await alert({ title: 'Cannot Delete Scene', message: 'You must have at least one scene in your project.', type: 'warning', buttonText: 'Understood' });
    close();
    return;
  }

  const confirmed = await confirm({ 
    title: 'Delete Scene', 
    message: `Are you sure you want to delete "${sceneStore.activeScene?.name}"?`,
    confirmText: 'Yes, Delete',
    type: 'danger'
  });
  
  if (confirmed) {
    try {
      sceneStore.removeScene(sceneStore.activeSceneId);
    } catch (e) {
      console.error(e);
    }
  }
  close();
};
</script>

<style scoped>
.dropdown-item {
    @apply flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
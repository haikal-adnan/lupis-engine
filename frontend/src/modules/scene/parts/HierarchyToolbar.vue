<template>
  <div class="px-2 py-2 border-b border-border bg-background space-y-2">
    
    <div class="flex items-center gap-1.5">
      <div class="flex-1 min-w-0">
        <BaseSelect 
          v-model="activeSceneId" 
          :options="sceneOptions"
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
            <button @click="handleRename(close)" :disabled="!activeSceneId" class="dropdown-item">
              <Edit2 class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>Rename Scene</span>
            </button>
            <button @click="handleDuplicate(close)" :disabled="!activeSceneId" class="dropdown-item">
              <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> <span>Duplicate Scene</span>
            </button>
            <div class="h-[1px] bg-border my-1"></div>
            <button @click="handleDelete(close)" :disabled="!activeSceneId" class="dropdown-item text-destructive hover:text-destructive hover:bg-destructive/10">
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
import { useSceneActions } from '@/modules/scene/composables/useSceneActions.js' 

const props = defineProps({
  modelValue: String, 
  isRefreshing: Boolean
});

// [UPDATED] Emits 'add-layer' with type payload
defineEmits(['update:modelValue', 'add-layer', 'refresh']);

const { 
  sceneOptions, 
  activeSceneId, 
  handleCreate, 
  handleRename, 
  handleDuplicate, 
  handleDelete 
} = useSceneActions();
</script>

<style scoped>
.dropdown-item {
    @apply flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
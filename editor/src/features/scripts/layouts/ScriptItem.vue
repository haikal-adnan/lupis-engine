<template>
  <div 
    data-testid="script-item"
    :data-node-id="data.id"
    :data-node-name="isFolder ? data.name : data.scriptId"
    :data-node-type="isFolder ? 'folder' : 'script'"
    :aria-selected="active ? 'true' : 'false'"
    :data-cut="isCut ? 'true' : 'false'"
    class="group relative select-none rounded-md border border-transparent cursor-pointer transition-all duration-200"
    :class="[
      containerClass,
      active ? 'bg-primary/10 border-primary/50' : 'hover:bg-secondary/80 hover:border-border/50',
      isDragOver ? 'ring-2 ring-primary bg-primary/20 scale-105' : '',
      isCut ? 'opacity-50 grayscale' : ''
    ]"
    :title="isFolder ? data.name : (data.scriptId || '')" 
    draggable="true"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click.stop="$emit('click', data.id)" 
    @dblclick.stop="$emit('dblclick', data)"
    @contextmenu.prevent.stop="$emit('contextmenu', $event, data)"
  >
    <div 
      class="flex items-center justify-center overflow-hidden shrink-0 relative transition-transform duration-200"
      :class="[
        viewMode === 'grid' 
          ? 'w-10 h-10 mb-2 rounded-sm group-hover:scale-105' 
          : 'w-4 h-4 mr-2'
      ]"
    >
      <Folder 
        v-if="isFolder" 
        :class="[viewMode === 'grid' ? 'w-full h-full' : 'w-4 h-4', 'text-amber-500 dark:text-amber-400/90 fill-current']" 
        :stroke-width="1.5" 
      />

      <div v-else class="w-full h-full flex items-center justify-center rounded-sm">
        <FileCode2 class="text-blue-500" :class="iconSizeClass" />
      </div>
    </div>

    <span 
      class="text-[11px] font-medium truncate transition-colors pointer-events-none"
      :class="[
        viewMode === 'grid' ? 'w-full text-center px-1' : 'flex-1',
        active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
      ]"
    >
      {{ isFolder ? data.name : data.scriptId }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Folder, FileCode2 } from 'lucide-vue-next'

const props = defineProps({
  data: { type: Object, required: true }, 
  viewMode: { type: String, default: 'grid' },
  active: { type: Boolean, default: false },
  isCut: { type: Boolean, default: false } 
})

const emit = defineEmits(['click', 'dblclick', 'contextmenu', 'move-item'])

const isDragOver = ref(false)

const isFolder = computed(() => props.data.type === 'folder' || props.data.isFolder === true)

const containerClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'flex flex-col items-center p-2 min-h-[80px]'
    : 'flex items-center px-2 py-1.5'
})

const iconSizeClass = computed(() => {
  return props.viewMode === 'grid' ? 'w-8 h-8 stroke-1' : 'w-4 h-4'
})

const onDragStart = (e) => {
  e.dataTransfer.setData('application/json', JSON.stringify({
    id: props.data.id,
    type: isFolder.value ? 'folder' : 'script',
    originalFolderId: props.data.folderId || props.data.parentId || null 
  }))
  e.dataTransfer.effectAllowed = 'move'
}

const onDragOver = (e) => {
  if (isFolder.value) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    isDragOver.value = true
  }
}

const onDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragOver.value = false
  }
}

const onDrop = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  isDragOver.value = false
  if (!isFolder.value) return 

  try {
    const dragData = e.dataTransfer.getData('application/json')
    if (dragData) {
      const { id, type } = JSON.parse(dragData)
      const targetFolderId = props.data.id

      if (id !== targetFolderId) {
        emit('move-item', { id, type, targetFolderId })
      }
    }
  } catch (error) {
    console.error("Failed drop on folder:", error)
  }
}
</script>
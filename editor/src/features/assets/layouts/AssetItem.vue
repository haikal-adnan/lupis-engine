<template>
  <div 
    class="group relative select-none rounded-md border border-transparent cursor-pointer transition-all duration-200"
    :class="[
      containerClass,
      active ? 'bg-primary/10 border-primary/50' : 'hover:bg-secondary/80 hover:border-border/50',
      !isSynced ? 'opacity-70 cursor-wait' : '',
      isDragOver ? 'ring-2 ring-primary bg-primary/20 scale-105' : '',
      isCut ? 'opacity-50 grayscale' : ''
    ]"
    :title="data.name" 
    :draggable="isSynced"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click.stop="$emit('click', data)" 
    @dblclick.stop="$emit('dblclick', data)"
    @contextmenu.prevent.stop="$emit('contextmenu', $event, data)"
  >
    <div v-if="!isSynced" class="absolute inset-0 z-20 striped-loading rounded-md border border-primary/30 pointer-events-none"></div>

    <div 
      class="flex items-center justify-center overflow-hidden shrink-0 relative transition-transform duration-200"
      :class="[
        viewMode === 'grid' 
          ? 'w-10 h-10 mb-2 rounded-sm group-hover:scale-105' 
          : 'w-4 h-4 mr-2'
      ]"
    >
      <Folder v-if="isFolder" :class="[viewMode === 'grid' ? 'w-full h-full' : 'w-4 h-4', 'text-amber-400/90 fill-current']" :stroke-width="1.5" />
      <div v-else-if="assetType === 'texture'" class="w-full h-full flex items-center justify-center bg-checkerboard rounded-sm overflow-hidden">
        <img v-if="thumbnailUrl" :src="thumbnailUrl" class="max-w-full max-h-full object-contain pixelated" loading="lazy" draggable="false" />
        <Image v-else class="text-muted-foreground" :class="viewMode === 'grid' ? 'w-6 h-6' : 'w-3.5 h-3.5'" />
      </div>
      <div v-else-if="assetType === 'font'" class="w-full h-full flex items-center justify-center rounded-sm overflow-hidden">
        <Type class="text-blue-400" :class="iconSizeClass" />
      </div>
      <Music v-else-if="['audio', 'sound'].includes(assetType)" class="text-emerald-500" :class="iconSizeClass" />
      <FileCode v-else-if="assetType === 'script'" class="text-yellow-500" :class="iconSizeClass" />
      <File v-else class="text-muted-foreground" :class="iconSizeClass" />
    </div>

    <span 
      class="text-[11px] font-medium truncate transition-colors pointer-events-none"
      :class="[
        viewMode === 'grid' ? 'w-full text-center px-1' : 'flex-1',
        active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
      ]"
    >
      {{ data.name }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Folder, Image, Music, FileCode, File, Type } from 'lucide-vue-next'
import { useAssetStore } from '@assets/assets.js'

const props = defineProps({
  data: { type: Object, required: true }, 
  viewMode: { type: String, default: 'grid' },
  active: { type: Boolean, default: false },
  isCut: { type: Boolean, default: false } 
})

const emit = defineEmits(['click', 'dblclick', 'contextmenu', 'move-asset'])

const assetStore = useAssetStore()
const isDragOver = ref(false)
const thumbnailUrl = ref(null)

const isFolder = computed(() => props.data.type === 'folder' || props.data.isFolder === true)

const assetType = computed(() => {
  if (isFolder.value) return 'folder'
  return props.data.type || 'file'
})

const isSynced = computed(() => props.data.isSynced !== false)

const containerClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'flex flex-col items-center p-2 min-h-[80px]'
    : 'flex items-center px-2 py-1.5'
})

const iconSizeClass = computed(() => {
  return props.viewMode === 'grid' ? 'w-8 h-8 stroke-1' : 'w-4 h-4'
})

const loadThumbnail = async () => {
  if (assetType.value === 'texture' && props.data.id) {
    thumbnailUrl.value = await assetStore.getAssetUrlById(props.data.id)
  } else {
    thumbnailUrl.value = null
  }
}

watch(() => props.data.id, loadThumbnail, { immediate: true })

const onDragStart = (e) => {
  if (!isSynced.value) {
    e.preventDefault()
    return
  }
  
  e.dataTransfer.setData('application/json', JSON.stringify({
    id: props.data.id,
    type: isFolder.value ? 'folder' : 'asset',
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
        emit('move-asset', { id, type, targetFolderId })
      }
    }
  } catch (error) {
    console.error("Failed to drop onto folder:", error)
  }
}
</script>
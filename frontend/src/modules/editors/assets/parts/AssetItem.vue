<template>
  <div 
    class="group relative select-none rounded-md border border-transparent cursor-pointer transition-all duration-200"
    :class="[
      containerClass,
      active ? 'bg-primary/10 border-primary/50' : 'hover:bg-secondary/80 hover:border-border/50',
      !isSynced ? 'opacity-70 cursor-wait' : '',
      isDragOver ? 'ring-2 ring-primary bg-primary/20 scale-105' : '',
      isCut ? 'opacity-50 grayscale' : '' /* Tambahan efek redup untuk Cut */
    ]"
    :title="data.name" 
    :draggable="isSynced"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
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
      class="text-[11px] font-medium truncate transition-colors"
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
import { ref, computed } from 'vue'
import { Folder, Image, Music, FileCode, File, Type } from 'lucide-vue-next'
import { useAssetStore } from '@/stores/useAssetStore.js'

const props = defineProps({
  data: { type: Object, required: true }, 
  viewMode: { type: String, default: 'grid' },
  active: { type: Boolean, default: false },
  isCut: { type: Boolean, default: false } 
})

const emit = defineEmits(['click', 'dblclick', 'contextmenu', 'move-asset'])

const assetStore = useAssetStore()
const isDragOver = ref(false)

const isFolder = computed(() => props.data.type === 'folder' || props.data.isFolder)

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

const thumbnailUrl = computed(() => {
  return assetStore.getAssetUrlById(props.data.id)
})

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
    isDragOver.value = true
    e.dataTransfer.dropEffect = 'move'
  }
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = (e) => {
  isDragOver.value = false
  if (!isFolder.value) return 

  try {
    const dragData = e.dataTransfer.getData('application/json')
    if (dragData) {
      const { id, type, originalFolderId } = JSON.parse(dragData)
      
      if (id !== props.data.id && originalFolderId !== props.data.id) {
        emit('move-asset', { id, type, targetFolderId: props.data.id })
      }
    }
  } catch (error) {}
}
</script>

<style scoped>
.pixelated { image-rendering: pixelated; }

.bg-checkerboard {
  background-image: 
    linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.striped-loading {
  background-size: 30px 30px;
  background-image: linear-gradient(
    45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%, transparent 50%,
    rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.05) 75%, transparent 75%, transparent
  );
  animation: stripe-move 1s linear infinite;
}

@keyframes stripe-move {
  0% { background-position: 0 0; }
  100% { background-position: 30px 30px; }
}
</style>
<template>
  <div 
    class="group relative select-none rounded-md border border-transparent cursor-pointer transition-all duration-200"
    :class="[
      containerClass,
      active ? 'bg-primary/10 border-primary/50' : 'hover:bg-secondary/80 hover:border-border/50',
      data.isGhost ? 'opacity-60 pointer-events-none' : ''
    ]"
    @click="$emit('click', data)"
    @dblclick="$emit('dblclick', data)"
    @contextmenu.prevent="$emit('contextmenu', $event, data)"
  >
    <div v-if="data.isGhost" class="absolute inset-0 z-20 striped-loading rounded-md bg-background/10"></div>

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
        :class="[
           viewMode === 'grid' ? 'w-full h-full' : 'w-4 h-4',
           'text-amber-400/90 fill-current'
        ]" 
        :stroke-width="1.5"
      />

      <div 
        v-else-if="assetType === 'image'" 
        class="w-full h-full flex items-center justify-center bg-checkerboard rounded-sm"
      >
        <img 
          v-if="data.thumbnailUrl" 
          :src="data.thumbnailUrl" 
          class="max-w-full max-h-full object-contain"
          style="image-rendering: pixelated;" 
          loading="lazy"
        />
        <Image v-else class="text-muted-foreground" :class="viewMode === 'grid' ? 'w-6 h-6' : 'w-3.5 h-3.5'" />
      </div>

      <Music v-else-if="assetType === 'audio'" class="text-emerald-500" :class="iconSizeClass" />

      <FileCode v-else-if="assetType === 'script'" class="text-yellow-500" :class="iconSizeClass" />

      <Type v-else-if="assetType === 'font'" class="text-blue-400" :class="iconSizeClass" />

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
import { computed } from 'vue'
import { Folder, Image, Music, FileCode, File, Type } from 'lucide-vue-next'

// HAPUS prop thumbnailUrl, cukup gunakan data
const props = defineProps({
  data: { type: Object, required: true }, 
  viewMode: { type: String, default: 'grid' },
  active: { type: Boolean, default: false }
})

defineEmits(['click', 'dblclick', 'contextmenu'])

const isFolder = computed(() => props.data.isFolder || props.data.itemType === 'folder')

const assetType = computed(() => {
  if (isFolder.value) return 'folder'
  return props.data.itemType || 'file'
})

const containerClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'flex flex-col items-center p-2 min-h-[80px]'
    : 'flex items-center px-2 py-1.5'
})

const iconSizeClass = computed(() => {
  return props.viewMode === 'grid' ? 'w-8 h-8 stroke-1' : 'w-4 h-4'
})
</script>

<style scoped>
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
    background: repeating-linear-gradient(
      45deg,
      rgba(255,255,255,0.05),
      rgba(255,255,255,0.05) 10px,
      transparent 10px,
      transparent 20px
    );
}
</style>
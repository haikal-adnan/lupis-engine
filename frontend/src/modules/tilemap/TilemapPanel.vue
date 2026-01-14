<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    <ScrollArea class="flex-1">
      <div class="p-2 space-y-1">
        <TilemapToolbar />
        <TilemapPreview />
        <TilemapPalette />
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue'

// Inspector Parts
import TilemapToolbar from '@modules/tilemap/components/TilemapToolbar.vue'
import TilemapPreview from '@modules/tilemap/components/TilemapPreview.vue'
import TilemapPalette from '@modules/tilemap/components/TilemapPalette.vue'

</script>
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

import TilemapToolbar from '@editors/tilemap/components/TilemapToolbar.vue'
import TilemapPreview from '@editors/tilemap/components/TilemapPreview.vue'
import TilemapPalette from '@editors/tilemap/components/TilemapPalette.vue'

</script>
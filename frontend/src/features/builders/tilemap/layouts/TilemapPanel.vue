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
import {
  ScrollArea
} from '@components/components.js';

import { TilemapToolbar, TilemapPreview, TilemapPalette } from '@builders/builders.js'

</script>
<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    <ScrollArea class="flex-1">
      <div class="p-2 space-y-2">
        <ShapeToolbar />
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>

import {
  ScrollArea,
} from '@components/components.js';

import { ShapeToolbar } from '@builders/builders.js'
</script>
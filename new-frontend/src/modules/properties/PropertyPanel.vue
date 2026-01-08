<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    
    <ScrollArea v-if="hasSelection" class="flex-1">
      <div class="p-2 space-y-1">
        <EditorObject />
        <EditorTransform />
        <EditorSprite />
        <EditorShape />
        <EditorText />
      </div>
    </ScrollArea>

    <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
      <div class="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
        <BoxSelect class="w-6 h-6 opacity-50" />
      </div>
      <p class="text-xs font-medium">No object selected</p>
    </div>
  </div>
</template>

<script setup>
import { BoxSelect } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

// Atomic Components
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue'

// Inspector Parts
import EditorObject from '@modules/properties/components/EditorObject.vue'
import EditorTransform from '@modules/properties/components/EditorTransform.vue'
import EditorSprite from '@modules/properties/components/EditorSprite.vue'
import EditorShape from '@modules/properties/components/EditorShape.vue'
import EditorText from '@modules/properties/components/EditorText.vue'

const { hasSelection } = useInspectorLogic();
</script>
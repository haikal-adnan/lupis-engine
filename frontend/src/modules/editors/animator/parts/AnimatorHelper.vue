<template>
  <div class="h-full flex flex-col bg-background text-foreground relative select-none">
    
    <div v-if="!hasAnimator" class="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
      <Film class="w-8 h-8 mb-2 text-muted-foreground" />
      <span class="text-xs font-medium">No Animator Component</span>
      <span class="text-[10px] mt-1">Select an entity with SpriteAnimator.</span>
    </div>

    <div v-else-if="!activeClipId" class="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
      <Film class="w-8 h-8 mb-2 text-muted-foreground" />
      <span class="text-xs font-medium">No Clip Selected</span>
      <span class="text-[10px] mt-1">Select or create a clip to start editing.</span>
    </div>

    <ScrollArea v-else class="flex-1">
      <div class="p-2 space-y-2 pb-20">
        <AnimatorProperty />
        <AnimatorSetting />
      </div>
    </ScrollArea>

  </div>
</template>

<script setup>
import { Film } from 'lucide-vue-next'
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue'
import { useAnimatorLogic } from "@editors/animator/composables/useAnimatorLogic.js"

import AnimatorProperty from './AnimatorProperty.vue'
import AnimatorSetting from './AnimatorSetting.vue'

const { hasAnimator, activeClipId } = useAnimatorLogic()
</script>
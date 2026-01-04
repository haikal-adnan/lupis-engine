<script setup>
import IconButton from '@ui/buttons/IconButton.vue'
import SceneHierarchy from '@/modules/scene/SceneHierarchy.vue'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'

defineProps({
  collapsed: Boolean
})

defineEmits(['toggle'])
</script>

<template>
  <div class="h-full flex flex-col bg-editor-sidebar overflow-hidden border-r border-border">
    <!-- Header (Expanded) -->
    <div
      v-if="!collapsed"
      class="h-10 shrink-0 flex items-center justify-between px-2 border-b border-border bg-muted/40 backdrop-blur-sm"
    >
      <h3
        class="pl-2 text-xs font-bold uppercase tracking-wider text-foreground/90 select-none"
      >
        Scene Hierarchy
      </h3>

      <IconButton
        ghost
        tooltip="Collapse Hierarchy"
        @click="$emit('toggle')"
      >
        <PanelLeftClose
          class="w-4 h-4 text-muted-foreground"
          :stroke-width="1.5"
        />
      </IconButton>
    </div>

    <!-- Header (Collapsed) -->
    <div
      v-else
      class="h-10 shrink-0 flex items-center justify-center border-b border-border bg-muted/40"
    >
      <IconButton
        ghost
        tooltip="Expand Hierarchy"
        @click="$emit('toggle')"
      >
        <PanelLeftOpen
          class="w-4 h-4 text-muted-foreground"
          :stroke-width="1.5"
        />
      </IconButton>
    </div>

    <!-- Content (Expanded) -->
    <div
      v-if="!collapsed"
      class="flex-1 overflow-y-auto scrollbar-thin bg-background"
    >
      <SceneHierarchy />
    </div>

    <!-- Content (Collapsed) -->
    <div
      v-else
      class="flex-1 py-4 flex items-center justify-center bg-background cursor-pointer hover:bg-muted/20 transition-colors"
      title="Expand Hierarchy"
      @click="$emit('toggle')"
    >
      <div
        class="writing-vertical-lr text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-70 select-none"
      >
        Hierarchy
      </div>
    </div>
  </div>
</template>

<style scoped>
.writing-vertical-lr {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: rotate(180deg);
}
</style>

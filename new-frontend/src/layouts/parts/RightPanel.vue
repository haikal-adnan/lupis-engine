<template>
  <div class="h-full flex flex-col bg-editor-sidebar overflow-hidden border-l border-border">
    <!-- Header (Expanded) -->
    <div
      v-if="!collapsed"
      class="h-10 shrink-0 flex items-center justify-between px-2 border-b border-border bg-muted/40 backdrop-blur-sm"
    >
      <h3 class="pl-2 text-xs font-bold uppercase tracking-wider text-foreground/90 select-none">
        Property Inspector
      </h3>

      <IconButton
        ghost
        tooltip="Collapse Inspector"
        @click="$emit('toggle')"
      >
        <PanelRightClose
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
        tooltip="Expand Inspector"
        @click="$emit('toggle')"
      >
        <PanelRightOpen
          class="w-4 h-4 text-muted-foreground"
          :stroke-width="1.5"
        />
      </IconButton>
    </div>

    <!-- Content (Expanded) -->
    <div
      v-if="!collapsed"
      class="flex-1 overflow-y-auto scrollbar-thin bg-editor-sidebar"
    >
      <PropertyPanel />
    </div>

    <!-- Content (Collapsed) -->
    <div
      v-else
      class="flex-1 py-4 flex items-center justify-center bg-background cursor-pointer hover:bg-muted/20 transition-colors"
      title="Expand Inspector"
      @click="$emit('toggle')"
    >
      <div
        class="writing-vertical-lr text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-70 select-none"
      >
        Inspector
      </div>
    </div>
  </div>
</template>

<script setup>
import IconButton from '@ui/buttons/IconButton.vue'
import { PanelRightClose, PanelRightOpen } from 'lucide-vue-next'
import PropertyPanel from '@modules/properties/PropertyPanel.vue'

defineProps({
  collapsed: Boolean
})

defineEmits(['toggle'])
</script>

<style scoped>
.writing-vertical-lr {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: rotate(180deg);
}
</style>

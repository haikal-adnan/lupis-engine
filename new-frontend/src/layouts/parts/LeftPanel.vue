<script setup>
import IconButton from '@ui/buttons/IconButton.vue'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Explorer' // Default title jika tidak di-pass
  }
})

defineEmits(['toggle'])
</script>

<template>
  <div class="h-full flex flex-col bg-editor-sidebar overflow-hidden border-r border-border transition-all duration-300">
    
    <div
      v-if="!collapsed"
      class="h-10 shrink-0 flex items-center justify-between px-2 border-b border-border bg-muted/40 backdrop-blur-sm"
    >
      <h3
        class="pl-2 text-xs font-bold uppercase tracking-wider text-foreground/90 select-none truncate"
        :title="title"
      >
        {{ title }}
      </h3>

      <IconButton
        ghost
        tooltip="Collapse Panel"
        @click="$emit('toggle')"
      >
        <PanelLeftClose
          class="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
          :stroke-width="1.5"
        />
      </IconButton>
    </div>

    <div
      v-else
      class="h-10 shrink-0 flex items-center justify-center border-b border-border bg-muted/40"
    >
      <IconButton
        ghost
        tooltip="Expand Panel"
        @click="$emit('toggle')"
      >
        <PanelLeftOpen
          class="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
          :stroke-width="1.5"
        />
      </IconButton>
    </div>

    <div
      v-show="!collapsed"
      class="flex-1 overflow-y-auto scrollbar-thin bg-background relative"
    >
      <slot />
    </div>

    <div
      v-if="collapsed"
      class="flex-1 py-4 flex items-center justify-center bg-background cursor-pointer hover:bg-secondary/30 transition-colors group"
      :title="'Expand ' + title"
      @click="$emit('toggle')"
    >
      <div
        class="writing-vertical-lr text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all select-none whitespace-nowrap"
      >
        {{ title }}
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
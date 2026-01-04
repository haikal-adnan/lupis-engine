<template>
  <div class="w-full select-none border-b border-border mb-1 last:border-0 group/section">
    <div class="flex items-center justify-between py-1 px-1 pr-2 hover:bg-muted/30 transition-colors">
      
      <div 
        @click="toggle"
        class="flex items-center gap-1 cursor-pointer flex-grow overflow-hidden py-1"
      >
        <ChevronRight 
          class="w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0"
          :class="[isOpen ? 'rotate-90 text-foreground' : 'text-muted-foreground']"
        />
        
        <span class="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors tracking-wide">
          {{ title }}
        </span>

        <slot name="header-extra"></slot>
      </div>

      <div class="flex items-center shrink-0" @click.stop>
        <BaseDropdown align="right">
          <template #trigger>
            <button 
              type="button"
              class="
                p-0.5 rounded text-muted-foreground/0 
                group-hover/section:text-muted-foreground hover:!text-foreground hover:bg-muted/80
                transition-all duration-200 focus:opacity-100 focus:text-foreground
              "
              :class="{ 'text-muted-foreground/100': isOpen }" 
            >
              <MoreVertical class="w-3.5 h-3.5" />
            </button>
          </template>

          <template #default="{ close }">
            <div class="flex flex-col text-sm min-w-[160px]">
              <slot name="menu" :close="close">
                <div class="px-2 py-1.5 text-xs text-muted-foreground">No actions</div>
              </slot>
            </div>
          </template>
        </BaseDropdown>
      </div>
    </div>

    <div 
      v-show="isOpen" 
      class="flex flex-col gap-3 px-3 pb-3 pt-0.5"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronRight, MoreVertical } from 'lucide-vue-next'
import BaseDropdown from '@/commons/components/overlay/BaseDropdown.vue'

const props = defineProps({
  title: { type: String, required: true },
  defaultOpen: { type: Boolean, default: true }
})

const isOpen = ref(props.defaultOpen)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>
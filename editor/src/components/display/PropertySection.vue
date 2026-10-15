<template>
  <div 
    class="w-full select-none border-b border-border mb-1 last:border-0 group/section"
    data-component="property-section"
    :data-section-title="title"
    :data-testid="testId"
  >
    <div class="flex items-center justify-between py-1 px-1 pr-2 hover:bg-muted/30 transition-colors">
      
      <div 
        @click="toggle"
        data-element="section-header"
        :data-testid="`${testId}-header`"
        :aria-expanded="collapsible ? isOpen : undefined"
        :role="collapsible ? 'button' : undefined"
        class="flex items-center gap-1 flex-grow overflow-hidden py-1"
        :class="collapsible ? 'cursor-pointer' : 'cursor-default'"
      >
        <ChevronRight 
          v-if="collapsible"
          class="w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0"
          :class="[isOpen ? 'rotate-90 text-foreground' : 'text-muted-foreground']"
        />
        <div v-else class="w-1"></div>
        
        <span class="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors tracking-wide">
          {{ title }}
        </span>

        <slot name="header-extra"></slot>
      </div>

      <div v-if="showMenu" class="flex items-center shrink-0" @click.stop>
        <BaseDropdown align="right">
          <template #trigger>
            <button 
              type="button"
              data-element="section-menu-trigger"
              :data-testid="`${testId}-menu-trigger`"
              aria-label="Section Options"
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
            <div
              class="flex flex-col text-sm min-w-[160px]"
              role="menu"
              data-element="section-menu-items"
              :data-testid="`${testId}-menu`"
            >
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
      data-element="section-content"
      :data-testid="`${testId}-content`"
      class="flex flex-col gap-3 px-3 pb-3 pt-0.5"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronRight, MoreVertical } from 'lucide-vue-next'
import { BaseDropdown } from '@components/components.js'

const props = defineProps({
  title: { type: String, required: true },
  // Base for all derived data-testid attributes: `${testId}-header`, `-menu-trigger`, `-menu`, `-content`
  testId: { type: String, default: 'property-section' },
  defaultOpen: { type: Boolean, default: true },
  collapsible: { type: Boolean, default: true }, 
  showMenu: { type: Boolean, default: true }
})

const isOpen = ref(props.collapsible ? props.defaultOpen : true)

function toggle() {
  if (props.collapsible) {
    isOpen.value = !isOpen.value
  }
}
</script>

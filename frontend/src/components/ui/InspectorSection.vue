<template>
  <div class="w-full select-none border-b border-border mb-2 pb-2">
    <div 
      @click="toggle"
      class="
        group flex items-center justify-between 
        py-2 px-2 rounded-md cursor-pointer 
        transition-all duration-200 ease-in-out
        border border-transparent
        hover:bg-secondary/50 
        hover:border-border/50 
        hover:shadow-sm
        active:scale-[0.99]
      "
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
            <slot name="icon"></slot>
        </div>
        
        <div class="flex items-center gap-2 truncate">
            <span v-if="title" class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {{ title }}
            </span>
            <slot name="header-extra"></slot>
        </div>
      </div>

      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" height="16" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" stroke-width="2" 
        stroke-linecap="round" stroke-linejoin="round"
        class="text-muted-foreground transition-transform duration-200 group-hover:text-foreground shrink-0 ml-2"
        :class="isOpen ? 'rotate-0' : '-rotate-90'"
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </div>

    <div v-show="isOpen" class="flex flex-col mt-2 space-y-4 px-1">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  defaultOpen: {
    type: Boolean,
    default: true
  }
})

const isOpen = ref(props.defaultOpen)

const toggle = () => {
  isOpen.value = !isOpen.value
}
</script>
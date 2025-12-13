<template>
  <div class="w-full select-none">
    <div 
      @click="isOpen = !isOpen"
      class="
        group flex items-center justify-between 
        py-2 px-2 rounded-md cursor-pointer 
        transition-all duration-200 ease-in-out
        border border-transparent

        /* HOVER EFFECTS */
        hover:bg-secondary/50 
        hover:border-border/50 
        hover:shadow-sm
        active:scale-[0.99]
      "
    >
      <div class="flex items-center gap-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" height="16" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round"
          class="text-muted-foreground group-hover:text-primary transition-colors"
        >
          <polyline points="5 9 2 12 5 15"></polyline>
          <polyline points="9 5 12 2 15 5"></polyline>
          <polyline points="15 19 12 22 9 19"></polyline>
          <polyline points="19 9 22 12 19 15"></polyline>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="12" y1="2" x2="12" y2="22"></line>
        </svg>
        
        <span class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Transform</span>
      </div>

      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" height="16" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" stroke-width="2" 
        stroke-linecap="round" stroke-linejoin="round"
        class="text-muted-foreground transition-transform duration-200 group-hover:text-foreground"
        :class="isOpen ? 'rotate-0' : '-rotate-90'"
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </div>

    <div 
      v-show="isOpen"
      class="flex flex-col mt-2 space-y-4 px-1"
    >
      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Position
        </label>
        <div class="grid grid-cols-2 gap-2">
          <BaseInput 
            v-model="transform.position.x" 
            prefix="X" 
            type="number"
            placeholder="0"
          />
          <BaseInput 
            v-model="transform.position.y" 
            prefix="Y" 
            type="number"
            placeholder="0"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Rotation
        </label>
        <div class="w-full">
          <BaseInput 
            v-model="transform.rotation" 
            prefix="°" 
            type="number"
            placeholder="0"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Scale
        </label>
        
        <div class="grid grid-cols-2 gap-2">
          <BaseInput 
            v-model="transform.scale.w" 
            prefix="W" 
            type="number"
            :step="0.01" 
            placeholder="1"
          />
          <BaseInput 
            v-model="transform.scale.h" 
            prefix="H" 
            type="number"
            :step="0.01"
            placeholder="1"
          />
        </div>

        <div class="w-full">
          <BaseInput 
            v-model="transform.scale.uniform" 
            prefix="*" 
            type="number"
            :step="0.01"
            placeholder="1"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Z-Index
        </label>
        <div class="w-full">
          <BaseInput 
            v-model="transform.zIndex" 
            prefix="Z" 
            type="number"
            placeholder="0"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import BaseInput from "../../ui/BaseInput.vue" 

const isOpen = ref(true)

const transform = reactive({
  position: { x: 2500, y: 2500 },
  rotation: 45,
  zIndex: 1,
  scale: { w: 1.0, h: 1.0, uniform: 1.0 }
})
</script>
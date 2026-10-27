<template>
  <div class="flex flex-col w-full gap-1.5 min-w-0">
    
    <div class="flex justify-between items-end min-w-0">
      <label 
        v-if="label"
        class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none truncate pr-2"
      >
        {{ label }}
      </label>
      
      <div class="shrink-0 flex items-center">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <div class="w-full relative min-w-0">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' }
})
</script>
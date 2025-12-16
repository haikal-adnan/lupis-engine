<template>
  <div class="space-y-2">
    <div class="flex justify-between items-center">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {{ label }}
        </label>
        <slot name="actions"></slot>
    </div>
    
    <div class="w-full">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  }
})
</script>
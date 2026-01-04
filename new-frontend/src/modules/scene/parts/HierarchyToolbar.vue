<template>
  <div class="flex items-center gap-2 p-2 border-b border-border bg-muted/10 shrink-0">
    <BaseSearchInput 
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      placeholder="Search nodes..." 
      class="flex-1"
    />
    
    <div class="flex items-center gap-1">
      <IconButton tooltip="Add Layer" ghost @click="$emit('add-layer')">
        <Layers class="w-4 h-4" />
      </IconButton>
      <IconButton tooltip="Refresh" ghost @click="$emit('refresh')">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
      </IconButton>
    </div>
  </div>
</template>

<script setup>
import { Layers, RefreshCw } from 'lucide-vue-next';
import BaseSearchInput from '@ui/inputs/BaseSearchInput.vue';
import IconButton from '@ui/buttons/IconButton.vue';

defineProps({
  modelValue: String,
  isRefreshing: Boolean
});

defineEmits(['update:modelValue', 'add-layer', 'refresh']);
</script>
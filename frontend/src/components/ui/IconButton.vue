<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'p-1.5 rounded-md transition-all duration-200 border border-transparent outline-none focus:ring-1 focus:ring-primary/50',
      active 
        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    ]"
    :title="title"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
})
defineEmits(['click'])
</script>
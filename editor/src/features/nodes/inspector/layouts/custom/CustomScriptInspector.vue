<template>
  <NodeData />
</template>

<script setup>
import NodeData from '../NodeData.vue';

defineProps({
  node: {
    type: Object,
    default: null
  }
});
</script>

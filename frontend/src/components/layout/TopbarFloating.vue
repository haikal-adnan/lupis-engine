<!-- components/layout/TopbarFloating.vue -->
<template>
  <div
    v-if="!minimized"
    class="fixed top-0 left-0 right-0 h-10 bg-black/50 backdrop-blur border-b border-white/10 flex items-center px-3 text-white"
  >
    <button @click="$emit('toggleDock')" class="mr-2 text-xs">Dock</button>
    <button @click="$emit('toggleMin')" class="text-xs">–</button>
    <span class="ml-3 font-semibold">Lupis Engine</span>
  </div>

  <div
    v-else
    class="fixed top-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs rounded-md cursor-pointer"
    @click="$emit('toggleMin')"
  >
    Topbar
  </div>
</template>

<script setup>
defineProps({
  minimized: Boolean,
  dock: Boolean
})
</script>

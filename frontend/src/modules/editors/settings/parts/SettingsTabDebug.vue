<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Editor Diagnostics</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Visual tools for monitoring performance during development.</p>
      </div>
      
      <div class="flex items-center justify-center bg-card border border-border rounded-xl p-8 shadow-sm">
        <p class="text-sm text-muted-foreground italic">
          Debug settings are currently unavailable.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({ info: Object });
</script>
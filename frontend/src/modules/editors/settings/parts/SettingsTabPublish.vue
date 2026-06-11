<template>
  <div class="animate-in fade-in duration-300 h-full flex flex-col items-center justify-center py-12 text-center">
    
    <div class="w-16 h-16 bg-muted/30 border-2 border-border/50 border-dashed rounded-2xl flex items-center justify-center mb-6 relative">
      <Box class="w-8 h-8 text-muted-foreground" />
      <div class="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
        Soon
      </div>
    </div>

    <h3 class="text-lg font-bold text-foreground mb-2">Build & Export Module</h3>
    <p class="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
      Modul kompilasi sedang dalam pengembangan. Nantinya Anda dapat meng-export proyek Lupis Engine ini menjadi file <b>.APK</b> (Android) atau format Web (<b>HTML5</b>).
    </p>

    <div class="flex gap-4">
      <button class="px-6 h-10 rounded-lg bg-muted text-muted-foreground font-medium text-sm cursor-not-allowed opacity-50 flex items-center gap-2">
        <MonitorPlay class="w-4 h-4" /> Export HTML5
      </button>
      <button class="px-6 h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm cursor-not-allowed opacity-50 flex items-center gap-2 shadow-sm">
        <Smartphone class="w-4 h-4" /> Build APK
      </button>
    </div>

  </div>
</template>

<script setup>
import { Box, Smartphone, MonitorPlay } from 'lucide-vue-next';

defineProps({ info: Object });
</script>
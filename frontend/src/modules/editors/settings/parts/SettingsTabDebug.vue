<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Editor Diagnostics</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Alat bantu visual untuk memantau performa selama proses pengembangan.</p>
      </div>
      
      <div class="space-y-5 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-sm font-medium text-foreground block">Show FPS Counter</span>
            <span class="text-[11px] text-muted-foreground">Menampilkan frame-rate secara real-time di pojok layar editor.</span>
          </div>
          <BaseCheckbox v-model="showFps" box-size="w-5 h-5" icon-size="w-3.5 h-3.5" />
        </div>

        <div class="h-px bg-border/50 w-full"></div>

        <div class="flex items-start justify-between">
          <div>
            <span class="text-sm font-medium text-foreground block">Draw Call Monitor</span>
            <span class="text-[11px] text-muted-foreground">Menampilkan total jumlah draw calls yang dieksekusi GPU.</span>
          </div>
          <BaseCheckbox v-model="showDrawCalls" box-size="w-5 h-5" icon-size="w-3.5 h-3.5" />
        </div>

        <div class="h-px bg-border/50 w-full"></div>

        <div class="flex items-start justify-between">
          <div>
            <span class="text-sm font-medium text-foreground block">Physics Wireframe Mode</span>
            <span class="text-[11px] text-muted-foreground">Mewarnai hijau semua bentuk collision (kotak/lingkaran) di scene.</span>
          </div>
          <BaseCheckbox v-model="physicsWireframe" box-size="w-5 h-5" icon-size="w-3.5 h-3.5" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

defineProps({ info: Object });

const showFps = ref(false);
const showDrawCalls = ref(false);
const physicsWireframe = ref(false);
</script>
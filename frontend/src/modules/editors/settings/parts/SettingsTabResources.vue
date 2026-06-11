<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Global Audio</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Pengaturan standar volume di seluruh scene saat permainan dijalankan.</p>
      </div>
      
      <div class="space-y-6">
        <PropertyRow label="Master Volume">
          <div class="flex gap-3">
            <BaseNumber v-model="masterVolume" height="2.5rem" text-size="text-sm" label-size="text-sm" :min="0" :max="1" :step="0.05" prefix="Vol" class="w-full font-mono" />
            <div class="text-sm font-mono text-muted-foreground bg-muted px-4 h-10 flex items-center rounded-md border border-border shrink-0 w-20 justify-center">
              {{ Math.round(masterVolume * 100) }}%
            </div>
          </div>
        </PropertyRow>
        
        <div class="flex items-center gap-8 py-2">
          <BaseCheckbox v-model="muteInEditor" label="Mute audio during Editor Preview" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
        </div>
      </div>
    </section>

    <section class="space-y-5 opacity-50">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Asset Compression <span class="text-[9px] uppercase bg-muted px-1.5 py-0.5 rounded ml-2">Soon</span></h4>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

defineProps({ info: Object });

const masterVolume = ref(1.0);
const muteInEditor = ref(false);
</script>
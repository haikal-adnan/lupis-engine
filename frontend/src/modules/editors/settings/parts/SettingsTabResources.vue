<template>
  <div class="animate-in fade-in duration-300 space-y-10 relative">
    
    <!-- Under Development Banner Info -->
    <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
      <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></div>
      <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">
        Audio Settings features are currently under active development and temporarily disabled.
      </p>
    </div>

    <!-- Disabled Wrapper (Blocks interaction and reduces opacity) -->
    <div class="pointer-events-none opacity-50 select-none space-y-10 filter grayscale-[30%]">
      
      <section class="space-y-5">
        <div class="border-b border-border pb-2">
          <h4 class="text-sm font-bold text-foreground">Global Audio</h4>
          <p class="text-xs text-muted-foreground mt-0.5">Default volume configurations across all scenes when the game is running.</p>
        </div>
        
        <div class="space-y-6">
          <PropertyRow label="Master Volume">
            <div class="flex gap-3">
              <BaseNumber v-model="masterVolume" height="2.5rem" text-size="text-sm" label-size="text-sm" :min="0" :max="1" :step="0.05" prefix="Vol" class="w-full font-mono" disabled />
              <div class="text-sm font-mono text-muted-foreground bg-muted px-4 h-10 flex items-center rounded-md border border-border shrink-0 w-20 justify-center">
                {{ Math.round(masterVolume * 100) }}%
              </div>
            </div>
          </PropertyRow>
          
          <div class="flex items-center gap-8 py-2">
            <BaseCheckbox v-model="muteInEditor" label="Mute audio during Editor Preview" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" disabled />
          </div>
        </div>
      </section>

      <section class="space-y-5 opacity-50">
        <div class="border-b border-border pb-2">
          <h4 class="text-sm font-bold text-foreground">Asset Compression <span class="text-[9px] uppercase bg-muted px-1.5 py-0.5 rounded ml-2">Soon</span></h4>
        </div>
      </section>

    </div>
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

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>
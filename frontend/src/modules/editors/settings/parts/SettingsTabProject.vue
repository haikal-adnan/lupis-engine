<template>
  <div class="animate-in fade-in duration-300 space-y-10">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Data Management</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Configure project storage and saving preferences within the editor.</p>
      </div>
      
      <div class="space-y-6">
        <div class="flex items-center gap-8 py-2">
          <BaseCheckbox v-model="autoSave" label="Enable Auto Save" box-size="w-4 h-4" icon-size="w-3 h-3" text-size="text-sm" />
        </div>
        
        <div :class="{ 'opacity-40 pointer-events-none filter grayscale': !autoSave }" class="transition-all duration-300">
          <PropertyRow label="Auto Save Interval">
            <div class="flex flex-col gap-2 w-full">
              <div class="flex items-center gap-3">
                <BaseNumber v-model="saveInterval" prefix="Min" height="2.5rem" text-size="text-sm" label-size="text-sm" class="font-mono flex-1" :min="10" :step="5" />
                <div class="text-sm font-mono text-muted-foreground bg-muted px-4 h-10 flex items-center rounded-md border border-border shrink-0">
                  Minutes
                </div>
              </div>
              <div class="flex items-start gap-2 mt-1 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle class="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p class="text-[11px] text-orange-600 dark:text-orange-400 leading-tight">
                  The minimum interval is 10 minutes to maintain optimal performance. Auto-save triggers only when the Lupis Editor tab is active and not idle.
                </p>
              </div>
            </div>
          </PropertyRow>
        </div>
      </div>
    </section>

    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Project Identity</h4>
      </div>
      <div class="p-6 text-center border-2 border-dashed border-border rounded-xl">
        <p class="text-xs text-muted-foreground italic">Project metadata (Name, Package, Version) will be added here.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue';

defineProps({ info: Object });

const autoSave = ref(true);
const saveInterval = ref(10); 
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>
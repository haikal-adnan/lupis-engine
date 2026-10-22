<template>
  <div class="space-y-8">
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Mini Console Diagnostics</h4>
        <p class="text-xs text-muted-foreground mt-0.5">
          Configure in-game mini console overlay for real-time debugging during game preview.
        </p>
      </div>

      <div class="space-y-6">
        <!-- Toggle Active -->
        <div class="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
          <div class="space-y-0.5">
            <span class="text-sm font-medium text-foreground">Enable Mini Console</span>
            <p class="text-xs text-muted-foreground">
              Displays logs and notification outputs directly over the game preview viewport (Toggle with Ctrl + F2).
            </p>
          </div>
          <BaseCheckbox 
            v-model="debugSettings.active" 
            @update:modelValue="saveSettings" 
            box-size="w-5 h-5" 
          />
        </div>

        <div :class="{ 'opacity-40 pointer-events-none filter grayscale': !debugSettings.active }" class="space-y-6 transition-all duration-300">
          
          <!-- 9-Point Alignment Grid -->
          <PropertyRow label="Console Screen Position">
            <div class="flex flex-col gap-3 w-full">
              <div class="grid grid-cols-3 gap-2 w-48 h-48 p-2 bg-muted/40 border border-border rounded-xl mx-auto md:mx-0">
                <button
                  v-for="pos in positionOptions"
                  :key="pos.value"
                  type="button"
                  @click="setPosition(pos.value)"
                  :title="pos.label"
                  :class="[
                    'rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-150',
                    debugSettings.position === pos.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  ]"
                >
                  {{ pos.short }}
                </button>
              </div>
              <p class="text-[11px] text-muted-foreground italic text-center md:text-left">
                Current Anchor: <span class="font-semibold text-foreground">{{ currentPositionLabel }}</span>
              </p>
            </div>
          </PropertyRow>

          <!-- Console Dimensions -->
          <PropertyRow label="Dimensions (Pixels)">
            <div class="grid grid-cols-2 gap-3 w-full">
              <BaseNumber
                v-model="debugSettings.width"
                @update:modelValue="saveSettings"
                prefix="W"
                height="2.5rem"
                text-size="text-xs"
                :min="200"
                :max="1200"
                :step="10"
              />
              <BaseNumber
                v-model="debugSettings.height"
                @update:modelValue="saveSettings"
                prefix="H"
                height="2.5rem"
                text-size="text-xs"
                :min="100"
                :max="800"
                :step="10"
              />
            </div>
          </PropertyRow>

          <!-- Maximum Log History -->
          <PropertyRow label="Max Log History">
            <BaseNumber
              v-model="debugSettings.maxLogs"
              @update:modelValue="saveSettings"
              prefix="Logs"
              height="2.5rem"
              text-size="text-xs"
              class="w-full"
              :min="10"
              :max="500"
              :step="10"
            />
          </PropertyRow>

        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useProjectStore } from '@projects/projects.js';
import {
  PropertyRow,
  BaseNumber,
  BaseCheckbox,
} from '@components/components.js';

const projectStore = useProjectStore();

const positionOptions = [
  { value: 'top-left', label: 'Top Left', short: 'TL' },
  { value: 'top-center', label: 'Top Center', short: 'TC' },
  { value: 'top-right', label: 'Top Right', short: 'TR' },
  { value: 'middle-left', label: 'Middle Left', short: 'ML' },
  { value: 'middle-center', label: 'Center', short: 'MC' },
  { value: 'middle-right', label: 'Middle Right', short: 'MR' },
  { value: 'bottom-left', label: 'Bottom Left', short: 'BL' },
  { value: 'bottom-center', label: 'Bottom Center', short: 'BC' },
  { value: 'bottom-right', label: 'Bottom Right', short: 'BR' },
];

const currentDebug = computed(() => projectStore.project?.settings?.debug || {});

const debugSettings = reactive({
  active: currentDebug.value.active ?? true,
  position: currentDebug.value.position || 'top-right',
  width: currentDebug.value.width ?? 360,
  height: currentDebug.value.height ?? 220,
  maxLogs: currentDebug.value.maxLogs ?? 50
});

watch(currentDebug, (newVal) => {
  if (newVal) {
    debugSettings.active = newVal.active ?? true;
    debugSettings.position = newVal.position || 'top-right';
    debugSettings.width = newVal.width ?? 360;
    debugSettings.height = newVal.height ?? 220;
    debugSettings.maxLogs = newVal.maxLogs ?? 50;
  }
}, { deep: true });

const currentPositionLabel = computed(() => {
  const match = positionOptions.find(p => p.value === debugSettings.position);
  return match ? match.label : 'Top Right';
});

const setPosition = (pos) => {
  debugSettings.position = pos;
  saveSettings();
};

const saveSettings = () => {
  projectStore.updateDebugSettings({
    active: Boolean(debugSettings.active),
    position: debugSettings.position,
    width: Number(debugSettings.width),
    height: Number(debugSettings.height),
    maxLogs: Number(debugSettings.maxLogs)
  });
};
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>
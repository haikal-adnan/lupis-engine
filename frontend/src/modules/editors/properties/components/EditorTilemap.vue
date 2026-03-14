<template>
  <PropertySection title="Tilemap" :icon="Grid3X3" v-if="hasComponent">
    
    <template #header-extra>
      <div class="flex items-center gap-2">
        <div 
          v-if="prefabId"
          class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
          :class="overridden 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
        >
          {{ overridden ? 'Override' : 'Sync' }}
        </div>

        <div class="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border font-mono">
          {{ totalWidth }}px × {{ totalHeight }}px
        </div>
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Tilemap'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Tilemap'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Remove Tilemap
        </button>
      </div>
    </template>

    <PropertyRow label="Source">
      <div class="flex gap-2 w-full">
        <BaseThumbnail 
          :src="currentTextureUrl"
          fallback-text="None"
          sizeClass="w-9 h-9 bg-muted/20 border-border/60 shrink-0 rounded"
          class="object-contain"
        />

        <BaseButton 
          @click="openTilemapEditor" 
          class="flex-1 h-9 text-xs gap-2 justify-center"
          variant="outline" 
        >
          <Brush class="w-3.5 h-3.5 text-primary" />
          <span>Open Editor</span>
        </BaseButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Opacity">
        <BaseNumber 
            prefix="%"
            v-model="displayOpacity" 
            :min="0" :max="100" :step="1" 
            class="font-mono w-full" 
        />
    </PropertyRow>

    <PropertyRow label="Auto Fit">
      <div class="flex items-center gap-2 w-full">
        <BaseButton 
          :active="autoFit"
          @click="toggleAutoFit"
          class="flex-1 h-7 text-xs gap-2" ghost
        >
          <Maximize class="w-3.5 h-3.5" /> <span>Auto Fit</span>
        </BaseButton>

        <IconButton 
          @click="resetTilemapTransform"
          tooltip="Reset Transform to Tilemap"
        >
          <RefreshCcw class="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Collision">
         <BaseCheckbox 
            v-model="isSolid" 
            label="Solid" 
            description="Enable collision"
            class="w-full"
          />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Grid3X3, Brush, Trash2, RefreshCw, Maximize, RefreshCcw } from "lucide-vue-next";
import { useTilemapLogic } from "@editors/tilemap/composables/useTilemapLogic.js";
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseThumbnail from "@/commons/components/display/BaseThumbnail.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseCheckbox from "@/commons/components/inputs/BaseCheckbox.vue"; 
import BaseButton from "@/commons/components/buttons/BaseButton.vue"; 
import IconButton from "@/commons/components/buttons/IconButton.vue";

const { 
  hasTilemap, 
  currentTextureUrl, 
  bindComponentProp, 
  openTilemapEditor,
} = useTilemapLogic();

const { 
  removeComponent,
  prefabId,            
  syncComponent,             
  getComponentOverrideStatus,
  resetTilemapTransform
} = useInspectorLogic();

const hasComponent = hasTilemap;

const autoFit = bindComponentProp('Tilemap', 'autoFit');

const toggleAutoFit = () => {
  autoFit.value = !autoFit.value;
  if (autoFit.value) {
    resetTilemapTransform();
  }
};

const overridden = getComponentOverrideStatus('Tilemap');
const tileWidth = bindComponentProp('Tilemap', 'tileWidth');
const tileHeight = bindComponentProp('Tilemap', 'tileHeight');
const mapWidth = bindComponentProp('Tilemap', 'width');
const mapHeight = bindComponentProp('Tilemap', 'height');
const isSolid = bindComponentProp('Tilemap', 'isSolid');
const rawOpacity = bindComponentProp('Tilemap', 'opacity');
const displayOpacity = computed({
  get: () => {
    return Math.round((rawOpacity.value ?? 1) * 100);
  },
  set: (newValue) => {
    rawOpacity.value = parseFloat((newValue / 100).toFixed(2));
  }
});

const totalWidth = computed(() => (tileWidth.value || 0) * (mapWidth.value || 0));
const totalHeight = computed(() => (tileHeight.value || 0) * (mapHeight.value || 0));
</script>
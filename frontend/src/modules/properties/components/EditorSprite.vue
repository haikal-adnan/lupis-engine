<template>
  <PropertySection title="Sprite Renderer" :icon="Image" v-if="hasComponent">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="isOverridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
      >
        {{ isOverridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        
        <button 
          @click="resetToOriginalSize(); close()" 
          :disabled="!assetId"
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Maximize class="w-3.5 h-3.5 mr-2 opacity-70" /> 
          Reset to Native Size
        </button>
        <div class="h-px bg-border my-1"></div>

        <template v-if="prefabId">
          <button 
            @click="syncComponent('SpriteRenderer'); close()" 
            :disabled="!isOverridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('SpriteRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <div class="flex gap-2.5 mb-1 pt-1">
      
      <BaseThumbnail 
        :src="currentTextureUrl"
        :rect="currentRect" 
        fallback-text="No Tex"
        sizeClass="w-[52px] h-[52px] bg-muted/20 border-border/60 shrink-0"
      />

      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <PropertyRow label="Texture" :no-margin="true">
          <button 
            type="button"
            @click="openAssetSelector"
            class="
              group flex items-center w-full relative text-left
              bg-secondary/40 border border-border rounded-md
              hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200
              focus:ring-1 focus:ring-primary
              cursor-pointer h-7 overflow-hidden
            "
            title="Click to select asset"
          >
            <span class="flex-1 px-2 text-[11px] font-mono text-muted-foreground/90 truncate select-none group-hover:text-foreground transition-colors">
              {{ assetId || 'None' }}
            </span>

            <div class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10 text-muted-foreground/50 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
              <FolderSearch class="w-3 h-3" />
            </div>
          </button>
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Source Rect" :no-margin="true">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber v-model="sourceX" prefix="X" :scrubbable="true" class="font-mono" />
          <BaseNumber v-model="sourceY" prefix="Y" :scrubbable="true" class="font-mono" />
          <BaseNumber v-model="sourceW" prefix="W" :min="0" :scrubbable="true" class="font-mono" />
          <BaseNumber v-model="sourceH" prefix="H" :min="0" :scrubbable="true" class="font-mono" />
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
    
  </PropertySection>
</template>

<script setup>
import { computed, ref } from "vue";
import { Image, FolderSearch, Trash2, RefreshCw, Maximize } from "lucide-vue-next"; 
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"; 
import { useAssetStore } from "@/stores/useAssetStore"; 

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseThumbnail from "@/commons/components/display/BaseThumbnail.vue"; 
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";

const { 
  selectedEntity, 
  bindComponentProp,
  currentTextureUrl,
  removeComponent,
  prefabId,           
  syncComponent,            
  getComponentOverrideStatus 
} = useInspectorLogic();

const assetStore = useAssetStore();

const hasComponent = computed(() => !!selectedEntity.value?.components?.SpriteRenderer);

const isOverridden = getComponentOverrideStatus('SpriteRenderer');

const assetId = bindComponentProp('SpriteRenderer', 'assetId');
const rawOpacity = bindComponentProp('SpriteRenderer', 'opacity');

const displayOpacity = computed({
  get: () => Math.round((rawOpacity.value ?? 1) * 100),
  set: (val) => {
    rawOpacity.value = parseFloat((val / 100).toFixed(2));
  }
});

const sourceX = bindComponentProp('SpriteRenderer', 'sourceX');
const sourceY = bindComponentProp('SpriteRenderer', 'sourceY');
const sourceW = bindComponentProp('SpriteRenderer', 'sourceWidth');
const sourceH = bindComponentProp('SpriteRenderer', 'sourceHeight');

const transformW = bindComponentProp('Transform', 'width');
const transformH = bindComponentProp('Transform', 'height');

const currentRect = computed(() => ({
    x: sourceX.value || 0,
    y: sourceY.value || 0,
    w: sourceW.value || 0,
    h: sourceH.value || 0
}));

function resetToOriginalSize() {
  if (!assetId.value) return;

  const asset = assetStore.getAssetById(assetId.value);
  
  if (asset && asset.meta?.dimensions) {
    const { w, h } = asset.meta.dimensions;

    sourceX.value = 0;
    sourceY.value = 0;
    sourceW.value = w;
    sourceH.value = h;

    transformW.value = w;
    transformH.value = h;
  }
}

function openAssetSelector() {
  console.log("Open Asset Panel triggered!");
}
</script>
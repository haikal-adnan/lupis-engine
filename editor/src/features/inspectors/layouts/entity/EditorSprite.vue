<template>
  <PropertySection title="Image Renderer" :icon="Image" v-if="hasComponent" data-testid="editor-sprite-renderer-section">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
        data-testid="sprite-renderer-prefab-status"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        <button 
          @click="resetToOriginalSize(); close()" 
          :disabled="!assetId || isControlledByAnimator"
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="sprite-renderer-reset-size-btn"
        >
          <Maximize class="w-3.5 h-3.5 mr-2 opacity-70" /> 
          Reset to Native Size
        </button>
        <div class="h-px bg-border my-1"></div>

        <template v-if="prefabId">
          <button 
            @click="syncComponent('SpriteRenderer'); close()" 
            :disabled="!overridden || isControlledByAnimator"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="sprite-renderer-menu-sync"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('SpriteRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
          data-testid="sprite-renderer-menu-remove"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <div class="relative mt-1">
      
      <div 
        v-if="isControlledByAnimator" 
        class="absolute -inset-1.5 z-10 bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-md text-center"
        data-testid="sprite-renderer-animator-overlay"
      >
        <Film class="w-6 h-6 text-white/80 mb-1.5" />
        <span class="text-xs text-white">
          Controlled by <strong class="font-bold">Animator</strong>
        </span>
        <span class="text-[10px] text-white/70 mt-0.5">
          Disabled the animator to edit manually.
        </span>
      </div>

      <div class="flex flex-col" :class="{ 'pointer-events-none': isControlledByAnimator }">
        <div class="flex gap-2.5 mb-1 pt-1">
          <BaseCropThumbnail 
            :src="currentTextureUrl"
            :rect="currentRect"
            @update:rect="updateSourceRect"
            :disabled="isControlledByAnimator"
            fallback-text="No Tex"
            name="Sprite Crop"
            sizeClass="w-[52px] h-[52px] bg-muted/20 border-border/60 shrink-0 rounded-md"
            data-testid="sprite-renderer-thumbnail"
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
                data-testid="sprite-renderer-asset-btn"
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
              <BaseNumber v-model="sourceX" prefix="X" :scrubbable="true" class="font-mono" data-testid="sprite-renderer-source-x" />
              <BaseNumber v-model="sourceY" prefix="Y" :scrubbable="true" class="font-mono" data-testid="sprite-renderer-source-y" />
              <BaseNumber v-model="sourceW" prefix="W" :min="0" :scrubbable="true" class="font-mono" data-testid="sprite-renderer-source-w" />
              <BaseNumber v-model="sourceH" prefix="H" :min="0" :scrubbable="true" class="font-mono" data-testid="sprite-renderer-source-h" />
            </div>
        </PropertyRow>

        <PropertyRow label="Opacity">
            <BaseNumber 
                prefix="%"
                v-model="displayOpacity" 
                :min="0" :max="100" :step="1" 
                class="font-mono w-full" 
                data-testid="sprite-renderer-opacity"
            />
        </PropertyRow>

        <PropertyRow label="Rendering">
          <div class="flex items-center gap-2 w-full">
            <BaseSelect 
              v-model="safeFilterMode" 
              :options="filterOptions" 
              class="flex-1"
              data-testid="sprite-renderer-filter-select"
            />
            
            <BaseButton 
              :active="useSDF"
              @click="useSDF = !useSDF"
              class="h-7 text-xs px-2.5 gap-1 shrink-0" 
              ghost
              tooltip="Enable Signed Distance Field rendering for sharp vector-like edges"
              data-testid="sprite-renderer-sdf-toggle"
              :data-active="useSDF"
            >
              <span>SDF</span>
            </BaseButton>
          </div>
        </PropertyRow>

      </div>
      
    </div>
  </PropertySection>
</template>

<script setup>
import { computed, ref } from "vue";
import { Image, FolderSearch, Trash2, RefreshCw, Maximize, Film } from "lucide-vue-next"; 

// Barrel import dari @inspectors/inspectors.js
import { 
  useInspectorSelection, 
  useInspectorPrefab, 
  useInspectorBinding 
} from "@inspectors/inspectors.js";

import { useAssetStore } from '@assets/assets.js'

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  BaseCropThumbnail,
  BaseSelect,
} from '@components/components.js';

// 1. Selection State
const { selectedEntity } = useInspectorSelection()

// 2. Prefab & Component Operations
const { 
  prefabId, 
  getComponentOverrideStatus, 
  syncComponent, 
  removeComponent 
} = useInspectorPrefab()

// 3. Property Bindings & Asset Reading
const { 
  bindComponentProp, 
  currentTextureUrl 
} = useInspectorBinding()

// Stores
const assetStore = useAssetStore();

// --- Logic Komponen ---
const hasComponent = computed(() => !!selectedEntity.value?.components?.SpriteRenderer);

const isControlledByAnimator = computed(() => {
  if (!selectedEntity.value) return false;
  const animator = selectedEntity.value.components?.SpriteAnimator;
  return (animator && animator.active);
});

const overridden = getComponentOverrideStatus('SpriteRenderer');

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

const filterMode = bindComponentProp('SpriteRenderer', 'filterMode');
const useSDF = bindComponentProp('SpriteRenderer', 'useSDF');

const safeFilterMode = computed({
  get: () => filterMode.value || 'pixelated',
  set: (val) => filterMode.value = val
});

const filterOptions = [
  { label: 'Pixelated', value: 'pixelated' },
  { label: 'Smooth', value: 'smooth' }
];

const transformW = bindComponentProp('Transform', 'width');
const transformH = bindComponentProp('Transform', 'height');

const uiTransformW = bindComponentProp('UITransform', 'width');
const uiTransformH = bindComponentProp('UITransform', 'height');

const currentRect = computed(() => ({
    x: sourceX.value || 0,
    y: sourceY.value || 0,
    w: sourceW.value || 0,
    h: sourceH.value || 0
}));

function updateSourceRect(rect) {
  if (!rect) return;

  const oldW = sourceW.value || 0;
  const oldH = sourceH.value || 0;

  sourceX.value = rect.x;
  sourceY.value = rect.y;
  sourceW.value = rect.w;
  sourceH.value = rect.h;

  // Sesuaikan nilai Transform width & height agar tampilan sprite proporsional dan tidak lonjong
  const hasUI = !!selectedEntity.value?.components?.UITransform;
  const currentW = hasUI ? uiTransformW.value : transformW.value;
  const currentH = hasUI ? uiTransformH.value : transformH.value;

  let targetW = rect.w;
  let targetH = rect.h;

  if (oldW > 0 && oldH > 0 && currentW > 0 && currentH > 0) {
    const scaleX = currentW / oldW;
    const scaleY = currentH / oldH;
    // Jika skala Transform sebelumnya seragam/proporsional (misalnya 2x), pertahankan faktor skala tersebut
    if (Math.abs(scaleX - scaleY) < 0.05 && scaleX > 0) {
      targetW = Math.round(rect.w * scaleX);
      targetH = Math.round(rect.h * scaleX);
    }
  }

  if (hasUI) {
    uiTransformW.value = targetW;
    uiTransformH.value = targetH;
  } else if (selectedEntity.value?.components?.Transform) {
    transformW.value = targetW;
    transformH.value = targetH;
  }
}

function resetToOriginalSize() {
  if (!assetId.value) return;
  const asset = assetStore.getAssetById(assetId.value);
  if (asset && asset.meta?.dimensions) {
    const { w, h } = asset.meta.dimensions;

    sourceX.value = 0;
    sourceY.value = 0;
    sourceW.value = w;
    sourceH.value = h;

    if (selectedEntity.value?.components?.UITransform) {
      uiTransformW.value = w;
      uiTransformH.value = h;
    } else if (selectedEntity.value?.components?.Transform) {
      transformW.value = w;
      transformH.value = h;
    }
  }
}

function openAssetSelector() {
  console.log("Open Asset Panel triggered!");
}
</script>
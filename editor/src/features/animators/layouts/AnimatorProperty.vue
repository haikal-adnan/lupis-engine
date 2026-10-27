<template>
  <PropertySection title="Clip Properties" :icon="Film" :default-open="true" data-testid="animator-property-section">
    
    <PropertyRow label="ID">
      <BaseInput 
        v-model="scriptId" 
        placeholder="e.g. walk_anim" 
        class="w-full font-mono text-xs text-blue-600 dark:text-blue-400" 
        :disabled="!activeClipData"
        data-testid="animator-property-script-id"
      />
    </PropertyRow>
    
    <div class="flex gap-2.5 mb-2 pt-1">
      <BaseCropThumbnail 
        :src="currentTextureUrl"
        :rect="baseTileRect"
        @update:rect="updateBaseTileRect"
        :disabled="!activeClipData"
        :name="assetScriptId || 'Clip Base Size Crop'"
        fallback-text="No Tex"
        sizeClass="w-[52px] h-[52px] bg-muted/20 border-border/60 shrink-0 rounded-md shadow-inner"
        data-testid="animator-property-texture-thumbnail"
      />

      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <PropertyRow label="Texture" :no-margin="true">
          <button 
            type="button"
            @click="openAssetSelector"
            :disabled="!activeClipData"
            class="
              group flex items-center w-full relative text-left
              bg-secondary/40 border border-border rounded-md
              hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200
              focus:ring-1 focus:ring-primary
              cursor-pointer h-7 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Click to select asset"
            data-testid="animator-property-texture-btn"
          >
            <span class="flex-1 px-2 text-[10px] font-mono text-muted-foreground/90 truncate select-none group-hover:text-foreground transition-colors">
              {{ assetScriptId || 'None' }}
            </span>

            <div class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10 text-muted-foreground/50 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
              <FolderSearch class="w-3.5 h-3.5" />
            </div>
          </button>
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Rendering">
      <div class="flex items-center gap-2 w-full">
        <BaseSelect 
          v-model="safeFilterMode" 
          :options="filterOptions" 
          class="flex-1"
          :disabled="!activeClipData"
          data-testid="animator-property-filter-select"
        />
        
        <BaseButton 
          :active="useSDF"
          @click="toggleSDF"
          class="h-7 text-xs px-2.5 gap-1 shrink-0" 
          ghost
          :disabled="!activeClipData"
          tooltip="Enable Signed Distance Field rendering"
          data-testid="animator-property-sdf-toggle"
        >
          <span>SDF</span>
        </BaseButton>
      </div>
    </PropertyRow>

    <div class="flex gap-3 items-start px-1">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Base Size">
          <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber v-model="baseWidth" prefix="W" :min="1" :step="1" class="font-mono" :disabled="!activeClipData" data-testid="animator-property-base-w" />
            <BaseNumber v-model="baseHeight" prefix="H" :min="1" :step="1" class="font-mono" :disabled="!activeClipData" data-testid="animator-property-base-h" />
          </div>
        </PropertyRow>
      </div>
      
      <div class="flex flex-col items-center gap-1.5 pt-1">
        <PivotControl 
          :x="pivotX" 
          :y="pivotY" 
          :disabled="!activeClipData"
          @update="handlePivotUpdate" 
          data-testid="animator-property-pivot"
        />
      </div>
    </div>

    <PropertyRow label="Frame Rate (FPS)">
      <BaseNumber v-model="fps" :min="1" :max="60" :step="1" class="font-mono w-full" :disabled="!activeClipData" data-testid="animator-property-fps" />
    </PropertyRow>

    <PropertyRow label="Loop Animation">
      <BaseSelect 
        v-model="isLooping" 
        :options="loopOptions" 
        class="w-full" 
        :disabled="!activeClipData"
        data-testid="animator-property-loop-select"
      />
    </PropertyRow>

    <PropertyRow label="Flip Horizontal">
      <button
        @click="flipX = !flipX"
        :aria-pressed="flipX"
        :disabled="!activeClipData"
        class="w-full py-1.5 flex items-center justify-center gap-2 border rounded-md transition-all text-xs font-bold outline-none"
        :class="flipX ? 'bg-primary/20 text-primary border-primary shadow-sm' : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary/60'"
        data-testid="animator-property-flipx-btn"
      >
        <FlipHorizontal class="w-3.5 h-3.5" />
        {{ flipX ? 'Active (Reverted)' : 'Inactive (Normal)' }}
      </button>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Film, FolderSearch, FlipHorizontal } from 'lucide-vue-next';
import { useAnimatorLogic } from '@animators/animators.js';
import { useAssetStore } from '@assets/assets.js';
import {
  PropertySection,
  PropertyRow,
  PivotControl,
  BaseInput,
  BaseNumber,
  BaseSelect,
  BaseButton,
  BaseCropThumbnail
} from '@components/components.js';

const { activeClipData, bindClipProp } = useAnimatorLogic();
const assetStore = useAssetStore();

const assetScriptId = computed(() => {
  const targetAssetId = activeClipData.value?.assetId;
  if (!targetAssetId) return null;
  const asset = assetStore.getAssetById(targetAssetId);
  return asset ? (asset.scriptId || asset.id) : targetAssetId;
});

const currentTextureUrl = ref(null);

watch(
  () => activeClipData.value?.assetId,
  async (newAssetId) => {
    if (!newAssetId) {
      currentTextureUrl.value = null;
      return;
    }
    try {
      currentTextureUrl.value = await assetStore.getAssetUrlById(newAssetId);
    } catch {
      currentTextureUrl.value = null;
    }
  },
  { immediate: true }
);

const scriptId = bindClipProp('scriptId', '');
const fps = bindClipProp('fps', 12);
const isLooping = bindClipProp('isLooping', true);
const flipX = bindClipProp('flipX', false);
const safeFilterMode = bindClipProp('filterMode', 'pixelated');
const useSDF = bindClipProp('useSDF', false);
const baseWidth = bindClipProp('baseSize.w', 32);
const baseHeight = bindClipProp('baseSize.h', 32);
const pivotX = bindClipProp('pivot.x', 0.5);
const pivotY = bindClipProp('pivot.y', 1.0);

const baseTileRect = computed(() => ({
  x: 0,
  y: 0,
  w: baseWidth.value || 32,
  h: baseHeight.value || 32
}));

const updateBaseTileRect = (rect) => {
  if (!rect) return;
  baseWidth.value = rect.w;
  baseHeight.value = rect.h;
};

const toggleSDF = () => {
  useSDF.value = !useSDF.value;
};

const filterOptions = [
  { label: 'Pixelated', value: 'pixelated' },
  { label: 'Smooth', value: 'smooth' }
];

const loopOptions = [
  { label: 'True (Loop)', value: true },
  { label: 'False (Once)', value: false }
];

const handlePivotUpdate = ({ x, y }) => {
  pivotX.value = x;
  pivotY.value = y;
};
</script>
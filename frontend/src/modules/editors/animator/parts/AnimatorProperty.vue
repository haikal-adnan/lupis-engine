<template>
  <PropertySection title="Clip Properties" :icon="Film" :default-open="true">
    
    <PropertyRow label="Clip ID">
      <BaseInput 
        v-model="scriptId" 
        placeholder="e.g. walk_anim" 
        class="w-full font-mono text-xs text-blue-400" 
        :disabled="!activeClipData"
      />
    </PropertyRow>

    <PropertyRow label="Clip Name">
      <BaseInput 
        v-model="clipName" 
        placeholder="e.g. Walk_Up" 
        class="w-full font-mono text-xs" 
        :disabled="!activeClipData"
      />
    </PropertyRow>
    
    <div class="flex gap-2.5 mb-2 pt-1">
      <BaseThumbnail 
        :src="currentTextureUrl"
        fallback-text="No Tex"
        sizeClass="w-[52px] h-[52px] bg-muted/20 border-border/60 shrink-0 rounded-md shadow-inner"
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
          >
            <span class="flex-1 px-2 text-[10px] font-mono text-muted-foreground/90 truncate select-none group-hover:text-foreground transition-colors">
              {{ activeClipData?.assetId || 'None' }}
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
        />
        
        <BaseButton 
          :active="useSDF"
          @click="toggleSDF"
          class="h-7 text-xs px-2.5 gap-1 shrink-0" 
          ghost
          :disabled="!activeClipData"
          tooltip="Enable Signed Distance Field rendering"
        >
          <span>SDF</span>
        </BaseButton>
      </div>
    </PropertyRow>

    <div class="flex gap-3 items-start px-1">
      <div class="flex-grow pt-[1px]">
        <PropertyRow label="Base Size">
          <div class="grid grid-cols-2 gap-2 flex-grow">
            <BaseNumber v-model="baseWidth" prefix="W" :min="1" :step="1" class="font-mono" :disabled="!activeClipData" />
            <BaseNumber v-model="baseHeight" prefix="H" :min="1" :step="1" class="font-mono" :disabled="!activeClipData" />
          </div>
        </PropertyRow>
      </div>
      
      <div class="flex flex-col items-center gap-1.5 pt-1">
        <PivotControl 
          :x="pivotX" 
          :y="pivotY" 
          :disabled="!activeClipData"
          @update="handlePivotUpdate" 
        />
      </div>
    </div>

    <PropertyRow label="Frame Rate (FPS)">
      <BaseNumber v-model="fps" :min="1" :max="60" :step="1" class="font-mono w-full" :disabled="!activeClipData" />
    </PropertyRow>

    <PropertyRow label="Loop Animation">
      <BaseSelect 
        v-model="isLooping" 
        :options="loopOptions" 
        class="w-full" 
        :disabled="!activeClipData"
      />
    </PropertyRow>

    <PropertyRow label="Flip Horizontal">
      <button
        @click="flipX = !flipX"
        :disabled="!activeClipData"
        class="w-full py-1.5 flex items-center justify-center gap-2 border rounded-md transition-all text-xs font-bold outline-none"
        :class="flipX ? 'bg-primary/20 text-primary border-primary shadow-sm' : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary/60'"
      >
        <FlipHorizontal class="w-3.5 h-3.5" />
        {{ flipX ? 'Active (Reverted)' : 'Inactive (Normal)' }}
      </button>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Film, FolderSearch, FlipHorizontal } from 'lucide-vue-next'
import { useAnimatorLogic } from '@editors/animator/composables/useAnimatorLogic.js'
import { useAssetStore } from '@/stores/useAssetStore'
import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import PivotControl from '@ui/inputs/PivotControl.vue'
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'
import BaseThumbnail from "@/commons/components/display/BaseThumbnail.vue"

const { activeClipData, syncAnimatorData } = useAnimatorLogic()

const assetStore = useAssetStore()

const currentTextureUrl = computed(() => {
  if (!activeClipData.value || !activeClipData.value.assetId) return null;
  return assetStore.getAssetUrlById(activeClipData.value.assetId);
})

const currentRect = computed(() => ({
    x: sourceX.value || 0,
    y: sourceY.value || 0,
    w: sourceW.value || 0,
    h: sourceH.value || 0
}));

const safeFilterMode = computed({
  get: () => activeClipData.value?.filterMode || 'pixelated',
  set: (val) => {
    if (activeClipData.value) {
      activeClipData.value.filterMode = val;
      syncAnimatorData();
    }
  }
})

const useSDF = computed(() => activeClipData.value?.useSDF || false)

const toggleSDF = () => {
  if (activeClipData.value) {
    activeClipData.value.useSDF = !activeClipData.value.useSDF;
    syncAnimatorData();
  }
}

const filterOptions = [
  { label: 'Pixelated', value: 'pixelated' },
  { label: 'Smooth', value: 'smooth' }
]

const clipName = computed({
  get: () => activeClipData.value?.name || '',
  set: (val) => { 
    if (activeClipData.value) {
      activeClipData.value.name = val;
      syncAnimatorData();
    }
  }
})

const scriptId = computed({
  get: () => activeClipData.value?.scriptId || '',
  set: (val) => { 
    if (activeClipData.value) {
      activeClipData.value.scriptId = val;
      syncAnimatorData();
    }
  }
})

const fps = computed({
  get: () => activeClipData.value?.fps || 12,
  set: (val) => { 
    if (activeClipData.value) {
      activeClipData.value.fps = val;
      syncAnimatorData();
    }
  }
})

const isLooping = computed({
  get: () => activeClipData.value?.isLooping ?? true,
  set: (val) => { 
    if (activeClipData.value) {
      activeClipData.value.isLooping = val;
      syncAnimatorData();
    }
  }
})

const flipX = computed({
  get: () => activeClipData.value?.flipX ?? false,
  set: (val) => {
    if (activeClipData.value) {
      activeClipData.value.flipX = val;
      syncAnimatorData();
    }
  }
})

const baseWidth = computed({
  get: () => activeClipData.value?.baseSize?.w || 32,
  set: (val) => { 
    if (activeClipData.value) {
      if (!activeClipData.value.baseSize) activeClipData.value.baseSize = { w: 32, h: 32 };
      activeClipData.value.baseSize.w = val;
      syncAnimatorData();
    }
  }
})

const baseHeight = computed({
  get: () => activeClipData.value?.baseSize?.h || 32,
  set: (val) => { 
    if (activeClipData.value) {
      if (!activeClipData.value.baseSize) activeClipData.value.baseSize = { w: 32, h: 32 };
      activeClipData.value.baseSize.h = val;
      syncAnimatorData();
    }
  }
})

const pivotX = computed({
  get: () => activeClipData.value?.pivot?.x || 0.5,
  set: (val) => { 
    if (activeClipData.value) {
      if (!activeClipData.value.pivot) activeClipData.value.pivot = { x: 0.5, y: 1.0 };
      activeClipData.value.pivot.x = val;
      syncAnimatorData();
    }
  }
})

const pivotY = computed({
  get: () => activeClipData.value?.pivot?.y || 1.0,
  set: (val) => { 
    if (activeClipData.value) {
      if (!activeClipData.value.pivot) activeClipData.value.pivot = { x: 0.5, y: 1.0 };
      activeClipData.value.pivot.y = val;
      syncAnimatorData();
    }
  }
})

const loopOptions = [
  { label: 'True (Loop)', value: true },
  { label: 'False (Once)', value: false }
]

const handlePivotUpdate = ({ x, y }) => {
  pivotX.value = x
  pivotY.value = y
}
</script>
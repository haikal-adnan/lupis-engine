<template>
  <PropertySection title="Audio Source" :icon="Volume2" v-if="hasComponent" data-testid="editor-audio-section">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
        data-testid="audio-prefab-status"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 min-w-[160px] space-y-0.5">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Audio'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="audio-menu-sync"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Audio'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
          data-testid="audio-menu-remove"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Component
        </button>
      </div>
    </template>

    <div class="space-y-2">
      
      <PropertyRow label="Active Status">
        <BaseButton 
          :active="!isMute"
          @click="isMute = !isMute"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
          data-testid="audio-active-toggle"
          :data-active="!isMute"
        >
          {{ !isMute ? 'Active' : 'Muted' }}
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Audio Type">
        <BaseSelect 
          v-model="audioType" 
          :options="[
            { label: 'Background', value: 'background' },
            { label: 'Sound Effect (SFX)', value: 'sfx' },
            { label: 'Voice', value: 'voice' }
          ]" 
          data-testid="audio-type-select" 
        />
      </PropertyRow>

      <PropertyRow label="Audio File" :no-margin="true">
        <div class="
            group flex items-center w-full relative text-left
            bg-secondary/40 border border-border rounded-md
            hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200
            focus-within:ring-1 focus-within:ring-primary
            h-7 overflow-hidden
          "
        >
          <button 
            type="button"
            @click="playAudio"
            :disabled="!assetId"
            class="flex-1 h-full px-2 text-left text-[11px] font-mono truncate select-none transition-colors outline-none"
            :class="assetId ? 'text-muted-foreground/90 hover:text-primary cursor-pointer' : 'text-muted-foreground/50 cursor-default'"
            :title="assetId ? 'Click to play audio' : 'No asset selected'"
            data-testid="audio-play-btn"
          >
            {{ displayAssetName }}
          </button>

          <button 
            type="button"
            @click="openAssetSelector"
            class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10 text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer outline-none"
            title="Click to select audio asset"
            data-testid="audio-asset-select-btn"
          >
            <FolderSearch class="w-3 h-3" />
          </button>
        </div>
      </PropertyRow>

      <div class="h-px bg-border/50 my-2"></div>

      <PropertyRow label="Volume">
        <BaseNumber 
          v-model="volumeDisplay" 
          prefix="%" 
          :min="0" :max="200" :step="1"
          class="font-mono w-full" 
          data-testid="audio-volume-input"
        />
      </PropertyRow>

      <PropertyRow label="Pitch (Speed)">
        <BaseNumber 
          v-model="pitch" 
          prefix="X" 
          :min="0.1" :max="3.0" :step="0.1" :precision="1"
          class="font-mono w-full" 
          data-testid="audio-pitch-input"
        />
      </PropertyRow>

      <div class="grid grid-cols-2 gap-2 mt-1">
        <BaseButton 
          :active="autoplay"
          @click="autoplay = !autoplay"
          class="h-7 text-xs flex justify-center items-center border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
          data-testid="audio-autoplay-toggle"
          :data-active="autoplay"
        >
          Play on Awake
        </BaseButton>

        <BaseButton 
          :active="loop"
          @click="loop = !loop"
          class="h-7 text-xs flex justify-center items-center border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
          data-testid="audio-loop-toggle"
          :data-active="loop"
        >
          <Repeat class="w-3.5 h-3.5 mr-1" :class="loop ? 'text-primary' : 'text-muted-foreground'" />
          <span :class="loop ? 'text-primary font-medium' : 'text-muted-foreground'">
            Loop
          </span>
        </BaseButton>
      </div>

      <div class="h-px bg-border/50 my-2"></div>

      <PropertyRow label="Global Audio">
        <BaseButton 
          :active="persist"
          @click="persist = !persist"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
          data-testid="audio-persist-toggle"
          :data-active="persist"
        >
          {{ persist ? 'Persist Across Scenes' : 'Destroy on Load' }}
        </BaseButton>
      </PropertyRow>

      <div class="grid grid-cols-2 gap-2 mt-1">
        <PropertyRow label="Fade In (s)" :no-margin="true">
          <BaseNumber 
            v-model="fadeIn" 
            :min="0" :max="10" :step="0.1" :precision="1"
            class="font-mono w-full text-xs" 
            data-testid="audio-fade-in-input"
          />
        </PropertyRow>
        <PropertyRow label="Fade Out (s)" :no-margin="true">
          <BaseNumber 
            v-model="fadeOut" 
            :min="0" :max="10" :step="0.1" :precision="1"
            class="font-mono w-full text-xs" 
            data-testid="audio-fade-out-input"
          />
        </PropertyRow>
      </div>

      <div class="h-px bg-border/50 my-2"></div>

      <div 
        class="transition-all duration-300 space-y-2"
        :class="{ 'opacity-40 pointer-events-none filter grayscale cursor-not-allowed': persist }"
      >
        <PropertyRow label="Spatial 2D">
          <BaseButton 
            :active="spatial"
            @click="spatial = !spatial"
            class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
            ghost
            :disabled="persist"
            data-testid="audio-spatial-toggle"
            :data-active="spatial"
          >
            {{ spatial ? 'Enabled (Positional)' : 'Disabled (Global)' }}
          </BaseButton>
        </PropertyRow>

        <template v-if="spatial">
          <PropertyRow label="Min Distance">
            <BaseNumber 
              v-model="refDistance" 
              prefix="px" 
              :min="0" :step="10"
              class="font-mono w-full" 
              :disabled="persist"
              data-testid="audio-ref-distance-input"
            />
          </PropertyRow>

          <PropertyRow label="Max Distance">
            <BaseNumber 
              v-model="maxDistance" 
              prefix="px" 
              :min="refDistance + 1" :step="10"
              class="font-mono w-full" 
              :disabled="persist"
              data-testid="audio-max-distance-input"
            />
          </PropertyRow>
        </template>
      </div>

      <div v-if="persist" class="px-1 mb-3 -mt-1">
        <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
          <Info class="w-3 h-3" /> Spatial 2D is disabled while Persist is active
        </div>
      </div>

    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Volume2, Trash2, RefreshCw, FolderSearch, Repeat, Info } from 'lucide-vue-next'

import { 
  useInspectorSelection, 
  useInspectorPrefab, 
  useInspectorBinding 
} from "@inspectors/inspectors.js";

import { useAssetStore } from '@assets/assets.js'
import { usePopAudio } from '@composables/composables.js';

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  BaseSelect
} from '@components/components.js';

const { selectedEntity } = useInspectorSelection()

const { 
  prefabId, 
  getComponentOverrideStatus, 
  syncComponent, 
  removeComponent 
} = useInspectorPrefab()

const { bindComponentProp } = useInspectorBinding()

const assetStore = useAssetStore()
const { showAudio } = usePopAudio()

const hasComponent = computed(() => !!selectedEntity.value?.components?.Audio)
const overridden = getComponentOverrideStatus('Audio')

// Direct Bindings
const assetId = bindComponentProp('Audio', 'assetId')
const rawAudioType = bindComponentProp('Audio', 'audioType')
const audioType = computed({
  get: () => rawAudioType.value || 'sfx',
  set: (val) => { rawAudioType.value = val; }
})
const isMute = bindComponentProp('Audio', 'isMute')

const rawVolume = bindComponentProp('Audio', 'volume')
const volumeDisplay = computed({
  get: () => Math.round((rawVolume.value ?? 1.0) * 100),
  set: (val) => { rawVolume.value = parseFloat((val / 100).toFixed(2)); }
})

const pitch = bindComponentProp('Audio', 'pitch')
const loop = bindComponentProp('Audio', 'loop')
const autoplay = bindComponentProp('Audio', 'autoplay')
const spatial = bindComponentProp('Audio', 'spatial')
const persist = bindComponentProp('Audio', 'persist') 
const fadeIn = bindComponentProp('Audio', 'fadeIn')   
const fadeOut = bindComponentProp('Audio', 'fadeOut') 
const refDistance = bindComponentProp('Audio', 'refDistance')
const maxDistance = bindComponentProp('Audio', 'maxDistance')

const audioAsset = computed(() => {
  if (!assetId.value) return null;
  return assetStore.assets.find(a => a.id === assetId.value);
});

const displayAssetName = computed(() => {
  return audioAsset.value ? (audioAsset.value.scriptId || audioAsset.value.displayName || 'Asset') : 'None Selected';
});

function playAudio() {
  if (!audioAsset.value) return;
  const audioUrl = assetStore.getAssetUrlById(assetId.value);
  showAudio(audioUrl, displayAssetName.value);
}

function openAssetSelector() {
  console.log("Open Asset Selector for Audio");
}
</script>
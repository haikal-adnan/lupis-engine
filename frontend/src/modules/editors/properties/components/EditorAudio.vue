<template>
  <PropertySection title="Audio Bank" :icon="Volume2" v-if="hasComponent">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
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
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Audio'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Component
        </button>
      </div>
    </template>

    <div class="flex items-end gap-1.5 mb-2">
      <div class="flex-1 min-w-0 transition-opacity duration-200" :class="{ 'opacity-50': isMute }">
        <div class="mb-1 text-[10px] font-bold text-muted-foreground uppercase flex justify-between items-center">
            <span>Audio Clips</span>
        </div>
        <BaseSelect
          v-model="currentClipId"
          :options="clipOptions"
          placeholder="No clips available"
          class="w-full"
          :disabled="clipOptions.length === 0"
        />
      </div>

      <BaseDropdown align="right">
        <template #trigger="{ isOpen }">
          <button 
            class="h-7 w-7 flex items-center justify-center rounded-md border border-input hover:bg-accent text-muted-foreground transition-colors"
            :class="{ 'bg-accent text-foreground': isOpen }"
            title="Clip Options"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </template>
        <template #default="{ close }">
          <div class="flex flex-col text-xs min-w-[160px] py-1">
            <button 
              @click="addClip(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <Plus class="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>Add Clip...</span>
            </button>
            <button 
              v-if="currentClipId"
              @click="removeCurrentClip(); close()"
              class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-destructive/10 text-destructive hover:text-destructive text-left transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5 mr-2" />
              <span>Remove Current</span>
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>

    <div v-if="currentClipData" class="space-y-2">
      
      <PropertyRow label="Active Status">
        <BaseButton 
          :active="!isMute"
          @click="isMute = !isMute"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >
          <Volume2 v-if="!isMute" class="w-3.5 h-3.5 text-primary" />
          <VolumeX v-else class="w-3.5 h-3.5 text-muted-foreground" />
          <span :class="!isMute ? 'text-foreground' : 'text-muted-foreground'">
            {{ !isMute ? 'Active' : 'Muted' }}
          </span>
        </BaseButton>
      </PropertyRow>

      <div class="h-px bg-border/50 my-2"></div>

      <PropertyRow label="Script ID">
        <BaseInput 
          v-model="clipScriptId" 
          placeholder="e.g. JUMP_SFX" 
          class="font-mono text-xs w-full" 
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
            :disabled="!clipAssetId"
            class="flex-1 h-full px-2 text-left text-[11px] font-mono truncate select-none transition-colors outline-none"
            :class="clipAssetId ? 'text-muted-foreground/90 hover:text-primary cursor-pointer' : 'text-muted-foreground/50 cursor-default'"
            :title="clipAssetId ? 'Click to play audio' : 'No asset selected'"
          >
            {{ displayAssetName }}
          </button>

          <button 
            type="button"
            @click="openAssetSelector"
            class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10 text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer outline-none"
            title="Click to select audio asset"
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
        />
      </PropertyRow>

      <PropertyRow label="Pitch (Speed)">
        <BaseNumber 
          v-model="pitch" 
          prefix="X" 
          :min="0.1" :max="3.0" :step="0.1" :precision="1"
          class="font-mono w-full" 
        />
      </PropertyRow>

      <div class="grid grid-cols-2 gap-2 mt-1">
        <BaseButton 
          :active="autoplay"
          @click="autoplay = !autoplay"
          class="h-7 text-xs flex justify-center items-center border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >
          <span :class="autoplay ? 'text-white font-medium' : 'text-muted-foreground'">
            Play on Awake
          </span>
        </BaseButton>

        <BaseButton 
          :active="loop"
          @click="loop = !loop"
          class="h-7 text-xs flex justify-center items-center border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
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
        >
          <span :class="persist ? 'text-white font-medium' : 'text-muted-foreground'">
            {{ persist ? 'Persist Across Scenes' : 'Destroy on Load' }}
          </span>
        </BaseButton>
      </PropertyRow>

      <div class="grid grid-cols-2 gap-2 mt-1">
        <PropertyRow label="Fade In (s)" :no-margin="true">
          <BaseNumber 
            v-model="fadeIn" 
            :min="0" :max="10" :step="0.1" :precision="1"
            class="font-mono w-full text-xs" 
          />
        </PropertyRow>
        <PropertyRow label="Fade Out (s)" :no-margin="true">
          <BaseNumber 
            v-model="fadeOut" 
            :min="0" :max="10" :step="0.1" :precision="1"
            class="font-mono w-full text-xs" 
          />
        </PropertyRow>
      </div>

      <div class="h-px bg-border/50 my-2"></div>

      <div 
        class="transition-all duration-300 space-y-2"
        :class="{ 
          'opacity-40 pointer-events-none filter grayscale cursor-not-allowed': persist 
        }"
      >
        <PropertyRow label="Spatial 2D">
          <BaseButton 
            :active="spatial"
            @click="spatial = !spatial"
            class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
            ghost
            :disabled="persist"
          >
            <span :class="spatial ? 'text-white font-medium' : 'text-muted-foreground'">
              {{ spatial ? 'Enabled (Positional)' : 'Disabled (Global)' }}
            </span>
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
            />
          </PropertyRow>

          <PropertyRow label="Max Distance">
            <BaseNumber 
              v-model="maxDistance" 
              prefix="px" 
              :min="refDistance + 1" :step="10"
              class="font-mono w-full" 
              :disabled="persist"
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

    <div v-else class="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded">
        Select "Add Clip..." from menu to start.
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Volume2, VolumeX, Trash2, RefreshCw, FolderSearch, Repeat, MoreVertical, Plus, Info } from 'lucide-vue-next'
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"
import { useAssetStore } from '@/stores/useAssetStore'
import { usePopAudio } from '@/composables/usePopAudio'
import { useConfirm } from '@/composables/useConfirm' 

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue"
import BaseDropdown from '@ui/overlay/BaseDropdown.vue'

const { 
  bindComponentProp, 
  removeComponent, 
  selectedEntity,
  prefabId,                
  syncComponent,          
  getComponentOverrideStatus 
} = useInspectorLogic()

const assetStore = useAssetStore()
const { showAudio } = usePopAudio()
const { confirm } = useConfirm() 

const hasComponent = computed(() => !!selectedEntity.value?.components?.Audio)
const overridden = getComponentOverrideStatus('Audio')

const clips = bindComponentProp('Audio', 'clips')
const currentClipId = bindComponentProp('Audio', 'currentClip')

const activeClipIndex = computed(() => {
  if (!clips.value || !currentClipId.value) return -1;
  return clips.value.findIndex(c => c._id === currentClipId.value);
});

const currentClipData = computed(() => {
  const idx = activeClipIndex.value;
  if (idx === -1) return null;
  return clips.value[idx];
});

const clipOptions = computed(() => {
  if (!clips.value) return [];
  return clips.value.map((c, index) => {
    const name = c.scriptId || `Clip ${index + 1}`;
    return {
      label: name + (c.isMute ? ' (Muted)' : ''),
      value: c._id
    }
  });
});

function addClip() {
  const newId = crypto.randomUUID().split('-')[0];
  const currentArray = clips.value ? [...clips.value] : [];
  
  const newClip = {
    _id: newId,
    scriptId: `AUDIO_${currentArray.length + 1}`,
    assetId: null,
    isMute: false,
    volume: 1.0,
    pitch: 1.0,
    loop: false,
    autoplay: false,
    spatial: false,
    persist: false, 
    fadeIn: 0.0,    
    fadeOut: 0.0,   
    refDistance: 100,
    maxDistance: 1000
  };

  currentArray.push(newClip);
  clips.value = currentArray;
  currentClipId.value = newId;
}

async function removeCurrentClip() {
  const idx = activeClipIndex.value;
  if (idx === -1) return;

  const scriptName = currentClipData.value.scriptId || 'Unnamed Clip';
  const isConfirmed = await confirm({
    title: 'Remove Clip?',
    message: `Are you sure you want to remove "${scriptName}"?`,
    confirmText: 'Yes, Remove',
    type: 'danger'
  });

  if (isConfirmed) {
    const currentArray = [...clips.value];
    currentArray.splice(idx, 1);
    clips.value = currentArray;
    
    currentClipId.value = currentArray.length > 0 ? currentArray[0]._id : null;
  }
}

function createClipProp(propName) {
  return computed({
    get: () => {
      if (!currentClipData.value) return null;
      return currentClipData.value[propName];
    },
    set: (val) => {
      const idx = activeClipIndex.value;
      if (idx === -1) return;
      const newClips = [...clips.value];
      newClips[idx] = { ...newClips[idx], [propName]: val };
      clips.value = newClips; 
    }
  });
}

const clipScriptId = createClipProp('scriptId');
const clipAssetId = createClipProp('assetId');
const isMute = createClipProp('isMute');

const rawVolume = createClipProp('volume');
const volumeDisplay = computed({
  get: () => Math.round((rawVolume.value ?? 1.0) * 100),
  set: (val) => { rawVolume.value = parseFloat((val / 100).toFixed(2)); }
});

const pitch = createClipProp('pitch');
const loop = createClipProp('loop');
const autoplay = createClipProp('autoplay');
const spatial = createClipProp('spatial');
const persist = createClipProp('persist'); 
const fadeIn = createClipProp('fadeIn');   
const fadeOut = createClipProp('fadeOut'); 
const refDistance = createClipProp('refDistance');
const maxDistance = createClipProp('maxDistance');

const audioAsset = computed(() => {
  if (!clipAssetId.value) return null;
  return assetStore.assets.find(a => a._id === clipAssetId.value || a.id === clipAssetId.value);
});

const displayAssetName = computed(() => {
  return audioAsset.value ? (audioAsset.value.displayName || audioAsset.value.name) : 'None Selected';
});

function playAudio() {
  if (!audioAsset.value) return;
  const audioUrl = assetStore.getAssetUrlById(clipAssetId.value);
  showAudio(audioUrl, displayAssetName.value);
}

function openAssetSelector() {
  console.log("Open Asset Selector for Audio");
}
</script>
<template>
  <PropertySection 
    title="Sprite Animator" 
    :icon="Film" 
    v-if="hasComponent"
  >
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
            @click="syncComponent('SpriteAnimator'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('SpriteAnimator'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Animator
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-2">
      
      <PropertyRow label="Status">
        <BaseButton 
          :active="active"
          @click="active = !active"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >
          <Power v-if="active" class="w-3.5 h-3.5 text-emerald-500" />
          <Power v-else class="w-3.5 h-3.5 text-muted-foreground" />
          <span :class="active ? 'text-foreground font-medium' : 'text-muted-foreground'">
            {{ active ? 'Enabled' : 'Disabled' }}
          </span>
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Playback">
        <BaseButton 
          :active="isPlaying && active"
          :disabled="!active"
          @click="togglePlay"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all disabled:opacity-40"
          ghost
        >
          <Play v-if="isPlaying" class="w-3.5 h-3.5" />
          <Pause v-else class="w-3.5 h-3.5 text-muted-foreground" />
          <span :class="isPlaying && active ? 'text-foreground' : 'text-muted-foreground'">
            {{ isPlaying ? 'Playing' : 'Paused' }}
          </span>
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Current Frame" v-if="active && selectedClipData">
        <div class="flex items-center gap-2 w-full">
          <BaseNumber 
            v-model="displayFrame" 
            :step="1" 
            :min="1" 
            :max="maxFrames" 
            prefix="F" 
            :disabled="isPlaying"
            :cyclic="true"
            class="font-mono w-full" 
          />
          <div class="text-[10px] text-muted-foreground whitespace-nowrap opacity-70">
            of {{ maxFrames }}
          </div>
        </div>
      </PropertyRow>

      <PropertyRow label="Current Clip">
        <BaseSelect 
          v-model="currentClip"
          :options="clipOptions"
          placeholder="Select Clip..."
          class="w-full"
          :disabled="clipOptions.length === 0 || !active"
        />
      </PropertyRow>

      <div class="h-px bg-border my-1"></div>

      <PropertyRow label="Clips Data">
        <div class="flex items-center gap-2 w-full">
          <div class="text-xs text-muted-foreground flex-1 truncate">
            {{ clipCount }} clip(s) defined
          </div>
          <BaseButton 
            @click="openAnimatorEditor"
            class="h-7 text-xs gap-2 shrink-0 px-3"
            variant="outline" 
          >
            <Film class="w-3.5 h-3.5 text-primary" />
            <span>Open Editor</span>
          </BaseButton>
        </div>
      </PropertyRow>

    </div>
  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Film, Trash2, RefreshCw, Play, Pause, Power } from 'lucide-vue-next'
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"
import { useAnimatorLogic } from "@editors/animator/composables/useAnimatorLogic.js"

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue"
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue"
import BaseButton from "@/commons/components/buttons/BaseButton.vue"

const { 
  selectedEntity,
  removeComponent,
  prefabId,
  syncComponent,
  getComponentOverrideStatus,
  bindComponentProp
} = useInspectorLogic()

const { openAnimatorEditor } = useAnimatorLogic()

const hasComponent = computed(() => !!selectedEntity.value?.components?.SpriteAnimator)
const overridden = getComponentOverrideStatus('SpriteAnimator')

// Data Binding
const rawActive = bindComponentProp('SpriteAnimator', 'active')
const active = computed({
  get: () => rawActive.value ?? true,
  set: (val) => rawActive.value = val
})

const currentClip = bindComponentProp('SpriteAnimator', 'currentClip')
const isPlaying = bindComponentProp('SpriteAnimator', 'isPlaying')
const clips = bindComponentProp('SpriteAnimator', 'clips')

// --- LOGIKA FRAME UNTUK COLLIDER MAPPING ---

// Mengambil data clip yang sedang dipilih
const selectedClipData = computed(() => {
  if (!clips.value || !currentClip.value) return null
  return clips.value.find(c => c.id === currentClip.value)
})

const maxFrames = computed(() => selectedClipData.value?.frames?.length || 0)

const displayFrame = computed({
  get: () => {
    // Membaca frameIndex langsung dari data clip, default ke 0
    const currentIndex = selectedClipData.value?.frameIndex || 0
    return currentIndex + 1 // Tampilan user dimulai dari 1
  },
  set: (val) => {
    if (selectedClipData.value) {
      // Simpan kembali ke sistem sebagai 0-based index
      selectedClipData.value.frameIndex = Math.max(0, val - 1)
      
      // Memicu trigger setter agar bindComponentProp menyimpannya ke state engine
      clips.value = [...clips.value]
    }
  }
})

// --------------------------------------------

const togglePlay = () => {
  if (!active.value) return
  isPlaying.value = !isPlaying.value
}

const clipOptions = computed(() => {
  if (!clips.value || !Array.isArray(clips.value)) return []
  return clips.value
    .filter(clip => clip.type === 'clip')
    .map(clip => ({
      label: clip.name,
      value: clip.id
    }))
})

const clipCount = computed(() => {
  if (!clips.value || !Array.isArray(clips.value)) return 0
  return clips.value.filter(clip => clip.type === 'clip').length
})
</script>
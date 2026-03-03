<template>
  <PropertySection title="Layer" :icon="Layers" v-if="layer">
    <template #header-extra>
      <div class="flex items-center gap-2 max-w-[180px]">
        <div 
          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border select-none shrink-0"
          :class="isUISection 
            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' 
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
        >
          {{ isUISection ? 'UI Layer' : 'World Layer' }}
        </div>
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        <button @click="onCopyId(); close()" class="menu-item">
          <Copy class="w-3.5 h-3.5 mr-2 opacity-70" /> Copy ID
        </button>
        <div class="h-px bg-border my-1"></div>
        <button @click="onDelete(); close()" class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium">
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete Layer
        </button>
      </div>
    </template>

    <PropertyRow label="Name">
      <BaseInput v-model="name" placeholder="Layer Name" />
    </PropertyRow>

    <PropertyRow label="Z-Index">
      <BaseNumber v-model="zIndex" :step="1" :precision="0" class="font-mono w-full" placeholder="0" />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-1 items-center w-full">
        <BaseButton :active="visible" @click="visible = !visible" class="flex-1 h-7 text-xs gap-2 justify-center" ghost>
          <Eye v-if="visible" class="w-3.5 h-3.5 text-primary" />
          <EyeOff v-else class="w-3.5 h-3.5 text-muted-foreground" />
          <span>{{ visible ? 'Visible' : 'Hidden' }}</span>
        </BaseButton>
        <div class="w-px h-4 bg-border mx-1"></div>
        <BaseButton :active="locked" @click="locked = !locked" class="flex-1 h-7 text-xs gap-2 justify-center" ghost>
          <Lock v-if="locked" class="w-3.5 h-3.5 text-amber-500" />
          <Unlock v-else class="w-3.5 h-3.5 text-muted-foreground" />
          <span>{{ locked ? 'Locked' : 'Unlocked' }}</span>
        </BaseButton>
      </div>
    </PropertyRow>
  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Layers, Copy, Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-vue-next'
import { useSceneStore } from '@/stores/scene/useSceneStore.js'
import { useClipboard } from '@/composables/useClipboard.js'
import { useConfirm } from '@/composables/useConfirm'

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'

const sceneStore = useSceneStore()
const { copy } = useClipboard()
const { confirm } = useConfirm()

// Identifikasi layer yang sedang diselect melalui store
const layerId = computed(() => sceneStore.selectedEntityIds[0])
const layer = computed(() => sceneStore.activeLayers.find(l => l._id === layerId.value))

const isUISection = computed(() => layer.value?._section === 'ui')

const name = computed({
  get: () => layer.value?.name || '',
  set: (val) => { if (layer.value) sceneStore.updateLayerName(layer.value._id, val) }
})

const zIndex = computed({
  get: () => layer.value?.zIndex ?? 0,
  set: (val) => { if (layer.value) sceneStore.updateLayerProp(layer.value._id, 'zIndex', val) }
})

const visible = computed({
  get: () => layer.value?.visible ?? true,
  set: (val) => { if (layer.value) sceneStore.updateLayerProp(layer.value._id, 'visible', val) }
})

const locked = computed({
  get: () => layer.value?.locked ?? false,
  set: (val) => { if (layer.value) sceneStore.updateLayerProp(layer.value._id, 'locked', val) }
})

const onCopyId = () => {
  if (layer.value) copy(layer.value._id)
}

const onDelete = async () => {
  if (!layer.value) return
  if (await confirm({ 
    title: 'Delete Layer?', 
    message: `Menghapus layer "${layer.value.name}" akan menghapus semua entity di dalamnya. Lanjutkan?`, 
    type: 'danger', 
    confirmText: 'Delete' 
  })) {
    sceneStore.deleteLayer(layer.value._id)
    sceneStore.clearSelection()
  }
}
</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
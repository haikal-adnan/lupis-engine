<template>
  <PropertySection title="Collider" :icon="Cuboid" v-if="hasComponent">
    
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
      <div class="p-1 space-y-0.5 min-w-[160px]">
        
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Collider'); close()" 
            :disabled="!overridden"
            class="menu-item"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Collider'); close()" 
          class="menu-item text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Collider
        </button>
      </div>
    </template>

    <div class="space-y-2">
      <PropertyRow label="Status">
        <BaseButton 
          :active="enabled"
          @click="enabled = !enabled"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >
          <span :class="enabled ? 'text-foreground font-medium' : 'text-muted-foreground'">
            {{ enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Type">
        <BaseSelect 
          v-model="type" 
          :options="typeOptions" 
          placeholder="Select Type"
          class="w-full"
        />
      </PropertyRow>

      <PropertyRow label="Offset">
        <div class="grid grid-cols-2 gap-2 transition-all duration-300" :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }">
          <BaseNumber v-model="offsetX" prefix="X" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
          <BaseNumber v-model="offsetY" prefix="Y" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
        </div>
      </PropertyRow>

      <PropertyRow label="Size (px)">
        <div class="grid grid-cols-2 gap-2 transition-all duration-300" :class="{ 'opacity-50 grayscale pointer-events-none': autoFit }">
          <BaseNumber v-model="width" prefix="W" :min="0" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
          <BaseNumber v-model="height" prefix="H" :min="0" :step="1" :precision="2" class="font-mono" :disabled="autoFit" />
        </div>
      </PropertyRow>

      <div class="px-1 mb-2 mt-1">
        <BaseCheckbox 
          v-model="autoFit" 
          label="Fit to Transform Size" 
        />
      </div>

      <div v-if="autoFit" class="px-1 mb-3 -mt-1">
        <div class="text-[9px] text-amber-500/80 italic flex items-center gap-1">
          <Info class="w-3 h-3" /> Size is controlled by Transform
        </div>
      </div>

    </div>
  </PropertySection>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Cuboid, Trash2, RefreshCw, Info } from 'lucide-vue-next'
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'
import BaseCheckbox from '@/commons/components/inputs/BaseCheckbox.vue'

const { 
  bindComponentProp, 
  removeComponent, 
  selectedEntity,
  prefabId,
  syncComponent,
  getComponentOverrideStatus,
  markAsOverridden 
} = useInspectorLogic()

const hasComponent = computed(() => !!selectedEntity.value?.components?.Collider)
const overridden = getComponentOverrideStatus('Collider')

const type = bindComponentProp('Collider', 'type')
const enabled = bindComponentProp('Collider', 'enabled')
const autoFit = bindComponentProp('Collider', 'autoFit')
const offsetX = bindComponentProp('Collider', 'offsetX', 2)
const offsetY = bindComponentProp('Collider', 'offsetY', 2)
const width = bindComponentProp('Collider', 'width', 2)
const height = bindComponentProp('Collider', 'height', 2)

const typeOptions = [
  { label: 'Solid (Physics)', value: 'solid' },
  { label: 'Trigger (Zone)', value: 'trigger' }
]

// 1. Ambil nilai Transform width & height secara reaktif
const transformWidth = computed(() => selectedEntity.value?.components?.Transform?.width)
const transformHeight = computed(() => selectedEntity.value?.components?.Transform?.height)

const syncSizeToTransform = () => {
  if (!selectedEntity.value) return
  const transform = selectedEntity.value.components.Transform
  if (!transform) return

  // Menggunakan setter otomatis dari bindComponentProp agar otomatis 
  // tersimpan & terkirim ke Engine, serta menangani Prefab/Scene
  width.value = transform.width
  height.value = transform.height
  offsetX.value = 0
  offsetY.value = 0
  
  markAsOverridden()
}

// 2. Pantau perubahan autoFit dari false ke true
watch(autoFit, (isAutoFit) => {
  if (isAutoFit) {
    syncSizeToTransform()
  }
})

// 3. Pantau perubahan ukuran Transform agar collider ikut membesar/mengecil real-time
watch([transformWidth, transformHeight], ([newWidth, newHeight]) => {
  if (autoFit.value) {
    if (newWidth !== undefined && width.value !== newWidth) {
      width.value = newWidth
    }
    if (newHeight !== undefined && height.value !== newHeight) {
      height.value = newHeight
    }
  }
})

</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
<template>
  <PropertySection title="Collider" :icon="Cuboid" v-if="hasComponent">
    
    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[140px]">
        <button 
          @click="syncSizeToTransform(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Maximize class="w-3.5 h-3.5 mr-2 opacity-70" /> Fit to Transform
        </button>
        <div class="h-px bg-border my-1"></div>
        <button 
          @click="removeComponent('Collider'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
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
            {{ enabled ? 'Enable' : 'Disable' }}
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
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber v-model="offsetX" prefix="X" :step="1" :precision="2" class="font-mono" />
          <BaseNumber v-model="offsetY" prefix="Y" :step="1" :precision="2" class="font-mono" />
        </div>
      </PropertyRow>

      <PropertyRow label="Size (px)">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber v-model="width" prefix="W" :min="0" :step="1" :precision="2" class="font-mono" />
          <BaseNumber v-model="height" prefix="H" :min="0" :step="1" :precision="2" class="font-mono" />
        </div>
      </PropertyRow>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Cuboid, Trash2, Maximize } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"
import { useSceneStore } from '@/stores/scene/useSceneStore.js'

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'

const { bindComponentProp, removeComponent, selectedEntity } = useInspectorLogic()
const sceneStore = useSceneStore()

const hasComponent = computed(() => !!selectedEntity.value?.components?.Collider)

// Bindings
const type = bindComponentProp('Collider', 'type')
const enabled = bindComponentProp('Collider', 'enabled')
const offsetX = bindComponentProp('Collider', 'offsetX', 2)
const offsetY = bindComponentProp('Collider', 'offsetY', 2)
const width = bindComponentProp('Collider', 'width', 2)
const height = bindComponentProp('Collider', 'height', 2)

const typeOptions = [
  { label: 'Solid (Physics)', value: 'solid' },
{ label: 'Trigger (Zone)', value: 'trigger' }
]

const syncSizeToTransform = () => {
  if (!selectedEntity.value) return
  const transform = selectedEntity.value.components.Transform
  if (!transform) return

  const id = selectedEntity.value._id
  sceneStore.updateComponentProp(id, 'Collider', 'width', transform.width)
  sceneStore.updateComponentProp(id, 'Collider', 'height', transform.height)
  sceneStore.updateComponentProp(id, 'Collider', 'offsetX', 0)
  sceneStore.updateComponentProp(id, 'Collider', 'offsetY', 0)
}
</script>
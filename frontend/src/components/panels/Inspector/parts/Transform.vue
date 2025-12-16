<template>
  <InspectorSection title="Transform">
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="5 9 2 12 5 15"></polyline>
        <polyline points="9 5 12 2 15 5"></polyline>
        <polyline points="15 19 12 22 9 19"></polyline>
        <polyline points="19 9 22 12 19 15"></polyline>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="12" y1="2" x2="12" y2="22"></line>
      </svg>
    </template>

    <PropertyRow label="Position">
      <div class="grid grid-cols-2 gap-2">
        <BaseInput v-model="transform.position.x" prefix="X" type="number" />
        <BaseInput v-model="transform.position.y" prefix="Y" type="number" />
      </div>
    </PropertyRow>

    <PropertyRow label="Rotation">
      <BaseInput v-model="transform.rotation" prefix="°" type="number" />
    </PropertyRow>

    <PropertyRow label="Scale">
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <BaseInput v-model="transform.scale.w" prefix="W" type="number" :step="0.01" />
          <BaseInput v-model="transform.scale.h" prefix="H" type="number" :step="0.01" />
        </div>
        <BaseInput v-model="transform.scale.uniform" prefix="*" type="number" :step="0.01" placeholder="Uniform Scale" />
      </div>
    </PropertyRow>

    <PropertyRow label="Z-Index">
      <BaseInput v-model="transform.zIndex" prefix="Z" type="number" />
    </PropertyRow>
  </InspectorSection>
</template>

<script setup>
import { reactive } from "vue"
import BaseInput from "../../../ui/BaseInput.vue" 
import InspectorSection from '../../../ui/InspectorSection.vue'
import PropertyRow from '../../../ui/PropertyRow.vue'

const transform = reactive({
  position: { x: 2500, y: 2500 },
  rotation: 45,
  zIndex: 1,
  scale: { w: 1.0, h: 1.0, uniform: 1.0 }
})
</script>
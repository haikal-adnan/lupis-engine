<template>
  <PropertySection title="Editor Settings" :icon="Settings2" :default-open="false">
    
    <PropertyRow label="Background">
      <BaseColor v-model="bgColor" :show-input="true" class="w-full" />
    </PropertyRow>

    <PropertyRow label="Grid Overlay">
      <BaseSelect 
        v-model="showGrid" 
        :options="toggleOptions" 
        class="w-full" 
      />
    </PropertyRow>

    <PropertyRow label="Onion Skin">
      <BaseSelect 
        v-model="onionSkin" 
        :options="toggleOptions" 
        class="w-full" 
      />
    </PropertyRow>

    <PropertyRow label="Zoom Level">
      <BaseNumber 
        v-model="zoom" 
        :step="0.1" 
        :min="0.1" 
        :max="5" 
        prefix="Z" 
        class="font-mono w-full" 
      />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { ref } from 'vue'
import { Settings2 } from 'lucide-vue-next'
import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseColor from '@/commons/components/inputs/BaseColor.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'

const bgColor = ref('#1a1a1a')
const showGrid = ref(true)
const onionSkin = ref(false)
const zoom = ref(1.0)

const toggleOptions = [
  { label: 'Enabled', value: true },
  { label: 'Disabled', value: false }
]
</script>
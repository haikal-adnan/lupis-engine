<template>
  <PropertySection title="Object">
    <template #header-extra>
      <div class="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border truncate max-w-[120px]">
        {{ localEntity.name || 'Entity' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5">
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground">
          Reset
        </button>
        <div class="h-px bg-border my-1" />
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground">
          Move Up
        </button>
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground">
          Move Down
        </button>
        <div class="h-px bg-border my-1" />
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium">
          <Trash2 class="w-3 h-3 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <PropertyRow label="Name">
      <BaseInput v-model="localEntity.name" />
    </PropertyRow>

    <PropertyRow label="Tag">
      <BaseSelect v-model="localEntity.tag" :options="tagOptions" />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-2 items-center">
        <div class="flex-grow">
          <BaseNumber v-model="localEntity.opacity" prefix="%" :min="0" :max="100" />
        </div>
        <IconButton 
          :active="!localEntity.visible" 
          @click="localEntity.visible = !localEntity.visible"
          class="shrink-0"
        >
          <Eye v-if="localEntity.visible" class="w-4 h-4" />
          <EyeOff v-else class="w-4 h-4" />
        </IconButton>
      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { reactive } from 'vue'
import { Eye, EyeOff, Trash2 } from 'lucide-vue-next'

import PropertySection from "@/modules/properties/parts/PropertySection.vue";
import PropertyRow from "@/modules/properties/parts/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'

const localEntity = reactive({
  name: 'Background Map',
  tag: 'untagged',
  opacity: 100,
  visible: true
})

const tagOptions = [
  { label: 'Untagged', value: 'untagged' },
  { label: 'Player', value: 'player' },
  { label: 'Enemy', value: 'enemy' }
]
</script>
<template>
  <PropertySection title="Physics" :icon="Atom" v-if="hasComponent">
    
    <template #menu="{ close }">
      <div class="p-1 min-w-[140px]">
        <button 
          @click="removeComponent('Physics'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" /> Remove Physics
        </button>
      </div>
    </template>

    <div class="space-y-2">
      <PropertyRow label="Simulation">
        <BaseButton 
          :active="enabled"
          @click="enabled = !enabled"
          class="w-full h-7 text-xs gap-2 justify-start px-3 border border-border/50 bg-background/50 hover:bg-accent transition-all"
          ghost
        >
          <span :class="enabled ? 'text-foreground font-medium' : 'text-muted-foreground'">
            {{ enabled ? 'Running' : 'Paused' }}
          </span>
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Body Type">
        <BaseSelect 
          v-model="type" 
          :options="typeOptions" 
          placeholder="Select Type"
          class="w-full"
        />
      </PropertyRow>

      <div class="h-px bg-border/50 my-2"></div>

      <PropertyRow label="Mass (kg)">
        <BaseNumber 
          v-model="mass" 
          prefix="M" 
          :min="0.1" 
          :step="0.01" 
          :precision="2" 
          class="font-mono w-full"
        />
      </PropertyRow>

      <PropertyRow label="Linear Drag">
        <BaseNumber 
          v-model="drag" 
          prefix="D" 
          :min="0" 
          :step="0.01" 
          :precision="2" 
          class="font-mono w-full" 
        />
      </PropertyRow>

      <PropertyRow label="Gravity Scale">
        <BaseNumber 
          v-model="gravityScale" 
          prefix="G" 
          :step="0.01" 
          :precision="2" 
          class="font-mono w-full" 
        />
      </PropertyRow>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Atom, Trash2 } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"

import PropertySection from "@ui/display/PropertySection.vue"
import PropertyRow from "@ui/display/PropertyRow.vue"
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'

const { bindComponentProp, removeComponent, selectedEntity } = useInspectorLogic()

const hasComponent = computed(() => !!selectedEntity.value?.components?.Physics)

// Bindings
const enabled = bindComponentProp('Physics', 'enabled')
const type = bindComponentProp('Physics', 'type')
const mass = bindComponentProp('Physics', 'mass')
const drag = bindComponentProp('Physics', 'drag')
const gravityScale = bindComponentProp('Physics', 'gravityScale')

// Options
const typeOptions = [
  { label: 'Dynamic (Standard)', value: 'dynamic' },
  { label: 'Static (Immovable)', value: 'static' },
  { label: 'Kinematic (Scripted)', value: 'kinematic' }
]
</script>
<template>
  <PropertySection title="Physics" :icon="Atom" v-if="hasComponent" data-testid="editor-physics-section">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'"
        data-testid="physics-prefab-badge"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 min-w-[160px] space-y-0.5">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('Physics'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="physics-sync-btn"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>

        <button 
          @click="removeComponent('Physics'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
          data-testid="physics-remove-btn"
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
          data-testid="physics-enabled-toggle"
          :data-active="enabled"
        >
          {{ enabled ? 'Running' : 'Paused' }}
        </BaseButton>
      </PropertyRow>

      <PropertyRow label="Body Type">
        <BaseSelect 
          v-model="type" 
          :options="typeOptions" 
          placeholder="Select Type"
          class="w-full"
          data-testid="physics-type-select"
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
          data-testid="physics-mass-input"
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
          data-testid="physics-drag-input"
        />
      </PropertyRow>

      <PropertyRow label="Gravity Scale">
        <BaseNumber 
          v-model="gravityScale" 
          prefix="G" 
          :step="0.01" 
          :precision="2" 
          class="font-mono w-full" 
          data-testid="physics-gravity-scale-input"
        />
      </PropertyRow>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Atom, Trash2, RefreshCw } from 'lucide-vue-next'

import { 
  useInspectorSelection, 
  useInspectorPrefab, 
  useInspectorBinding 
} from "@inspectors/inspectors.js";

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

const hasComponent = computed(() => !!selectedEntity.value?.components?.Physics)
const overridden = getComponentOverrideStatus('Physics')

const enabled = bindComponentProp('Physics', 'enabled')
const type = bindComponentProp('Physics', 'type')
const mass = bindComponentProp('Physics', 'mass')
const drag = bindComponentProp('Physics', 'drag')
const gravityScale = bindComponentProp('Physics', 'gravityScale')

const typeOptions = [
  { label: 'Dynamic (Standard)', value: 'dynamic' },
  { label: 'Static (Immovable)', value: 'static' },
  { label: 'Kinematic (Scripted)', value: 'kinematic' }
]
</script>

<style scoped>
.menu-item {
  @apply relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
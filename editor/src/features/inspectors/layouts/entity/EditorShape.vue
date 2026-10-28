<template>
  <PropertySection title="Shape Renderer" :icon="Square" v-if="hasComponent" data-testid="editor-shape-renderer-section">
    
    <template #header-extra>
      <div 
        v-if="prefabId"
        class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0"
        :class="overridden 
          ? 'text-amber-500 border-amber-500' 
          : 'text-emerald-500 border-emerald-500'"
        data-testid="shape-renderer-prefab-status"
      >
        {{ overridden ? 'Override' : 'Sync' }}
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]">
        <template v-if="prefabId">
          <button 
            @click="syncComponent('ShapeRenderer'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="shape-renderer-menu-sync"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>
        <button 
          @click="removeComponent('ShapeRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
          data-testid="shape-renderer-menu-remove"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <div class="pt-2 pb-1">
      <div class="px-1 mb-2 flex items-center justify-between">
        <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fill</div>
        <BaseCheckbox v-model="isFilled" data-testid="shape-renderer-fill-toggle" />
      </div>
      <div :class="{ 'opacity-40 pointer-events-none grayscale': !isFilled }" class="transition-all duration-300">
        <PropertyRow label="Color">
          <BaseColor v-model="color" :show-input="true" class="w-full" data-testid="shape-renderer-fill-color" />
        </PropertyRow>
        <PropertyRow label="Opacity">
          <BaseNumber prefix="%" v-model="displayFillOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" data-testid="shape-renderer-fill-opacity" />
        </PropertyRow>
      </div>
    </div>

    <div class="pt-3 pb-1 border-t border-border mt-1">
      <div class="px-1 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outline</div>
      <PropertyRow label="Width">
        <BaseNumber v-model="outlineWidth" prefix="W" :min="0" :step="1" :scrubbable="true" class="font-mono w-full" tooltip="Tebal Garis Segment/Polygon" data-testid="shape-renderer-outline-width" />
      </PropertyRow>
      <PropertyRow label="Color">
        <BaseColor v-model="outlineColor" :show-input="true" class="w-full" data-testid="shape-renderer-outline-color" />
      </PropertyRow>
      <PropertyRow label="Opacity">
        <BaseNumber prefix="%" v-model="displayOutlineOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" data-testid="shape-renderer-outline-opacity" />
      </PropertyRow>
    </div>

    <div class="pt-3 pb-1 border-t border-border mt-1">
      <PropertyRow label="Editor">
        <BaseButton 
          @click="openShapeEditor" 
          :disabled="!!prefabId"
          class="w-full h-9 text-xs gap-2 justify-center"
          variant="outline" 
          data-testid="shape-renderer-open-editor-btn"
        >
          <Pencil class="w-3.5 h-3.5 text-primary" />
          <span>Open Shape Editor</span>
        </BaseButton>
      </PropertyRow>
    </div>

    <div class="pt-3 pb-1 border-t border-border mt-1">
      <PropertyRow label="Collision">
        <div class="flex flex-col gap-2 w-full">
          <BaseCheckbox 
            v-model="enablePolygonCollision" 
            label="Polygon Physics" 
            description="Enable solid collision for polygons"
            class="w-full"
            data-testid="shape-renderer-polygon-collision"
          />
          <BaseCheckbox 
            v-model="enableSegmentCollision" 
            label="Segment Physics" 
            description="Enable edge collision for lines/segments"
            class="w-full"
            data-testid="shape-renderer-segment-collision"
          />
          <BaseCheckbox 
            v-model="enableCircleCollision" 
            label="Circle Physics" 
            description="Enable circular collision for circles"
            class="w-full"
            data-testid="shape-renderer-circle-collision"
          />
        </div>
      </PropertyRow>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Square, Trash2, RefreshCw, Pencil } from "lucide-vue-next"; 

import { 
  useInspectorSelection, 
  useInspectorPrefab,
  useInspectorBinding 
} from "@inspectors/inspectors.js";

import { useWorkspaceStore } from '@workspaces/workspaces.js';

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  BaseColor,
  BaseCheckbox,
} from '@components/components.js';

const { selectedEntity } = useInspectorSelection();

const { 
  prefabId, 
  getComponentOverrideStatus, 
  syncComponent, 
  removeComponent 
} = useInspectorPrefab();

const { bindComponentProp } = useInspectorBinding();
const workspaceStore = useWorkspaceStore();

const hasComponent = computed(() => !!selectedEntity.value?.components?.ShapeRenderer);
const overridden = getComponentOverrideStatus('ShapeRenderer');

const isFilled = bindComponentProp('ShapeRenderer', 'isFilled');
const color = bindComponentProp('ShapeRenderer', 'color');
const rawFillOpacity = bindComponentProp('ShapeRenderer', 'fillOpacity');

const outlineWidth = bindComponentProp('ShapeRenderer', 'outlineWidth');
const outlineColor = bindComponentProp('ShapeRenderer', 'outlineColor');
const rawOutlineOpacity = bindComponentProp('ShapeRenderer', 'outlineOpacity');

const enablePolygonCollision = bindComponentProp('ShapeRenderer', 'enablePolygonCollision');
const enableSegmentCollision = bindComponentProp('ShapeRenderer', 'enableSegmentCollision');
const enableCircleCollision = bindComponentProp('ShapeRenderer', 'enableCircleCollision');

const displayFillOpacity = computed({
  get: () => Math.round((rawFillOpacity.value ?? 0.3) * 100),
  set: (val) => { rawFillOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const displayOutlineOpacity = computed({
  get: () => Math.round((rawOutlineOpacity.value ?? 1.0) * 100),
  set: (val) => { rawOutlineOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

function openShapeEditor() {
  if (prefabId.value) return;
  const entity = selectedEntity.value;
  if (!entity) return;

  workspaceStore.openTab({
    id: entity.id,
    name: entity.scriptId || 'Shape Editor',
    type: 'shape_editor',
    fixed: false
  });
}
</script>
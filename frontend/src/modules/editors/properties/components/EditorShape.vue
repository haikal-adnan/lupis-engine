<template>
  <PropertySection title="Shape Renderer" :icon="Square" v-if="hasComponent">
    
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
            @click="syncComponent('ShapeRenderer'); close()" 
            :disabled="!overridden"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5 mr-2 opacity-70" /> 
            Sync Component
          </button>
          <div class="h-px bg-border my-1"></div>
        </template>
        <button 
          @click="removeComponent('ShapeRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

    <!-- Fill Properties -->
    <div class="pt-2 pb-1">
      <div class="px-1 mb-2 flex items-center justify-between">
        <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fill</div>
        <BaseCheckbox v-model="isFilled" />
      </div>
      <div :class="{ 'opacity-40 pointer-events-none grayscale': !isFilled }" class="transition-all duration-300">
        <PropertyRow label="Color">
          <BaseColor v-model="color" :show-input="true" class="w-full" />
        </PropertyRow>
        <PropertyRow label="Opacity">
          <BaseNumber prefix="%" v-model="displayFillOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" />
        </PropertyRow>
      </div>
    </div>

    <!-- Outline Properties -->
    <div class="pt-3 pb-1 border-t border-border mt-1">
      <div class="px-1 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outline</div>
      <PropertyRow label="Width">
        <BaseNumber v-model="outlineWidth" prefix="W" :min="0" :step="1" :scrubbable="true" class="font-mono w-full" tooltip="Tebal Garis Segment/Polygon" />
      </PropertyRow>
      <PropertyRow label="Color">
        <BaseColor v-model="outlineColor" :show-input="true" class="w-full" />
      </PropertyRow>
      <PropertyRow label="Opacity">
        <BaseNumber prefix="%" v-model="displayOutlineOpacity" :min="0" :max="100" :step="1" :scrubbable="true" class="font-mono w-full" />
      </PropertyRow>
    </div>

    <!-- Shape Editor Button -->
    <div class="pt-3 pb-1 border-t border-border mt-1">
      <PropertyRow label="Editor">
        <BaseButton 
          @click="openShapeEditor" 
          class="w-full h-9 text-xs gap-2 justify-center"
          variant="outline" 
        >
          <Pencil class="w-3.5 h-3.5 text-primary" />
          <span>Open Shape Editor</span>
        </BaseButton>
      </PropertyRow>
    </div>

    <!-- Collision Settings -->
    <div class="pt-3 pb-1 border-t border-border mt-1">
      <PropertyRow label="Collision">
        <div class="flex flex-col gap-2 w-full">
          <BaseCheckbox 
            v-model="enablePolygonCollision" 
            label="Polygon Physics" 
            description="Enable solid collision for polygons"
            class="w-full"
          />
          <BaseCheckbox 
            v-model="enableSegmentCollision" 
            label="Segment Physics" 
            description="Enable edge collision for lines/segments"
            class="w-full"
          />
          <BaseCheckbox 
            v-model="enableCircleCollision" 
            label="Circle Physics" 
            description="Enable circular collision for circles"
            class="w-full"
          />
        </div>
      </PropertyRow>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Square, Trash2, RefreshCw, Pencil } from "lucide-vue-next"; 
import { useInspectorLogic } from "@editors/properties/composables/useInspectorLogic.js"; 
import { useEditorStore } from "@/stores/useEditorStore";
import { useSceneStore } from "@/stores/scene/useSceneStore";
import { EngineBridge } from "@/services/engine/EngineBridge";

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";
import BaseCheckbox from "@/commons/components/inputs/BaseCheckbox.vue";
import BaseColor from "@/commons/components/inputs/BaseColor.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";

const editorStore = useEditorStore();
const sceneStore = useSceneStore();
const { selectedEntity, removeComponent, prefabId, syncComponent, getComponentOverrideStatus } = useInspectorLogic();

const hasComponent = computed(() => !!selectedEntity.value?.components?.ShapeRenderer);
const overridden = getComponentOverrideStatus('ShapeRenderer');

function bindProp(propName, defaultValue = null) {
  return computed({
    get: () => {
      const comp = selectedEntity.value?.components?.ShapeRenderer;
      return comp?.[propName] !== undefined ? comp[propName] : defaultValue;
    },
    set: (val) => {
      const entity = selectedEntity.value;
      if (entity) {
        const targetId = entity._id || entity.id;
        sceneStore.updateComponentProp(targetId, 'ShapeRenderer', propName, val);
        EngineBridge.updateComponentProp({
          entityId: targetId,
          componentName: 'ShapeRenderer',
          path: propName,
          value: val
        });
      }
    }
  });
}

const isFilled = bindProp('isFilled', true);
const color = bindProp('color', '#0066FF');
const rawFillOpacity = bindProp('fillOpacity', 0.3);

const outlineWidth = bindProp('outlineWidth', 2);
const outlineColor = bindProp('outlineColor', '#0066FF');
const rawOutlineOpacity = bindProp('outlineOpacity', 1.0);

const enablePolygonCollision = bindProp('enablePolygonCollision', true);
const enableSegmentCollision = bindProp('enableSegmentCollision', true);
const enableCircleCollision = bindProp('enableCircleCollision', true);

const displayFillOpacity = computed({
  get: () => Math.round((rawFillOpacity.value ?? 0.3) * 100),
  set: (val) => { rawFillOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const displayOutlineOpacity = computed({
  get: () => Math.round((rawOutlineOpacity.value ?? 1.0) * 100),
  set: (val) => { rawOutlineOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

function openShapeEditor() {
  const entity = selectedEntity.value;
  if (!entity) return;

  editorStore.openTab({
    id: entity._id || entity.id,
    name: entity.name || 'Shape Editor',
    type: 'shape_editor',
    fixed: false
  });
}
</script>
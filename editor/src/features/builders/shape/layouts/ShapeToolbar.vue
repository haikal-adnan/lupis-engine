<template>
  <PropertySection title="Shape Tools" :showMenu="false">
    <div class="p-2">
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="setTool(tool.id)"
          class="
            flex items-center justify-center h-8 rounded-md transition-all
            border focus:outline-none focus:ring-1 focus:ring-primary/40
          "
          :class="activeTool === tool.id 
            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
            : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border-border'
          "
          :title="tool.label"
        >
          <component :is="tool.icon" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="pt-3 pb-1 border-t border-border mt-1" v-if="hasShapeRenderer">
      <div class="px-1 mb-2 flex items-center justify-between">
        <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Fill</div>
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

    <div class="pt-3 pb-1 border-t border-border mt-1" v-if="hasShapeRenderer">
      <div class="px-1 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Outline</div>
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

    <div class="pt-3 pb-1 border-t border-border mt-1">
      <PropertyRow label="Scene Opacity">
        <div class="grid grid-cols-1 gap-2">
          <BaseNumber 
            prefix="%"
            :model-value="context.opacity" 
            @update:model-value="setContextOpacity"
            :min="0" :max="1" :step="0.1" :scrub-sensitivity="0.05"
            class="font-mono flex-1" 
          />
        </div>
      </PropertyRow>

      <PropertyRow label="Visibility">
        <BaseButton 
          :active="context.showOthers"
          @click="toggleContextVisibility"
          class="w-full h-7 text-xs gap-2 justify-center"
          ghost
        >
          <Eye v-if="context.showOthers" class="w-3.5 h-3.5 text-primary dark:text-white" />
          <EyeOff v-else class="w-3.5 h-3.5 text-muted-foreground" />
          <span>{{ context.showOthers ? 'Scene Visible' : 'Scene Hidden' }}</span>
        </BaseButton>
      </PropertyRow>
    </div>
  </PropertySection>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'; 
import { 
  Hand, MousePointer2, Dot, Spline, Minus, Hexagon, Circle, Eye, EyeOff, Eraser
} from 'lucide-vue-next';

import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useShapeEditorLogic } from "@builders/builders.js";
import { useSceneHistory } from '@historys/historys.js';

import {
  PropertySection,
  PropertyRow,
  BaseNumber,
  BaseButton,
  BaseCheckbox,
  BaseColor
} from '@components/components.js';

const workspaceStore = useWorkspaceStore();
const { recordWorkspaceContextChange } = useSceneHistory();

const activeTool = computed(() => workspaceStore.activeTool || 'select');

const { hasShapeRenderer, bindComponentProp } = useShapeEditorLogic();

const isFilled = bindComponentProp('ShapeRenderer', 'isFilled', true);
const color = bindComponentProp('ShapeRenderer', 'color', '#0066FF'); 
const rawFillOpacity = bindComponentProp('ShapeRenderer', 'fillOpacity', 0.3);

const outlineWidth = bindComponentProp('ShapeRenderer', 'outlineWidth', 2);
const outlineColor = bindComponentProp('ShapeRenderer', 'outlineColor', '#0066FF');
const rawOutlineOpacity = bindComponentProp('ShapeRenderer', 'outlineOpacity', 1.0);

const displayFillOpacity = computed({
  get: () => Math.round((rawFillOpacity.value ?? 0.3) * 100),
  set: (val) => { rawFillOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const displayOutlineOpacity = computed({
  get: () => Math.round((rawOutlineOpacity.value ?? 1) * 100),
  set: (val) => { rawOutlineOpacity.value = parseFloat((val / 100).toFixed(2)); }
});

const context = computed({
  get: () => {
    if (!workspaceStore.shapeContext) {
       workspaceStore.shapeContext = { opacity: 0.3, showOthers: true, pointSize: 6 };
    }
    return workspaceStore.shapeContext;
  },
  set: (val) => { workspaceStore.shapeContext = val; }
});

function setTool(toolId) { 
  workspaceStore.setTool(toolId); 
}

function setContextOpacity(val) {
  const oldVal = context.value.opacity;
  if (oldVal === val) return;

  recordWorkspaceContextChange('opacity', oldVal, val);

  const newCtx = { ...context.value, opacity: val };
  context.value = newCtx;
  workspaceStore.engine?.bus?.emit("workspace:store:update", { shapeContext: newCtx });
}

function toggleContextVisibility() {
  const oldVal = context.value.showOthers;
  const newVal = !oldVal;

  recordWorkspaceContextChange('showOthers', oldVal, newVal);

  const newCtx = { ...context.value, showOthers: newVal };
  context.value = newCtx;
  workspaceStore.engine?.bus?.emit("workspace:store:update", { shapeContext: newCtx });
}

watch(() => context.value.pointSize, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    recordWorkspaceContextChange('pointSize', oldVal, newVal);
  }
  workspaceStore.engine?.bus?.emit("workspace:store:update", { shapeContext: context.value });
});

const tools = [
  { id: 'hand',    icon: Hand,          label: 'Pan Tool (Space)' },
  { id: 'select',  icon: MousePointer2, label: 'Select / Move (V)' },
  { id: 'eraser',  icon: Eraser,        label: 'Delete Point (E)' },
  { id: 'point',   icon: Dot,           label: 'Point Tool (P)' },
  { id: 'segment', icon: Spline,        label: 'Segment Tool (S)' },
  { id: 'line',    icon: Minus,         label: 'Line Tool (L)' },
  { id: 'polygon', icon: Hexagon,       label: 'Polygon Tool (G)' },
  { id: 'circle',  icon: Circle,        label: 'Circle Tool (C)' },
];

const shortcutMap = {
  ' ': 'hand', 'v': 'select', 'e': 'eraser', 'p': 'point', 
  's': 'segment', 'l': 'line', 'g': 'polygon', 'c': 'circle'
};

const handleKeydown = (event) => {
  const tagName = event.target.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.target.isContentEditable) return;
  if (workspaceStore.activeTab?.type !== 'shape_editor') return;

  const key = event.key.toLowerCase();
  if (shortcutMap[key]) {
    if (key === ' ') event.preventDefault();
    setTool(shortcutMap[key]);
  }
};

onMounted(() => { window.addEventListener('keydown', handleKeydown); });
onUnmounted(() => { window.removeEventListener('keydown', handleKeydown); });
</script>
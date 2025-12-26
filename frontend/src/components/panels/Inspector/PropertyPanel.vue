<script setup>
import { ref, computed } from "vue";
import { useSelection } from "@/composables/useSelection.js";
import { bus } from "@engine/Util/EventBus.js";

// Import komponen UI (sesuaikan path jika perlu)
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { selectedEntity } = useSelection();
const isRatioLocked = ref(false); 

// Helper: Notify Engine
const notifyChange = () => {
  if (selectedEntity.value) {
    bus.emit("entity:modified", [selectedEntity.value], true);
  }
};

// Helper: Get Transform Object safely
const getTransform = () => {
  if (!selectedEntity.value) return null;
  // Jika transform hilang, buat default
  if (!selectedEntity.value.transform) selectedEntity.value.transform = { x:0, y:0, scaleX:1, scaleY:1, rotation:0 };
  return selectedEntity.value.transform;
};

// --- BINDING: POSITION (Reads from .transform) ---
const bindPosition = (prop) => computed({
  get: () => {
    if (!selectedEntity.value) return 0;
    const val = selectedEntity.value.transform?.[prop] ?? 0;
    return Math.round(val * 100) / 100; // Rounding untuk tampilan
  },
  set: (val) => {
    const t = getTransform();
    if (t) {
        t[prop] = parseFloat(val); 
        notifyChange();
    }
  }
});
const posX = bindPosition('x');
const posY = bindPosition('y');

// --- BINDING: ROTATION (Reads from .transform) ---
const displayRotation = computed({
  get: () => {
    if (!selectedEntity.value) return 0;
    const t = selectedEntity.value.transform;
    const rad = t?.rotation ?? 0;
    let deg = rad * (180 / Math.PI);
    return Math.round(deg % 360);
  },
  set: (val) => {
    const t = getTransform();
    if (t) {
        t.rotation = val * (Math.PI / 180);
        notifyChange();
    }
  }
});

// --- BINDING: SCALE / FLIP (Reads from .transform) ---
const isFlippedX = computed(() => (selectedEntity.value?.transform?.scaleX ?? 1) < 0);
const isFlippedY = computed(() => (selectedEntity.value?.transform?.scaleY ?? 1) < 0);

const toggleFlipX = () => {
  const t = getTransform();
  if (t) {
      t.scaleX = (t.scaleX ?? 1) * -1;
      notifyChange();
  }
};

const toggleFlipY = () => {
  const t = getTransform();
  if (t) {
      t.scaleY = (t.scaleY ?? 1) * -1;
      notifyChange();
  }
};

// --- BINDING: SIZE (Reads from Root) ---
// Size width/height tetap di root entity karena terkait Sprite/Shape
const sizeW = computed({
  get: () => selectedEntity.value ? Math.round(selectedEntity.value.width * 100) / 100 : 0,
  set: (val) => {
    if (!selectedEntity.value) return;
    const oldW = selectedEntity.value.width || 1;
    selectedEntity.value.width = val;
    if (isRatioLocked.value) {
      const ratio = selectedEntity.value.height / oldW;
      selectedEntity.value.height = val * ratio;
    }
    notifyChange();
  }
});

const sizeH = computed({
  get: () => selectedEntity.value ? Math.round(selectedEntity.value.height * 100) / 100 : 0,
  set: (val) => {
    if (!selectedEntity.value) return;
    const oldH = selectedEntity.value.height || 1;
    selectedEntity.value.height = val;
    if (isRatioLocked.value) {
      const ratio = selectedEntity.value.width / oldH;
      selectedEntity.value.width = val * ratio;
    }
    notifyChange();
  }
});

// --- BINDING: OTHER ROOT PROPS ---
const displayOpacity = computed({
  get: () => selectedEntity.value?.opacity ?? 100,
  set: (val) => {
    if (selectedEntity.value) {
        selectedEntity.value.opacity = val; 
        notifyChange();
    }
  }
});

const boundTag = computed({
  get: () => selectedEntity.value?.tag || 'untagged',
  set: (val) => { 
      if (selectedEntity.value) { 
          selectedEntity.value.tag = val; 
          notifyChange(); 
      } 
  }
});

// --- BINDING: PIVOT (Reads from .transform) ---
const setPivot = (newX, newY) => {
  if (!selectedEntity.value) return;
  const e = selectedEntity.value;
  const t = getTransform();

  // Logic Pivot Compensation
  const oldPx = t.pivotX ?? 0.5;
  const oldPy = t.pivotY ?? 0.5;
  const w = e.width || 0;
  const h = e.height || 0;
  const sx = t.scaleX ?? 1;
  const sy = t.scaleY ?? 1;
  const r = t.rotation || 0;

  const diffX = (newX - oldPx) * w * sx;
  const diffY = (newY - oldPy) * h * sy;

  const c = Math.cos(r);
  const s = Math.sin(r);

  t.x += diffX * c - diffY * s;
  t.y += diffX * s + diffY * c;
  
  t.pivotX = newX;
  t.pivotY = newY;
  notifyChange();
};

const isActivePivot = (x, y) => {
  const t = selectedEntity.value?.transform;
  if (!t) return false;
  return Math.abs((t.pivotX ?? 0.5) - x) < 0.01 && Math.abs((t.pivotY ?? 0.5) - y) < 0.01;
};

const tagOptions = [
  { label: 'Untagged', value: 'untagged' }, { label: 'Player', value: 'player' },
  { label: 'Enemy', value: 'enemy' }, { label: 'Props', value: 'props' },
  { label: 'Background', value: 'background' }, { label: 'UI', value: 'ui' }
];
const pivotMap = [
  { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
  { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
  { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 },
];
</script>

<template>
  <div v-if="selectedEntity" class="flex flex-col gap-2">
    <InspectorSection title="Object">
      <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></template>
      <template #header-extra>
        <span class="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full truncate max-w-[140px] bg-secondary/90 text-secondary-foreground border border-border shadow-sm">{{ selectedEntity.name || 'Entity' }}</span>
      </template>
      
      <PropertyRow label="Name"><BaseInput v-model="selectedEntity.name" @change="notifyChange" type="text" class="font-semibold" /></PropertyRow>
      <PropertyRow label="Tag"><BaseSelect v-model="boundTag" :options="tagOptions" /></PropertyRow>
      <PropertyRow label="Appearance">
        <div class="flex gap-2 items-center">
          <div class="flex-grow"><BaseInput v-model="displayOpacity" prefix="%" type="number" :min="0" :max="100" :step="1" :scrubbable="true" /></div>
          <IconButton :active="!selectedEntity.visible" @click="selectedEntity.visible = !selectedEntity.visible; notifyChange()" title="Toggle Visibility">
            <svg v-if="selectedEntity.visible" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          </IconButton>
        </div>
      </PropertyRow>
    </InspectorSection>

    <InspectorSection title="Transform">
      <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></template>
      <PropertyRow label="Position">
        <div class="grid grid-cols-2 gap-2"><BaseInput v-model="posX" prefix="X" type="number" :scrubbable="true" /><BaseInput v-model="posY" prefix="Y" type="number" :scrubbable="true" /></div>
      </PropertyRow>
      <div class="flex gap-4 mb-3 items-start">
         <div class="flex-grow pt-0.5"><PropertyRow label="Rotation" :no-margin="true"><BaseInput v-model="displayRotation" prefix="R" type="number" :scrubbable="true" suffix="°" /></PropertyRow></div>
         <div class="flex flex-col gap-1 items-center">
           <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pivot</span>
           <div class="w-[52px] h-[52px] grid grid-cols-3 gap-1 p-1 bg-slate-900/50 rounded-md border border-border">
              <button v-for="(p, index) in pivotMap" :key="index" @click="setPivot(p.x, p.y)" type="button" :class="['w-full h-full rounded-[2px] transition-all', isActivePivot(p.x, p.y) ? 'bg-primary scale-110' : 'bg-slate-700 hover:bg-slate-600']"></button>
           </div>
         </div>
      </div>
      <PropertyRow label="Size (px)">
        <div class="flex items-center gap-2">
          <div class="grid grid-cols-2 gap-2 flex-grow"><BaseInput v-model="sizeW" prefix="W" type="number" :scrubbable="true" /><BaseInput v-model="sizeH" prefix="H" type="number" :scrubbable="true" /></div>
          <IconButton :active="isRatioLocked" @click="isRatioLocked = !isRatioLocked" :title="isRatioLocked ? 'Unlock' : 'Lock'"><svg v-if="isRatioLocked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-50"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg></IconButton>
        </div>
      </PropertyRow>
      <PropertyRow label="Flip">
        <div class="grid grid-cols-2 gap-2">
          <button @click="toggleFlipX" :class="['flex items-center justify-center gap-2 h-7 rounded text-xs font-medium border transition-colors', isFlippedX ? 'bg-primary text-white border-primary' : 'bg-slate-800 border-border hover:bg-slate-700 text-slate-300']"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 7 5 5-5 5V7"/><path d="m21 7-5 5 5 5V7"/><path d="M12 7v10"/></svg>Horz</button>
          <button @click="toggleFlipY" :class="['flex items-center justify-center gap-2 h-7 rounded text-xs font-medium border transition-colors', isFlippedY ? 'bg-primary text-white border-primary' : 'bg-slate-800 border-border hover:bg-slate-700 text-slate-300']"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rotate-90"><path d="m3 7 5 5-5 5V7"/><path d="m21 7-5 5 5 5V7"/><path d="M12 7v10"/></svg>Vert</button>
        </div>
      </PropertyRow>
    </InspectorSection>
  </div>
</template>
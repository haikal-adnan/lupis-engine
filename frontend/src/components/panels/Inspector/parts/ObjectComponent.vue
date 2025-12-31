<script setup>
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";

// UI Components
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

// Ambil logic yang dibutuhkan saja
const { selectedEntity, notifyChange, boundTag, displayOpacity } = useInspectorLogic();

const tagOptions = [
  { label: 'Untagged', value: 'untagged' }, { label: 'Player', value: 'player' },
  { label: 'Enemy', value: 'enemy' }, { label: 'Props', value: 'props' },
  { label: 'Background', value: 'background' }, { label: 'UI', value: 'ui' }
];
</script>

<template>
  <InspectorSection title="Object" v-if="selectedEntity">
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
</template>
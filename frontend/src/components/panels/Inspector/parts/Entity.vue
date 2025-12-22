<template>
  <InspectorSection title="Object" v-if="selectedEntity">
    <template #icon>
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
    </template>

    <template #header-extra>
      <span class="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full truncate max-w-[140px] bg-secondary/90 text-secondary-foreground border border-border shadow-sm">
        {{ selectedEntity.name || 'Entity' }}
      </span>
    </template>
    
    <PropertyRow label="Nama">
      <BaseInput 
        v-model="selectedEntity.name" 
        type="text" 
        placeholder="Nama Entity..." 
        class="font-semibold"
      />
    </PropertyRow>

    <PropertyRow label="Active">
      <div class="flex items-center h-8">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="selectedEntity.active" class="sr-only peer">
          <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ selectedEntity.active ? 'Enabled' : 'Disabled' }}
          </span>
        </label>
      </div>
    </PropertyRow>

    <PropertyRow label="Tag">
      <BaseSelect 
        v-model="selectedEntity.tag" 
        :options="tagOptions" 
        placeholder="Pilih Tag..." 
      />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-2 items-center">
        <div class="flex-grow">
          <BaseInput 
            v-model="selectedEntity.opacity" 
            prefix="Op" 
            type="number" 
            :min="0" :max="1" :step="0.1"
            :scrubbable="true" 
          />
        </div>

        <IconButton 
          :active="!selectedEntity.visible" 
          @click="selectedEntity.visible = !selectedEntity.visible"
          :title="selectedEntity.visible ? 'Hide Object' : 'Show Object'"
        >
          <svg v-if="selectedEntity.visible" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.48-1.65"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </IconButton>

        <IconButton 
          :active="selectedEntity.locked" 
          @click="selectedEntity.locked = !selectedEntity.locked"
          title="Lock Selection"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </IconButton>

      </div>
    </PropertyRow>

  </InspectorSection>
</template>

<script setup>
import { useSelection } from "@/composables/useSelection.js";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { selectedEntity } = useSelection();

// Opsi Tag (Bisa diambil dari config global/store nanti)
const tagOptions = [
  { label: 'Untagged', value: 'untagged' },
  { label: 'Player', value: 'player' },
  { label: 'Enemy', value: 'enemy' },
  { label: 'Props', value: 'props' },
  { label: 'UI', value: 'ui' }
];
</script>
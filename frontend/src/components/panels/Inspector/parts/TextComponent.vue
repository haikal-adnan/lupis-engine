<script setup>
// Text Component
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";

// UI Components
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { 
  selectedEntity, 
  removeComponent, 
  bindComponentProp // Ambil helper baru
} = useInspectorLogic();

// Buat binding spesifik untuk properti TextRenderer
// Parameter: (NamaKomponen, NamaProperty, DefaultValue)
// SEBELUMNYA (Salah field):
// const textContent = bindComponentProp('TextRenderer', 'text', ''); 

// PERBAIKAN (Gunakan 'value' agar sesuai dengan WorldRenderer e.text.value):
const textContent = bindComponentProp('TextRenderer', 'value', 'New Text');
const fontSize = bindComponentProp('TextRenderer', 'fontSize', 12);
const color = bindComponentProp('TextRenderer', 'color', '#ffffff');
const align = bindComponentProp('TextRenderer', 'align', 'left');

const alignOptions = [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' }
];
</script>

<template>
  <InspectorSection title="Text Renderer" v-if="selectedEntity?.components?.TextRenderer">
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
    </template>
    <template #header-extra>
        <IconButton @click="removeComponent('TextRenderer')" class="hover:text-destructive" title="Remove Component">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </IconButton>
    </template>

    <div class="px-1 mb-2">
        <textarea 
          v-model="textContent" 
          class="w-full bg-slate-900 border border-border rounded text-xs p-2 min-h-[60px] focus:outline-none focus:border-primary text-slate-200" 
          placeholder="Enter text..."
        ></textarea>
    </div>

    <PropertyRow label="Font Size">
        <BaseInput v-model="fontSize" type="number" />
    </PropertyRow>

    <PropertyRow label="Color">
        <div class="flex gap-2">
            <input type="color" v-model="color" class="h-7 w-8 bg-transparent border-0 cursor-pointer" />
            <BaseInput v-model="color" />
        </div>
    </PropertyRow>

    <PropertyRow label="Align">
        <BaseSelect v-model="align" :options="alignOptions" />
    </PropertyRow>
  </InspectorSection>
</template>
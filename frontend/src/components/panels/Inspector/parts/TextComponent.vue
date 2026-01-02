<script setup>
import { computed } from "vue";
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";
import { useBackend } from "@/composables/useBackend.js"; 

// UI Components
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { selectedEntity, removeComponent, bindComponentProp } = useInspectorLogic();
const { assets } = useBackend(); // Diperlukan untuk mencari nama font berdasarkan ID

// --- BINDING DATA ---
const textContent = bindComponentProp('TextRenderer', 'value', 'New Text');
const fontSize = bindComponentProp('TextRenderer', 'fontSize', 12);
const color = bindComponentProp('TextRenderer', 'color', '#ffffff');
const align = bindComponentProp('TextRenderer', 'align', 'left');
const boundAssetId = bindComponentProp('TextRenderer', 'assetId', null); // Bind ID Asset Font

const alignOptions = [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' }
];

const fontDisplayName = computed(() => {
    if (!boundAssetId.value) return "Default (Inter)";
    
    if (!assets.value) return "Loading...";
    
    const asset = assets.value.find(a => a._id === boundAssetId.value);
    return asset ? asset.name : "Unknown Font";
});

// --- ACTIONS ---
const clearFont = () => {
    boundAssetId.value = null; 
};

const openAssetPicker = () => {
    console.log("TODO: Open Asset Picker Modal (Filter: Font)");
};

const handleDropAsset = (event) => {
    console.log("Dropped font asset");
};
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
          class="w-full bg-slate-900 border border-border rounded text-xs p-2 min-h-[60px] focus:outline-none focus:border-primary text-slate-200 resize-y" 
          placeholder="Enter text..."
        ></textarea>
    </div>

    <PropertyRow label="Typeface" :no-padding="true">
        <div 
            class="relative w-full flex items-center bg-gray-900 border border-gray-700 rounded px-2 py-1.5 cursor-pointer hover:bg-gray-800 hover:border-blue-500/50 transition-all group"
            @click="openAssetPicker"
            @dragover.prevent
            @drop.prevent="handleDropAsset"
            title="Click to change font"
        >
            <div class="w-5 h-5 flex items-center justify-center bg-gray-800 rounded mr-2 text-gray-400 font-serif font-bold text-xs border border-gray-700 shadow-sm">
                Aa
            </div>

            <span class="text-xs text-gray-300 truncate select-none flex-grow">
                {{ fontDisplayName }}
            </span>

            <button 
                v-if="boundAssetId"
                @click.stop="clearFont"
                class="absolute right-1 p-0.5 rounded-sm hover:bg-red-500/20 hover:text-red-400 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Reset to Default Font"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>
    </PropertyRow>

    <PropertyRow label="Font Size">
        <BaseInput v-model="fontSize" type="number" :min="1" />
    </PropertyRow>

    <PropertyRow label="Color">
        <div class="flex gap-2">
            <input type="color" v-model="color" class="h-7 w-8 bg-transparent border-0 cursor-pointer rounded overflow-hidden" />
            <BaseInput v-model="color" class="flex-1" />
        </div>
    </PropertyRow>

    <PropertyRow label="Align">
        <BaseSelect v-model="align" :options="alignOptions" />
    </PropertyRow>
  </InspectorSection>
</template>
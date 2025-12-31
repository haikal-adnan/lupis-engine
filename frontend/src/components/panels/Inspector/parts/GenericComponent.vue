<script setup>
import { ref, computed } from "vue";
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";

import BaseInput from "@/components/ui/BaseInput.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';
import BaseSelect from "@/components/ui/BaseSelect.vue"; // Pastikan punya ini

const props = defineProps({
  componentName: String // Nama Key, misal: "CustomScript", "BoxCollider"
});

const { selectedEntity, notifyChange, removeComponent } = useInspectorLogic();

// Akses data secara dinamis menggunakan bracket notation []
const componentData = computed(() => selectedEntity.value?.components?.[props.componentName]);

// --- LOGIC DETEKSI TIPE ---
const getInputType = (val) => {
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  // Deteksi warna sederhana (hex code)
  if (typeof val === 'string' && val.startsWith('#') && val.length === 7) return 'color';
  return 'string';
};

// --- LOGIC TAMBAH PROPERTY BARU ---
const newPropName = ref("");
const newPropType = ref("number");
const isAdding = ref(false);

const typeOptions = [
    { label: 'Number', value: 'number' },
    { label: 'String', value: 'string' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Color', value: 'color' },
];

const addNewProperty = () => {
    if (!newPropName.value) return alert("Property name required!");
    if (componentData.value.hasOwnProperty(newPropName.value)) return alert("Property exists!");

    let initialVal = 0;
    if (newPropType.value === 'string') initialVal = "New Text";
    if (newPropType.value === 'boolean') initialVal = false;
    if (newPropType.value === 'color') initialVal = "#ffffff";

    // Tambahkan key baru ke objek
    componentData.value[newPropName.value] = initialVal;
    
    // Reset form
    newPropName.value = "";
    isAdding.value = false;
    notifyChange();
};

const deleteProperty = (key) => {
    delete componentData.value[key];
    notifyChange();
};
</script>

<template>
  <InspectorSection :title="componentName" v-if="componentData">
    <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </template>

    <template #header-extra>
        <IconButton @click="removeComponent(componentName)" class="hover:text-destructive" title="Remove Component">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </IconButton>
    </template>

    <div v-for="(val, key) in componentData" :key="key" class="group relative">
        <PropertyRow :label="key">
            
            <div class="flex gap-2 w-full items-center">
                <div v-if="getInputType(val) === 'boolean'" class="flex items-center h-full">
                     <input type="checkbox" v-model="componentData[key]" @change="notifyChange" class="accent-primary h-4 w-4 rounded border-border bg-muted cursor-pointer"/>
                </div>

                <BaseInput v-else-if="getInputType(val) === 'number'" v-model="componentData[key]" type="number" @change="notifyChange" />

                <div v-else-if="getInputType(val) === 'color'" class="flex gap-2 w-full">
                    <input type="color" v-model="componentData[key]" @input="notifyChange" class="h-7 w-8 bg-transparent border-0 cursor-pointer shrink-0" />
                    <BaseInput v-model="componentData[key]" @change="notifyChange" />
                </div>

                <BaseInput v-else v-model="componentData[key]" @change="notifyChange" />

                <button @click="deleteProperty(key)" class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity absolute -left-4 top-1" title="Delete Property">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </PropertyRow>
    </div>

    <div class="mt-3 pt-2 border-t border-dashed border-border">
        <div v-if="!isAdding" class="px-2">
            <button @click="isAdding = true" class="w-full text-[10px] text-slate-500 hover:text-primary py-1 border border-transparent hover:border-border rounded transition-all">
                + Add Property
            </button>
        </div>
        
        <div v-else class="flex flex-col gap-2 p-2 bg-slate-900/50 rounded border border-border">
            <input v-model="newPropName" placeholder="Prop Name (e.g. speed)" class="w-full bg-slate-950 text-xs px-2 py-1 rounded border border-border focus:border-primary outline-none text-white" />
            <div class="flex gap-1">
                <BaseSelect v-model="newPropType" :options="typeOptions" class="w-2/3" />
                <button @click="addNewProperty" class="bg-primary hover:bg-primary/90 text-white text-[10px] px-3 rounded flex-grow">Add</button>
                <button @click="isAdding = false" class="bg-slate-700 hover:bg-slate-600 text-white text-[10px] px-2 rounded">X</button>
            </div>
        </div>
    </div>

  </InspectorSection>
</template>
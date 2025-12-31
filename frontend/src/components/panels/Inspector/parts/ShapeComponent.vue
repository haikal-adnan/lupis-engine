<script setup>
import { computed } from "vue";
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";

import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { selectedEntity, notifyChange, removeComponent } = useInspectorLogic();

const componentData = computed(() => selectedEntity.value?.components?.ShapeRenderer);
const shapeTypes = [ { label: 'Rectangle', value: 'rectangle' }, { label: 'Circle', value: 'circle' } ];
</script>

<template>
  <InspectorSection title="Shape Renderer" v-if="componentData">
    <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg></template>
    <template #header-extra>
        <IconButton @click="removeComponent('ShapeRenderer')" class="hover:text-destructive" title="Remove Component">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </IconButton>
    </template>

    <PropertyRow label="Type">
        <BaseSelect v-model="componentData.type" :options="shapeTypes" @change="notifyChange" />
    </PropertyRow>

    <PropertyRow label="Color">
        <div class="flex gap-2">
            <input type="color" v-model="componentData.color" @input="notifyChange" class="h-7 w-8 bg-transparent border-0 cursor-pointer" />
            <BaseInput v-model="componentData.color" @change="notifyChange" />
        </div>
    </PropertyRow>
  </InspectorSection>
</template>
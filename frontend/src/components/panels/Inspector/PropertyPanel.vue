<script setup>
import { useSelection } from "@/composables/useSelection.js";
import { ComponentRegistry } from "./componentRegistry.js"; 

// Import komponen Fallback kita
import GenericComponent from "@/components/panels/Inspector/parts/GenericComponent.vue";

// Komponen Core
import ObjectComponent from "@/components/panels/Inspector/parts/ObjectComponent.vue";
import TransformComponent from "@/components/panels/Inspector/parts/TransformComponent.vue";

const { selectedEntity } = useSelection();
</script>

<template>
  <div v-if="selectedEntity" class="flex flex-col gap-2 pb-10">
    
    <ObjectComponent />
    <TransformComponent />

    <template v-if="selectedEntity.components">
        <template v-for="(data, key) in selectedEntity.components" :key="key">
            
            <component 
                v-if="ComponentRegistry[key]" 
                :is="ComponentRegistry[key]" 
            />
            
            <GenericComponent 
                v-else 
                :componentName="key" 
            />

        </template>
    </template>

    </div>
  <div v-else class="p-4 text-center text-muted-foreground text-xs">
    No selection
  </div>
</template>
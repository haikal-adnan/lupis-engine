<template>
  <PropertySection title="Header" :icon="Settings2" v-if="selectedNode">
    
    <template #header-extra>
      <div 
        class="w-3 h-3 rounded-full border border-border"
        :style="{ backgroundColor: headerColor }"
      ></div>
    </template>

    <template #menu="{ close }">
      <div class="p-1">
        <button 
          @click="deleteSelectedNode(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3 h-3 mr-2" />
          Delete Node
        </button>
      </div>
    </template>

    <PropertyRow label="Title">
      <BaseInput v-model="title" placeholder="Node Title" />
    </PropertyRow>

    <PropertyRow label="Color">
      <BaseColor v-model="headerColor" :show-label="true" />
    </PropertyRow>

    <PropertyRow label="Description">
      <BaseTextArea 
        v-model="description" 
        placeholder="Add comments..." 
        minHeight="60px"
      />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { Settings2, Trash2 } from 'lucide-vue-next';
import { useNodeLogic } from '@nodes/nodes.js';
import {
  PropertySection,
  PropertyRow,
  BaseInput,
  BaseTextArea,
  BaseColor
} from '@components/components.js';

const { selectedNode, bindNodeProp, deleteSelectedNode } = useNodeLogic();

const title = bindNodeProp('settings.headerTitle');
const headerColor = bindNodeProp('settings.headerColor');
const description = bindNodeProp('settings.description');
</script>
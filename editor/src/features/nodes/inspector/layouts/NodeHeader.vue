<template>
  <PropertySection title="Header" :icon="Settings2" v-if="selectedNode" data-testid="node-inspector-header-section">
    <template #header-extra>
      <div 
        class="w-3 h-3 rounded-full border border-border"
        :style="{ backgroundColor: headerColor }"
        data-testid="node-inspector-header-color-indicator"
      ></div>
    </template>

    <template #menu="{ close }">
      <div class="p-1">
        <button 
          @click="deleteSelectedNode(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
          data-testid="node-inspector-header-delete-btn"
        >
          <Trash2 class="w-3 h-3 mr-2" />
          Delete Node
        </button>
      </div>
    </template>

    <PropertyRow label="Title" data-testid="node-inspector-header-title-row">
      <BaseInput v-model="title" placeholder="Node Title" data-testid="node-inspector-header-title-input" />
    </PropertyRow>

    <PropertyRow label="Color" data-testid="node-inspector-header-color-row">
      <BaseColor v-model="headerColor" :show-label="true" data-testid="node-inspector-header-color-picker" />
    </PropertyRow>

    <PropertyRow label="Description" data-testid="node-inspector-header-description-row">
      <BaseTextArea 
        v-model="description" 
        placeholder="Add comments..." 
        minHeight="60px"
        data-testid="node-inspector-header-description-textarea"
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
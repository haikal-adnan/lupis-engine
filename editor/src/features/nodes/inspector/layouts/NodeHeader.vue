<template>
  <PropertySection title="Header" :icon="Settings2" v-if="selectedNode" data-testid="node-inspector-header-section">
    <template #header-extra>
      <div class="flex items-center gap-1.5 max-w-[180px]">
        <!-- Custom Label Badge (like Prefab badge in scene inspector) -->
        <div 
          v-if="isCustomNode"
          class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border select-none shrink-0 text-purple-400 border-purple-500"
          data-testid="node-inspector-header-custom-badge"
        >
          Custom
        </div>

        <div 
          class="w-3 h-3 rounded-full border border-border shrink-0"
          :style="{ backgroundColor: headerColor }"
          data-testid="node-inspector-header-color-indicator"
        ></div>
      </div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5 min-w-[160px]" role="menu" data-testid="node-inspector-header-menu">
        <!-- CUSTOM NODE ACTIONS -->
        <template v-if="isCustomNode">
          <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
            Custom Blueprint
          </div>

          <!-- Save to Project Library -->
          <button 
            type="button"
            role="menuitem"
            @click="handleSaveCustomNode(); close()" 
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-emerald-500/20 text-emerald-400 font-medium transition-colors"
            data-testid="node-inspector-header-save-custom-btn"
          >
            <Save class="w-3.5 h-3.5 mr-2" />
            Save as Blueprint
          </button>

          <!-- Edit Node Script in Code Editor -->
          <button 
            type="button"
            role="menuitem"
            @click="handleOpenCodePanel(); close()" 
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-foreground transition-colors"
            data-testid="node-inspector-header-open-code-btn"
          >
            <Code2 class="w-3.5 h-3.5 mr-2 text-blue-500 dark:text-blue-400" />
            Edit Node Script
          </button>

          <!-- Revert to Blueprint Preset (if ejected) -->
          <button 
            v-if="selectedNode?.originalType"
            type="button"
            role="menuitem"
            @click="handleRevertToPreset(); close()" 
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-amber-600 dark:text-amber-400 transition-colors"
            data-testid="node-inspector-header-revert-preset-btn"
          >
            <RotateCcw class="w-3.5 h-3.5 mr-2" />
            Revert to Preset
          </button>

          <div class="h-px bg-border my-1" role="separator"></div>
        </template>

        <!-- SYSTEM NODE ACTIONS -->
        <template v-else>
          <button 
            type="button"
            role="menuitem"
            @click="handleSetAsCustom(); close()" 
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-foreground transition-colors"
            data-testid="node-inspector-header-set-custom-btn"
          >
            <Cpu class="w-3.5 h-3.5 mr-2 text-purple-600 dark:text-purple-400" />
            Set as Custom Node
          </button>
          <div class="h-px bg-border my-1" role="separator"></div>
        </template>

        <!-- Delete Node -->
        <button 
          type="button"
          role="menuitem"
          @click="handleDeleteNode(); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
          data-testid="node-inspector-header-delete-btn"
        >
          <Trash2 class="w-3.5 h-3.5 mr-2" />
          Delete Node
        </button>
      </div>
    </template>

    <PropertyRow label="Title" data-testid="node-inspector-header-title-row">
      <BaseInput v-model="title" placeholder="Node Title" data-testid="node-inspector-header-title-input" />
    </PropertyRow>

    <PropertyRow label="Role" data-testid="node-inspector-header-role-row">
      <BaseSelect 
        :model-value="nodeRole"
        :disabled="!isCustomNode"
        :options="roleOptions"
        @update:model-value="handleRoleChange"
        data-testid="node-inspector-header-role-select"
      />
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
import { computed } from 'vue';
import { Settings2, Trash2, Cpu, Save, RotateCcw, Code2 } from 'lucide-vue-next';
import { useNodeLogic } from '@nodes/nodes.js';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert, usePrompt, useConfirm } from '@composables/composables.js';
import { overrideNodeFromBlueprint } from '@nodes/library/composables/useNodeOverride.js';
import { saveCustomBlueprintToLibrary, isUserCustomNode } from './custom/index.js';
import {
  PropertySection,
  PropertyRow,
  BaseInput,
  BaseSelect,
  BaseTextArea,
  BaseColor
} from '@components/components.js';

const { selectedNode, scriptStore, bindNodeProp, deleteSelectedNode } = useNodeLogic();
const projectStore = useProjectStore();
const workspaceStore = useWorkspaceStore();
const { showPop } = usePopAlert();
const { prompt } = usePrompt();
const { confirm } = useConfirm();

const title = bindNodeProp('settings.headerTitle');
const headerColor = bindNodeProp('settings.headerColor');
const description = bindNodeProp('settings.description');

const isCustomNode = computed(() => {
  return isUserCustomNode(selectedNode.value);
});

const nodeRole = computed(() => selectedNode.value?.role || 'action');

const roleOptions = [
  { label: 'Action (Exec In + Out)', value: 'action' },
  { label: 'Event (Exec Out only)', value: 'event' },
  { label: 'Pure (Data only)', value: 'pure' }
];

function handleSetAsCustom() {
  if (!selectedNode.value) return;
  const nodeTitle = selectedNode.value.settings?.headerTitle || selectedNode.value.label || 'Node';
  scriptStore.updateNodeInActive(selectedNode.value.id, {
    isCustomScript: true,
    originalType: selectedNode.value.type
  });
  showPop({
    title: 'Custom Node Converted',
    message: `Node "${nodeTitle}" has been converted to a Custom Node with customizable ports and editable code.`,
    type: 'success'
  });
}

async function handleSaveCustomNode() {
  if (!selectedNode.value) return;
  await saveCustomBlueprintToLibrary(selectedNode.value, projectStore, { prompt, showPop });
}

async function handleDeleteNode() {
  if (!selectedNode.value) return;
  const isConfirmed = await confirm({
    title: 'Delete Node',
    message: 'Delete this node? Connected wires will also be removed.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });
  if (isConfirmed) {
    const nodeTitle = selectedNode.value?.settings?.headerTitle || selectedNode.value?.label || 'Node';
    deleteSelectedNode();
    showPop({
      title: 'Node Deleted',
      message: `Node "${nodeTitle}" and all of its connected wires have been removed from the graph.`,
      type: 'info'
    });
  }
}

function handleOpenCodePanel() {
  if (!selectedNode.value) return;
  workspaceStore.openTab({
    id: `code_${selectedNode.value.id}`,
    name: selectedNode.value.settings?.headerTitle || selectedNode.value.label || 'Custom Code',
    type: 'code_editor'
  });
}

function handleRoleChange(newRole) {
  if (!selectedNode.value) return;
  const node = selectedNode.value;
  let inputs = [...(node.inputs || [])];
  let outputs = [...(node.outputs || [])];

  if (newRole === 'action') {
    if (!inputs.some(p => p.id === 'execIn')) {
      inputs.unshift({ id: 'execIn', dataType: 'execution', color: '#FFFFFF' });
    }
    if (!outputs.some(p => p.id === 'execOut')) {
      outputs.unshift({ id: 'execOut', dataType: 'execution', color: '#FFFFFF' });
    }
  } else if (newRole === 'event') {
    inputs = inputs.filter(p => p.id !== 'execIn');
    if (!outputs.some(p => p.id === 'execOut')) {
      outputs.unshift({ id: 'execOut', dataType: 'execution', color: '#FFFFFF' });
    }
  } else if (newRole === 'pure') {
    inputs = inputs.filter(p => p.id !== 'execIn');
    outputs = outputs.filter(p => p.id !== 'execOut');
  }

  scriptStore.updateNodeInActive(node.id, {
    role: newRole,
    inputs,
    outputs
  });
  showPop({
    title: 'Node Role Updated',
    message: `Role for node "${node.settings?.headerTitle || node.label || 'Node'}" changed to ${newRole.toUpperCase()} with updated execution ports.`,
    type: 'info'
  });
}

async function handleRevertToPreset() {
  const node = selectedNode.value;
  if (!node?.originalType) return;
  const isConfirmed = await confirm({
    title: 'Revert to Preset',
    message: `Revert to blueprint preset '${node.originalType}'? Custom modifications will be reset.`,
    confirmText: 'Revert',
    cancelText: 'Cancel',
    type: 'warning'
  });
  if (isConfirmed) {
    node.type = node.originalType;
    delete node.isCustomScript;
    delete node.originalType;
    overrideNodeFromBlueprint(node, scriptStore.activeScript);
    scriptStore.saveActiveScript();
    showPop({
      title: 'Node Reverted',
      message: `Node "${node.settings?.headerTitle || node.label || 'Node'}" has been reverted to its original system preset configuration.`,
      type: 'success'
    });
  }
}
</script>
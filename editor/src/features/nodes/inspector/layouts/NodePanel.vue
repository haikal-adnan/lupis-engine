<template>
  <div class="h-full flex flex-col bg-background text-foreground border-l border-border" data-testid="node-inspector-panel">
    <!-- SINGLE NODE SELECTED -->
    <ScrollArea v-if="targetInspectorNode" class="flex-1" data-testid="node-inspector-single-node-content">
      <div class="p-2 space-y-1">
        <NodeHeader />
        <component 
          v-if="customInspectorComponent" 
          :is="customInspectorComponent" 
          :node="targetInspectorNode" 
        />
        <NodeData v-else />
        <NodePorts />
      </div>
    </ScrollArea>

    <!-- MULTIPLE NODES SELECTED -->
    <div 
      v-else-if="selectedNodeIds.length > 1 && !isCodeEditorTab" 
      class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center select-none"
      data-testid="node-inspector-multi-selected-state"
    >
      <div class="w-12 h-12 rounded-full border border-blue-500 flex items-center justify-center mb-3 text-blue-500">
        <Layers class="w-6 h-6" />
      </div>
      <p class="text-xs font-semibold text-foreground" data-testid="node-inspector-multi-selected-count">
        {{ selectedNodeIds.length }} Nodes Selected
      </p>
      <p class="text-[10px] text-muted-foreground/70 mt-1 max-w-[180px]">
        Node settings nonaktif ketika lebih dari 1 node dipilih.
      </p>
    </div>

    <!-- EDGE SELECTED -->
    <ScrollArea v-else-if="selectedEdgeId && !isCodeEditorTab" class="flex-1" data-testid="node-inspector-edge-content">
      <div class="p-2 space-y-1">
        <NodeEdge />
      </div>
    </ScrollArea>

    <!-- EMPTY STATE -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center" data-testid="node-inspector-empty-selection-state">
      <div class="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
        <Workflow class="w-6 h-6 opacity-50" />
      </div>
      <p class="text-xs font-medium">Select a node or edge to edit</p>
      <p class="text-[10px] text-muted-foreground/60 mt-1">Click a node or wire in the graph</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Workflow, Layers } from 'lucide-vue-next';
import { NodeHeader, NodeData, NodePorts, NodeEdge, useNodeLogic } from '@nodes/nodes.js';
import { ScrollArea } from '@components/components.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { getCustomInspectorForNode } from './custom/index.js';

const workspaceStore = useWorkspaceStore();
const { selectedNode, scriptStore } = useNodeLogic();

const selectedNodeIds = computed(() => scriptStore.selectedNodeIds);
const selectedEdgeId = computed(() => scriptStore.selectedEdgeId);

const activeTab = computed(() => workspaceStore.activeTab);
const isCodeEditorTab = computed(() => activeTab.value?.type === 'code_editor');

const targetInspectorNode = computed(() => {
  if (isCodeEditorTab.value) {
    const tabNodeId = activeTab.value?.nodeId || activeTab.value?.id?.replace('code_', '');
    if (!scriptStore.activeScript || !tabNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n.id === tabNodeId);
  }
  return selectedNode.value;
});

const customInspectorComponent = computed(() => {
  return getCustomInspectorForNode(targetInspectorNode.value);
});
</script>
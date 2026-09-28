<template>
  <div class="h-full flex flex-col bg-background text-foreground border-l border-border">
    
    <!-- SINGLE NODE SELECTED (Normal Canvas Selection ATAU Code Editor Mode) -->
    <ScrollArea v-if="targetInspectorNode" class="flex-1">
      <div class="p-2 space-y-1">
        <NodeHeader />
        <NodeData />
        <NodePorts />
      </div>
    </ScrollArea>

    <!-- MULTIPLE NODES SELECTED (Disabled Inspector Opsi) -->
    <div v-else-if="selectedNodeIds.length > 1 && !isCodeEditorTab" class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center select-none">
      <div class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 text-blue-500">
        <Layers class="w-6 h-6" />
      </div>
      <p class="text-xs font-semibold text-foreground">{{ selectedNodeIds.length }} Nodes Selected</p>
      <p class="text-[10px] text-muted-foreground/70 mt-1 max-w-[180px]">
        Node settings nonaktif ketika lebih dari 1 node dipilih.
      </p>
    </div>

    <!-- EDGE SELECTED -->
    <ScrollArea v-else-if="selectedEdgeId && !isCodeEditorTab" class="flex-1">
      <div class="p-2 space-y-1">
        <NodeEdge />
      </div>
    </ScrollArea>

    <!-- EMPTY STATE -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
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

const workspaceStore = useWorkspaceStore();
const { selectedNode, scriptStore } = useNodeLogic();

const selectedNodeIds = computed(() => scriptStore.selectedNodeIds);
const selectedEdgeId = computed(() => scriptStore.selectedEdgeId);

// Cek apakah tab aktif adalah Code Editor
const activeTab = computed(() => workspaceStore.activeTab);
const isCodeEditorTab = computed(() => activeTab.value?.type === 'code_editor');

// Dapatkan node target untuk Inspector
const targetInspectorNode = computed(() => {
  if (isCodeEditorTab.value) {
    // Ambil nodeId dari tab code editor
    const tabNodeId = activeTab.value?.nodeId || activeTab.value?.id?.replace('code_', '');
    if (!scriptStore.activeScript || !tabNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n.id === tabNodeId);
  }
  // Mode Canvas biasa
  return selectedNode.value;
});
</script>
<template>
  <div class="h-full flex flex-col bg-background text-foreground border-l border-border">
    
    <ScrollArea v-if="selectedNode" class="flex-1">
      <div class="p-2 space-y-1">
        <NodeHeader />
        
        <NodeData />
        
        <NodePorts />
      </div>
    </ScrollArea>

    <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
      <div class="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
        <Workflow class="w-6 h-6 opacity-50" />
      </div>
      <p class="text-xs font-medium">Select a node to edit</p>
      <p class="text-[10px] text-muted-foreground/60 mt-1">Click a node in the graph</p>
    </div>
  </div>
</template>

<script setup>
import { Workflow } from 'lucide-vue-next';
import { useNodeLogic } from '@/modules/node/composables/useNodeLogic.js';

import ScrollArea from '@/commons/components/overlay/ScrollArea.vue';

import NodeHeader from '@/modules/node/components/NodeHeader.vue';
import NodeData from '@/modules/node/components/NodeData.vue';
import NodePorts from '@/modules/node/components/NodePorts.vue';

const { selectedNode } = useNodeLogic();
</script>
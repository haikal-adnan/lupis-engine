<template>
  <div class="h-full bg-background border-r border-border select-none flex flex-col">
    
    <ScrollArea class="flex-1">
      <div class="flex flex-col">
        <NodeVariable 
          scope="Global" 
          title="Global Variables" 
          :defaultOpen="false"
        />

        <NodeVariable 
          scope="Local" 
          title="Local Variables" 
          :defaultOpen="true"
        />

        <NodeLibrary />
      </div>
    </ScrollArea>

  </div>
</template>

<script setup>
import NodeVariable from '@editors/variable/components/NodeVariable.vue';
import NodeLibrary from '@editors/variable/components/NodeLibrary.vue';

import ScrollArea from '@/commons/components/overlay/ScrollArea.vue';
</script>
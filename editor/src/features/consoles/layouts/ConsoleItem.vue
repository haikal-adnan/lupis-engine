<template>
  <div 
    class="flex items-start gap-3 py-1.5 px-3 border-b border-border transition-colors font-mono text-xs group rounded-sm"
    :class="rowColorClass"
  >
    <div class="mt-0.5 shrink-0 w-4">
      <CircleX v-if="log.type === 'error'" class="w-3.5 h-3.5 text-rose-500" />
      <TriangleAlert v-else-if="log.type === 'warn'" class="w-3.5 h-3.5 text-amber-500" />
      <Info v-else class="w-3.5 h-3.5 text-blue-500" />
    </div>

    <div class="flex-1 leading-relaxed break-all">
      <span class="text-muted-foreground/50 mr-2 select-none text-[10px]">
        {{ log.formattedTime }}
      </span>
      
      <!-- Mapped Context Badges: [Scene Name] [Entity Script ID] [Script Name] [Node Name] -->
      <template v-if="parsedContext">
        <span class="inline-flex flex-wrap items-center gap-1 mr-2 align-middle select-none">
          <span 
            class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary/80 text-foreground/90 border border-border/50"
            :title="`Scene: ${parsedContext.scene}`"
          >
            [{{ parsedContext.scene }}]
          </span>
          <span 
            class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20"
            :title="`Entity Script ID: ${parsedContext.entityScriptId}`"
          >
            [{{ parsedContext.entityScriptId }}]
          </span>
          <span 
            class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"
            :title="`Script: ${parsedContext.script}`"
          >
            [{{ parsedContext.script }}]
          </span>
          <span 
            class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            :title="`Node: ${parsedContext.node}`"
          >
            [{{ parsedContext.node }}]
          </span>
        </span>
        <span :class="messageColorClass">
          {{ displayMessage }}
        </span>
      </template>

      <!-- Standard log without context mapping -->
      <template v-else>
        <span 
          v-if="log.source"
          class="font-semibold mr-2 cursor-pointer hover:underline opacity-80 group-hover:opacity-100 transition-opacity"
          :class="sourceColorClass"
          :title="log.source"
        >
          [{{ log.source }}]
        </span>

        <span :class="messageColorClass">
          {{ log.message }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Info, TriangleAlert, CircleX } from 'lucide-vue-next'

const props = defineProps({
  log: { type: Object, required: true } 
})

const parsedContext = computed(() => {
  if (props.log.context && (props.log.context.scene || props.log.context.node)) {
    return {
      scene: props.log.context.scene || 'Scene',
      entityScriptId: props.log.context.entityScriptId || props.log.context.entity || 'Entity',
      script: props.log.context.script || 'Script',
      node: props.log.context.node || 'Node'
    }
  }

  const match = props.log.message?.match(/^\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*([\s\S]*)$/)
  if (match) {
    return {
      scene: match[1],
      entityScriptId: match[2],
      script: match[3],
      node: match[4]
    }
  }
  return null
})

const displayMessage = computed(() => {
  if (parsedContext.value) {
    const match = props.log.message?.match(/^\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*([\s\S]*)$/)
    if (match) {
      return match[5]
    }
  }
  return props.log.message
})

const rowColorClass = computed(() => {
  switch (props.log.type) {
    case 'error': return 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10'
    case 'warn': return 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10'
    default: return 'hover:bg-secondary/40'
  }
})

const messageColorClass = computed(() => {
  switch (props.log.type) {
    case 'error': return 'text-rose-400'
    case 'warn': return 'text-amber-400'
    default: return 'text-foreground'
  }
})

const sourceColorClass = computed(() => {
    switch (props.log.type) {
    case 'error': return 'text-rose-500'
    case 'warn': return 'text-amber-500'
    default: return 'text-blue-500'
  }
})
</script>
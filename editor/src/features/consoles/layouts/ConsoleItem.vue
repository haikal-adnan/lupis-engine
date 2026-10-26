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
      
      <!-- Compact Context Badge like Unity/Godot/Unreal -->
      <template v-if="parsedContext">
        <span 
          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 mr-2 align-middle select-none shrink-0"
          :title="contextTooltip"
        >
          {{ contextBadgeText }}
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

    <!-- Repeat count multiplier (e.g. 2, 3) -->
    <div v-if="log.count && log.count > 1" class="shrink-0 self-center">
      <span 
        class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground/80 border border-border select-none"
        :title="`Repeated ${log.count} times`"
      >
        {{ log.count > 999 ? '999+' : log.count }}
      </span>
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
  if (props.log.context && (props.log.context.scene || props.log.context.node || props.log.context.script || props.log.context.entityScriptId)) {
    return {
      scene: props.log.context.scene || 'Scene',
      entityScriptId: props.log.context.entityScriptId || props.log.context.entity || 'Entity',
      script: props.log.context.script || 'Script',
      node: props.log.context.node || 'Node'
    }
  }

  // Fallback regex matching legacy [scene] [entity] [script] [node]
  const legacyMatch = props.log.message?.match(/^\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*([\s\S]*)$/)
  if (legacyMatch) {
    return {
      scene: legacyMatch[1],
      entityScriptId: legacyMatch[2],
      script: legacyMatch[3],
      node: legacyMatch[4]
    }
  }

  // Fallback regex matching modern [entity::script] or [script]
  const modernMatch = props.log.message?.match(/^\[(.*?)\]\s+([\s\S]*)$/)
  if (modernMatch && modernMatch[1].includes('::')) {
    const parts = modernMatch[1].split('::')
    return {
      scene: 'Scene',
      entityScriptId: parts[0] || 'Entity',
      script: parts[1] || 'Script',
      node: 'Node'
    }
  }

  return null
})

const contextBadgeText = computed(() => {
  if (!parsedContext.value) return ''
  const { entityScriptId, script } = parsedContext.value
  if (entityScriptId && entityScriptId !== 'Global' && entityScriptId !== 'Entity') {
    return script && script !== 'Script' ? `[${entityScriptId}::${script}]` : `[${entityScriptId}]`
  }
  return `[${script || entityScriptId || 'Script'}]`
})

const contextTooltip = computed(() => {
  if (!parsedContext.value) return ''
  const { scene, entityScriptId, script, node } = parsedContext.value
  return `Scene: ${scene} | Entity: ${entityScriptId} | Script: ${script} | Node: ${node}`
})

const displayMessage = computed(() => {
  if (parsedContext.value && props.log.message) {
    // Strip legacy 4 brackets if present
    const legacyMatch = props.log.message.match(/^\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*([\s\S]*)$/)
    if (legacyMatch) {
      return legacyMatch[5]
    }
    // Strip modern prefix [entity::script] or [script] if matching badge
    const badge = contextBadgeText.value
    if (badge && props.log.message.startsWith(badge)) {
      return props.log.message.slice(badge.length).trimStart()
    }
    const modernMatch = props.log.message.match(/^\[.*?\]\s+([\s\S]*)$/)
    if (modernMatch) {
      return modernMatch[1]
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
    case 'error': return 'text-rose-600 dark:text-rose-400'
    case 'warn': return 'text-amber-600 dark:text-amber-400'
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
<template>
  <div 
    ref="nodeRef"
    data-testid="graph-node"
    :data-node-id="data.id"
    :data-node-type="data.type"
    class="node-container absolute w-[200px] flex flex-col select-none border-2 rounded-lg transition-[border-color,box-shadow] duration-150 ease-out" 
    :class="[
      isDragging ? 'transition-none' : '',
      'bg-white dark:bg-[#252526]',
      isSelected 
        ? 'border-blue-500 z-50 shadow-lg dark:shadow-xl' 
        : 'border-slate-200 dark:border-[#3f3f46] hover:border-slate-300 dark:hover:border-[#52525b] z-10 ring-0 ring-transparent shadow-lg dark:shadow-xl',
      isDimmed ? 'opacity-30 grayscale filter' : 'opacity-100'
    ]"
    :style="{ 
        transform: `translate(${Math.round(position.x)}px, ${Math.round(position.y)}px) translateZ(0)`
    }"
    @mousedown="$emit('drag-start',$event)"
    @contextmenu.stop.prevent="$emit('node-contextmenu',$event, data)"
    @dblclick.stop="openEditor"
  >
    
    <div 
      data-testid="graph-node-header"
      class="h-8 px-3 flex items-center justify-between border-b rounded-t-[4px] shrink-0 border-black/5 dark:border-white/5"
      :style="{ backgroundColor: headerBackground }"
    >
       <div class="flex items-center gap-2 truncate">
         <div class="w-2 h-2 rounded-full bg-white/50 shadow-sm shrink-0"></div>
         <span data-testid="graph-node-title" class="text-[11px] font-bold text-white uppercase tracking-wide truncate shadow-sm">
           {{ data.settings?.headerTitle || 'Node' }}
         </span>
       </div>
       <Code v-if="data.data?.code" data-testid="graph-node-code-icon" class="w-3.5 h-3.5 text-white/70 hover:text-white shrink-0 cursor-pointer" @click.stop="openEditor" />
    </div>

    <div 
      class="relative"
      :style="{ height: minBodyHeight + 'px' }"
    >
      <div class="absolute w-full px-3 py-2 flex flex-col gap-1 z-20" :style="{ top: (maxPorts * 24) + 'px' }">
         <div v-for="fieldKey in visibleFields" :key="fieldKey" class="n-field-row" @mousedown.stop>
            <span class="n-label capitalize truncate flex-1">{{ fieldKey }}</span>
            <div 
              data-testid="graph-node-field-value"
              :data-field-key="fieldKey"
              class="n-value-box cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 truncate max-w-[80px] text-right"
              :class="typeof data.data[fieldKey] === 'boolean' 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-blue-600 dark:text-blue-300'"
              @click="editValue(fieldKey)"
            >
              <span v-if="typeof data.data[fieldKey] === 'boolean'">
                  {{ data.data[fieldKey] ? 'true' : 'false' }}
              </span>
              <span v-else>
                  {{ data.data[fieldKey] }}
              </span>
            </div>
         </div>
      </div>

      <div class="absolute left-0 top-0 w-1/2 h-full pointer-events-none">
        <div 
          v-for="(input, index) in data.inputs" 
          :key="input.id" 
          class="absolute left-0 w-full h-[24px] flex items-center"
          :style="{ top: (12 + (index * 24) - 6) + 'px' }" 
        >
          <div 
            data-testid="graph-node-input-port"
            :data-port-id="input.id"
            :data-port-type="input.dataType"
            class="relative -left-1.5 w-3 h-3 rounded-full border-2 transition-colors hover:ring-2 hover:ring-blue-400 cursor-crosshair pointer-events-auto z-30 border-slate-400 dark:border-slate-600"
            :style="{ backgroundColor: input.color }" 
            @mousedown.stop="$emit('connect-start',$event, input.id, 'input')" 
            @mouseup="$emit('connect-end', input.id)"
            @mouseenter="showTooltip($event, input.dataType)" 
            @mouseleave="hideTooltip"
          ></div>
          
          <span class="ml-2 text-[10px] font-medium truncate opacity-90 text-slate-600 dark:text-slate-300">
            {{ input.label || input.id }}
          </span>
        </div>
      </div>

      <div class="absolute right-0 top-0 w-1/2 h-full pointer-events-none">
        <div 
          v-for="(output, index) in data.outputs" 
          :key="output.id" 
          class="absolute right-0 w-full h-[24px] flex items-center justify-end"
          :style="{ top: (12 + (index * 24) - 6) + 'px' }"
        >
          <span class="mr-2 text-[10px] font-medium truncate opacity-90 text-right text-slate-600 dark:text-slate-300">
            {{ output.label || output.id }}
          </span>

          <div 
            data-testid="graph-node-output-port"
            :data-port-id="output.id"
            :data-port-type="output.dataType"
            class="relative -right-1.5 w-3 h-3 rounded-full border-2 transition-colors hover:ring-2 hover:ring-blue-400 cursor-crosshair pointer-events-auto z-30 border-slate-400 dark:border-slate-600"
            :style="{ backgroundColor: output.color }" 
            @mousedown.stop="$emit('connect-start',$event, output.id, 'output')"
            @mouseenter="showTooltip($event, output.dataType)"
            @mouseleave="hideTooltip"
          ></div>
        </div>
      </div>
    </div>

    <Teleport to="body">
        <div 
            v-if="tooltip.visible"
            data-testid="graph-node-tooltip"
            class="fixed z-[9999] px-2 py-1 text-[10px] font-mono rounded border pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px] shadow-lg capitalize bg-white/95 text-slate-800 border-slate-200 shadow-xl dark:bg-black/80 dark:text-white dark:border-white/10"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
            {{ tooltip.text }}
        </div>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { Code } from 'lucide-vue-next'
import { usePrompt } from '@composables/composables.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'

const props = defineProps({ 
  data: Object, 
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  isSelected: Boolean, 
  isDimmed: Boolean,
  isDragging: Boolean
})

defineEmits(['drag-start', 'connect-start', 'connect-end', 'node-contextmenu'])

const workspaceStore = useWorkspaceStore()
const { prompt } = usePrompt()

const openEditor = () => {
  const nodeTitle = props.data.settings?.headerTitle || 'Node'
  workspaceStore.openTab({
    id: `code_${props.data.id}`,
    name: `${nodeTitle} (${props.data.id.slice(0, 4)})`,
    type: 'code_editor',
    nodeId: props.data.id
  })
}

const headerBackground = computed(() => (props.data.settings?.headerColor || '#333') + 'CC')
const visibleFields = computed(() => props.data.settings?.visibleDataFields || [])

const maxPorts = computed(() => {
  const inputCount = props.data.inputs?.length || 0
  const outputCount = props.data.outputs?.length || 0
  return Math.max(inputCount, outputCount)
})

const minBodyHeight = computed(() => {
  const portArea = 12 + (maxPorts.value * 24)
  const variableArea = visibleFields.value.length > 0 ? (visibleFields.value.length * 30) + 10 : 12
  return portArea + variableArea
})

const editValue = async (key) => {
  const current = props.data.data[key]
  if (typeof current === 'boolean') {
    props.data.data[key] = !current
    return
  }
  const res = await prompt({ title: `Edit ${key}`, defaultValue: current })
  if (res !== null) {
    props.data.data[key] = isNaN(Number(res)) ? res : Number(res)
  }
}

const tooltip = reactive({
    visible: false,
    text: '',
    x: 0,
    y: 0
})

const showTooltip = (event, text) => {
    if (!text) return
    const rect = event.target.getBoundingClientRect()
    tooltip.text = text
    tooltip.x = rect.left + (rect.width / 2)
    tooltip.y = rect.top
    tooltip.visible = true
}

const hideTooltip = () => {
    tooltip.visible = false
}
</script>
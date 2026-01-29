<template>
  <div 
    class="node-container absolute w-[200px] bg-[#252526] rounded-lg flex flex-col select-none border-2" 
    :class="[
      isDragging ? 'transition-none' : 'transition-all duration-300 ease-in-out',
      isSelected 
        ? 'border-blue-500 ring-4 ring-blue-500/20 z-50 shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
        : 'border-[#3f3f46] hover:border-[#52525b] z-10 ring-0 ring-transparent shadow-xl',
      isDimmed 
        ? 'opacity-30 grayscale filter' 
        : 'opacity-100'
    ]"
    :style="{ 
        transform: `translate(${Math.round(position.x)}px, ${Math.round(position.y)}px) translateZ(0)`
    }"
    @mousedown="$emit('drag-start', $event)"
    @mouseenter="$emit('node-hover', data._id)"
    @mouseleave="$emit('node-hover', null)"
    @contextmenu.stop.prevent="$emit('node-contextmenu', $event, data)"
  >
    
    <div 
      class="h-8 px-3 flex items-center gap-2 border-b border-white/5 rounded-t-[4px] shrink-0"
      :style="{ backgroundColor: headerBackground }"
    >
       <div class="w-2 h-2 rounded-full bg-white/50 shadow-sm"></div>
       <span class="text-[11px] font-bold text-white uppercase tracking-wide truncate shadow-sm">
         {{ data.settings?.headerTitle || 'Node' }}
       </span>
    </div>

    <div 
      class="relative"
      :style="{ height: minBodyHeight + 'px' }"
    >
      <div class="absolute w-full px-3 py-2 flex flex-col gap-1 z-20" :style="{ top: (maxPorts * 24) + 'px' }">
         <div v-for="fieldKey in visibleFields" :key="fieldKey" class="n-field-row" @mousedown.stop>
            <span class="n-label capitalize truncate flex-1">{{ fieldKey }}</span>
            <div 
              class="n-value-box cursor-pointer hover:bg-white/10 truncate max-w-[80px] text-right"
              :class="typeof data.data[fieldKey] === 'boolean' ? 'text-red-400' : 'text-blue-300'"
              @click="editValue(fieldKey)"
            >
              <span v-if="typeof data.data[fieldKey] === 'boolean'">
                  {{ data.data[fieldKey] ? '✔' : '✖' }}
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
          :key="input._id" 
          class="absolute left-0 w-full h-[24px] flex items-center"
          :style="{ top: (12 + (index * 24) - 6) + 'px' }" 
        >
          <div 
            class="relative -left-1.5 w-3 h-3 rounded-full border-2 border-[#18181b] transition-transform hover:scale-125 cursor-crosshair pointer-events-auto z-30"
            :style="{ backgroundColor: input.color }" 
            
            @mousedown.stop="$emit('connect-start', $event, input._id, 'input')" 
            @mouseup="$emit('connect-end', input._id)"
            
            @mouseenter="showTooltip($event, input.dataType)" 
            @mouseleave="hideTooltip"
          ></div>
          
          <span class="ml-2 text-[10px] font-medium text-slate-300 truncate opacity-90">
            {{ input.label }}
          </span>
        </div>
      </div>

      <div class="absolute right-0 top-0 w-1/2 h-full pointer-events-none">
        <div 
          v-for="(output, index) in data.outputs" 
          :key="output._id" 
          class="absolute right-0 w-full h-[24px] flex items-center justify-end"
          :style="{ top: (12 + (index * 24) - 6) + 'px' }"
        >
          <span class="mr-2 text-[10px] font-medium text-slate-300 truncate opacity-90 text-right">
            {{ output.label }}
          </span>

          <div 
            class="relative -right-1.5 w-3 h-3 rounded-full border-2 border-[#18181b] transition-transform hover:scale-125 cursor-crosshair pointer-events-auto z-30"
            :style="{ backgroundColor: output.color }" 
            
            @mousedown.stop="$emit('connect-start', $event, output._id, 'output')"
            
            @mouseenter="showTooltip($event, output.dataType)"
            @mouseleave="hideTooltip"
          ></div>
        </div>
      </div>
    </div>

    <Teleport to="body">
        <div 
            v-if="tooltip.visible"
            class="fixed z-[9999] px-2 py-1 text-[10px] font-mono text-white bg-black/80 rounded border border-white/10 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px] shadow-lg capitalize"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
            {{ tooltip.text }}
        </div>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { usePrompt } from '@/composables/usePrompt.js'

const props = defineProps({ 
  data: Object, 
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  isSelected: Boolean, 
  isDimmed: Boolean,
  isDragging: Boolean
})

defineEmits(['drag-start', 'node-hover', 'connect-start', 'connect-end', 'node-contextmenu'])

const { prompt } = usePrompt()

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
  if (res !== null) props.data.data[key] = isNaN(Number(res)) ? res : Number(res)
}

// Tooltip State & Logic
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

<style scoped>
/* ... style existing ... */
.n-field-row {
  @apply flex justify-between items-center text-xs bg-black/40 rounded px-2 py-1 border border-white/5 h-[26px];
}
.n-label {
  @apply text-slate-400 font-medium text-[9px];
}
.n-value-box {
  @apply font-mono font-bold transition-colors select-none text-[9px];
}
.transition-none {
  transition: none !important;
}
</style>
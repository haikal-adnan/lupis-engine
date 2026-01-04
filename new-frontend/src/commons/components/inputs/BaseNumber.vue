<template>
  <div class="flex flex-col w-full space-y-1.5">
    <label
      v-if="label"
      :for="id"
      class="text-xs font-medium text-muted-foreground select-none"
    >
      {{ label }}
    </label>

    <div
      class="group relative flex items-center w-full transition-all duration-200 border rounded-md bg-background 
             focus-within:border-primary focus-within:ring-1 focus-within:ring-primary
             hover:border-muted-foreground/50 border-input overflow-hidden"
      :class="{ 'cursor-ew-resize': isDragging }"
      :style="{
        borderRadius: radius,
        height: height,
      }"
    >
      <div
        v-if="prefix"
        @mousedown.prevent="startScrub"
        class="h-full flex items-center justify-center pl-3 pr-2 select-none border-r border-transparent 
               bg-muted/20 transition-colors relative z-10 cursor-ew-resize hover:bg-muted/40 hover:text-primary"
        :class="[
          isDragging ? '!bg-primary/20 !text-primary border-primary/20' : 'group-focus-within:border-border/50'
        ]"
      >
        <span class="text-xs font-bold font-mono text-muted-foreground transition-colors"
          :class="[
             isDragging ? '!text-primary' : 'group-focus-within:text-primary'
          ]"
        >
          {{ prefix }}
        </span>
      </div>

      <input
        :id="id"
        ref="inputRef"
        v-model="model"
        type="text" 
        class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40
               focus:ring-0 px-2"
        :placeholder="placeholder"
        :style="{
          paddingLeft: prefix ? '0px' : paddingX
        }"
        @keydown.up.prevent="increment(step)"
        @keydown.down.prevent="increment(-step)"
        @blur="formatOnBlur"
      />
      
      <div 
        v-if="suffix" 
        class="h-full flex items-center pr-3 pl-1 text-xs text-muted-foreground select-none bg-muted/20"
      >
        {{ suffix }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, useId } from 'vue'

const { 
  label, 
  prefix, 
  suffix,
  placeholder = '', 
  radius = '0.375rem', 
  height = '2rem',
  paddingX = '0.75rem',
  step = 1, 
  min = -Infinity,
  max = Infinity
} = defineProps({
  label: String,
  prefix: String,
  suffix: String,
  placeholder: String,
  radius: String,
  height: String,
  paddingX: String,
  step: Number,
  min: Number,
  max: Number
})

const model = defineModel({ type: [Number, String] })
const id = useId()
const inputRef = ref(null)

const isDragging = ref(false)
let startX = 0
let startValue = 0

function startScrub(event) {
  isDragging.value = true
  startX = event.clientX
  startValue = parseFloat(model.value) || 0

  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopScrub)
}

function onMouseMove(event) {
  if (!isDragging.value) return

  const currentX = event.clientX
  const deltaX = currentX - startX

  let multiplier = 1
  if (event.shiftKey) multiplier = 10   
  if (event.altKey) multiplier = 0.1   

  const change = deltaX * step * multiplier
  let newValue = startValue + change

  if (Number.isInteger(step) && !event.altKey && Number.isInteger(startValue)) {
     newValue = Math.round(newValue)
  } else {
     newValue = parseFloat(newValue.toFixed(2))
  }

  if (newValue < min) newValue = min
  if (newValue > max) newValue = max

  model.value = newValue
}

function stopScrub() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopScrub)
}

function increment(val) {
  const current = parseFloat(model.value) || 0
  let newValue = current + val
  
  if (newValue < min) newValue = min
  if (newValue > max) newValue = max

  model.value = parseFloat(newValue.toFixed(2))
}

function formatOnBlur() {
    let val = parseFloat(model.value)
    if (isNaN(val)) return 
    
    if (val < min) val = min
    if (val > max) val = max
    
    model.value = val
}
</script>

<style scoped>
/* Hilangkan spinner default browser */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>
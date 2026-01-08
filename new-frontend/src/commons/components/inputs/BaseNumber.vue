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
        v-model="displayValue"
        type="text" 
        class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40
               focus:ring-0 px-2"
        :placeholder="placeholder"
        :style="{
          paddingLeft: prefix ? '0px' : paddingX
        }"
        @keydown.up.prevent="increment(step)"
        @keydown.down.prevent="increment(-step)"
        @blur="handleBlur"
        @change="handleChange"
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
import { ref, useId, computed, watch } from 'vue'

const props = defineProps({
  label: String,
  prefix: String,
  suffix: String,
  placeholder: String,
  radius: { type: String, default: '0.375rem' },
  height: { type: String, default: '2rem' },
  paddingX: { type: String, default: '0.75rem' },
  step: { type: Number, default: 1 },
  // Batas Range
  min: { type: Number, default: -Infinity },
  max: { type: Number, default: Infinity },
  // Fitur 1: Mematikan batasan sepenuhnya (Unlock)
  ignoreRange: { type: Boolean, default: false },
  // Fitur 2: Jika true, nilai akan berputar (Wrap) alih-alih mentok (Clamp)
  cyclic: { type: Boolean, default: false }
})

const model = defineModel({ type: [Number, String] })
const id = useId()
const inputRef = ref(null)

// Local state untuk display agar responsif saat mengetik
const localInput = ref(model.value)

const displayValue = computed({
  get: () => localInput.value,
  set: (val) => { localInput.value = val }
})

watch(() => model.value, (newVal) => {
  if (!isDragging.value) {
    localInput.value = newVal
  }
})

// --- Logic Inti: Normalize (Clamp vs Wrap) ---

function normalizeValue(val) {
  // 1. Jika range diabaikan (Unlock), kembalikan apa adanya
  if (props.ignoreRange) return val
  
  // 2. Jika Cyclic (Wrap) aktif
  // Rumus: min + (val - min) % range
  if (props.cyclic) {
    // Hitung lebar rentang. 
    // Untuk 0-359 dengan step 1, lebarnya adalah 360 (max - min + step)
    const rangeSpan = (props.max - props.min) + (Number.isInteger(props.step) ? props.step : 0)
    
    // Logika Modulo yang menangani nilai negatif dengan benar di JS
    const wrapped = ((val - props.min) % rangeSpan + rangeSpan) % rangeSpan + props.min
    
    // Tangani edge case floating point precision (opsional)
    return parseFloat(wrapped.toFixed(2))
  }

  // 3. Default: Clamping (Mentok)
  let clamped = val
  if (clamped < props.min) clamped = props.min
  if (clamped > props.max) clamped = props.max
  return clamped
}

function updateModel(val) {
  const num = parseFloat(val)
  if (isNaN(num)) return

  const finalVal = normalizeValue(num)
  
  model.value = finalVal
  localInput.value = finalVal 
}

// --- Scrubbing Logic ---

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

  const change = deltaX * props.step * multiplier
  let newValue = startValue + change

  // Pembulatan desimal vs integer
  if (Number.isInteger(props.step) && !event.altKey && Number.isInteger(startValue)) {
     newValue = Math.round(newValue)
  } else {
     newValue = parseFloat(newValue.toFixed(2))
  }

  // Terapkan Wrap atau Clamp
  newValue = normalizeValue(newValue)

  model.value = newValue
  localInput.value = newValue
}

function stopScrub() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopScrub)
}

// --- Input & Keyboard Logic ---

function increment(val) {
  const current = parseFloat(model.value) || 0
  let newValue = current + val
  
  newValue = normalizeValue(newValue)
  
  if (!Number.isInteger(props.step)) {
    newValue = parseFloat(newValue.toFixed(2))
  }

  updateModel(newValue)
}

function handleBlur() {
   updateModel(localInput.value)
}

function handleChange() {
   updateModel(localInput.value)
}
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>
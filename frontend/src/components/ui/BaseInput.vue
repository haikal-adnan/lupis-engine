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
               bg-muted/20 transition-colors relative z-10"
        :class="[
          canScrub ? 'cursor-ew-resize hover:bg-muted/40 hover:text-primary' : 'cursor-default',
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
        :type="inputType"
        class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40
               focus:ring-0 px-2"
        :placeholder="placeholder"
        :style="{
          paddingLeft: prefix ? '0px' : paddingX
        }"
        @keydown.up.prevent="increment(step)"
        @keydown.down.prevent="increment(-step)"
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
import { ref, computed, useId } from 'vue'

const { 
  label, 
  prefix, 
  suffix,
  placeholder = '', 
  type = 'text',
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
  type: String,
  radius: String,
  height: String,
  paddingX: String,
  step: Number,
  min: Number,
  max: Number
})

const model = defineModel()
const id = useId()
const inputRef = ref(null)

// State untuk Scrubbing
const isDragging = ref(false)
let startX = 0
let startValue = 0

// Input type text agar spinner hilang, tapi logic tetap number
const inputType = computed(() => type === 'number' ? 'text' : type) 
const canScrub = computed(() => type === 'number' || typeof model.value === 'number')

// --- SCRUBBING LOGIC ---

function startScrub(event) {
  if (!canScrub.value) return

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

  // Modifier keys
  let multiplier = 1
  if (event.shiftKey) multiplier = 10   // Cepat
  if (event.altKey) multiplier = 0.1    // Presisi

  const change = deltaX * step * multiplier
  let newValue = startValue + change

  // Formatting value
  if (Number.isInteger(step) && !event.altKey && Number.isInteger(startValue)) {
     newValue = Math.round(newValue)
  } else {
     newValue = parseFloat(newValue.toFixed(2))
  }

  // Clamp
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
  if (!canScrub.value) return
  const current = parseFloat(model.value) || 0
  model.value = parseFloat((current + val).toFixed(2))
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
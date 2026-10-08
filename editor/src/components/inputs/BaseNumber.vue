<template>
  <div 
    class="flex flex-col w-full space-y-1.5" 
    :class="{ 'opacity-50 pointer-events-none': disabled }"
    data-testid="base-number"
  >
    <label
      v-if="label"
      :for="id"
      class="font-medium text-muted-foreground select-none"
      :class="[labelSize]"
      data-part="number-label"
    >
      {{ label }}
    </label>

    <div
      class="group relative flex items-center w-full transition-all duration-200 border rounded-md bg-background 
             focus-within:border-primary focus-within:ring-1 focus-within:ring-primary
             hover:border-muted-foreground/50 border-input overflow-hidden"
      :class="{ 'cursor-ew-resize': isDragging && !disabled }"
      :style="{ borderRadius: radius, height: height }"
    >
      <!-- Prefix / Scrub Handle -->
      <div
        v-if="prefix"
        @mousedown.prevent="startScrub"
        class="h-full flex items-center justify-center pl-3 pr-2 select-none border-r border-transparent 
              bg-muted/20 transition-colors relative shrink-0"
        :class="[
          disabled ? 'cursor-not-allowed' : 'cursor-ew-resize hover:bg-muted/40 hover:text-primary',
          isDragging ? '!bg-primary/20 !text-primary border-primary/20' : 'group-focus-within:border-border/50'
        ]"
        data-part="scrub-handle"
        :data-dragging="isDragging"
        aria-label="Scrub control"
      >
        <span
          class="font-bold font-mono text-muted-foreground transition-colors whitespace-nowrap"
          :class="[labelSize, isDragging ? '!text-primary' : 'group-focus-within:text-primary']"
        >
          {{ prefix }}
        </span>
      </div>

      <!-- Main Text Input for Float Values -->
      <input
        :id="id"
        ref="inputRef"
        v-model="displayValue"
        type="text"
        inputmode="decimal" 
        :disabled="disabled"
        :aria-disabled="disabled"
        class="w-full h-full bg-transparent border-none outline-none text-foreground px-2 disabled:cursor-not-allowed font-mono"
        :class="[textSize]"
        :placeholder="placeholder"
        :aria-label="label || prefix || placeholder || 'Numeric Input'"
        data-part="number-input"
        :style="{ paddingLeft: prefix ? '0px' : paddingX }"
        @input="validateInput"
        @keydown.up.prevent="increment(step)"
        @keydown.down.prevent="increment(-step)"
        @keydown.enter="handleEnter"
        @keydown.esc="handleEsc"
        @blur="handleBlur"
        @change="handleChange"
      />
      
      <div 
        v-if="suffix" 
        class="h-full flex items-center pr-3 pl-1 text-muted-foreground bg-muted/20" 
        :class="[labelSize]"
        data-part="number-suffix"
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
  disabled: Boolean, 
  radius: { type: String, default: '0.375rem' },
  height: { type: String, default: '2rem' },
  paddingX: { type: String, default: '0.75rem' },
  textSize: { type: String, default: 'text-sm' },
  labelSize: { type: String, default: 'text-xs' },
  step: { type: Number, default: 0.1 },
  min: { type: Number, default: -Infinity },
  max: { type: Number, default: Infinity },
  ignoreRange: { type: Boolean, default: false },
  cyclic: { type: Boolean, default: false },
  scrubSensitivity: { type: Number, default: 1 }, 
  precision: { type: Number, default: null }
})

const model = defineModel({ type: [Number, String] })
const id = useId()
const inputRef = ref(null)
const localInput = ref(model.value)
const isDragging = ref(false)

let startX = 0
let startValue = 0

const displayValue = computed({
  get: () => localInput.value,
  set: (val) => { localInput.value = val }
})

watch(() => model.value, (newVal) => {
  if (!isDragging.value) {
    localInput.value = formatValue(newVal)
  }
}, { immediate: true })

function formatValue(val) {
  if (val === null || val === undefined || val === '') return ''
  const num = parseFloat(val)
  if (isNaN(num)) return val
  
  if (props.precision !== null) {
    return parseFloat(num.toFixed(props.precision))
  }
  
  const stepPrecision = getStepPrecision(props.step)
  if (stepPrecision > 0) {
    return parseFloat(num.toFixed(stepPrecision))
  }

  return num
}

function getStepPrecision(step) {
  if (!step || !step.toString().includes('.')) return 0
  return step.toString().split('.')[1].length
}

function validateInput(event) {
  let value = event.target.value
  let clean = value.replace(/[^0-9.-]/g, '')
  if (clean.lastIndexOf('-') > 0) {
    clean = '-' + clean.replace(/-/g, '') 
  }
  const parts = clean.split('.')
  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('')
  localInput.value = clean
}

function normalizeValue(val) {
  if (props.ignoreRange) return val
  if (props.cyclic) {
    const rangeSpan = (props.max - props.min) + props.step
    return ((((val - props.min) % rangeSpan) + rangeSpan) % rangeSpan) + props.min
  }
  return Math.max(props.min, Math.min(props.max, val))
}

function updateModel(val) {
  if (val === '' || val === '-' || val === '.') return
  let num = parseFloat(val)
  if (isNaN(num)) return 
  
  const finalVal = formatValue(normalizeValue(num))
  model.value = finalVal
  localInput.value = finalVal
}

function startScrub(event) {
  if (props.disabled) return 
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

  const deltaX = event.clientX - startX
  let modifier = 1
  if (event.shiftKey) modifier = 10
  if (event.altKey) modifier = 0.1

  const pixelsPerStep = 5 / props.scrubSensitivity
  const stepsToMove = (deltaX / pixelsPerStep) * modifier
  
  let newValue = startValue + (stepsToMove * props.step)
  newValue = normalizeValue(newValue)
  
  const cleanedValue = formatValue(newValue)
  model.value = cleanedValue
  localInput.value = cleanedValue
}

function stopScrub() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopScrub)
  updateModel(model.value)
}

function increment(val) {
  if (props.disabled) return
  const current = parseFloat(model.value) || 0
  const precision = Math.max(getStepPrecision(props.step), getStepPrecision(current))
  const updated = parseFloat((current + val).toFixed(precision || 4))
  updateModel(updated)
}

function handleBlur() { updateModel(localInput.value) }
function handleChange() { updateModel(localInput.value) }
function handleEnter() { updateModel(localInput.value); inputRef.value?.blur() }
function handleEsc() { localInput.value = model.value; inputRef.value?.blur() }
</script>

<style scoped>
input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }
</style>
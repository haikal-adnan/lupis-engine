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
        inputmode="decimal" 
        class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40
                focus:ring-0 px-2"
        :placeholder="placeholder"
        :style="{
          paddingLeft: prefix ? '0px' : paddingX
        }"
        @input="validateInput"
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
  min: { type: Number, default: -Infinity },
  max: { type: Number, default: Infinity },
  ignoreRange: { type: Boolean, default: false },
  cyclic: { type: Boolean, default: false },
  scrubSensitivity: { type: Number, default: 1 } 
})

const model = defineModel({ type: [Number, String] })
const id = useId()
const inputRef = ref(null)

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

// --- RESTRICTION LOGIC ---
function validateInput(event) {
  let value = event.target.value;
  
  // Regex: 
  // ^-?           -> Boleh ada minus di awal (opsional)
  // \d* -> Diikuti angka 0 atau lebih
  // (\.\d*)?      -> Boleh ada titik desimal diikuti angka (opsional group)
  // $             -> Akhir string
  // Logic: Hapus karakter yg tidak sesuai dengan pola angka umum
  
  // Strategi sederhana: Hapus semua karakter selain angka, minus, dan titik
  // Lalu pastikan minus hanya di depan dan titik hanya satu.
  
  // 1. Filter karakter illegal (huruf, simbol aneh)
  let clean = value.replace(/[^0-9.-]/g, '');

  // 2. Fix Minus (Hanya boleh di index 0)
  if (clean.lastIndexOf('-') > 0) {
      clean = clean.replace(/-/g, ''); // Hapus semua minus dulu
      clean = '-' + clean; // Tambah lagi di depan (opsional logic, atau reject aja)
  }

  // 3. Fix Titik (Hanya boleh satu)
  const parts = clean.split('.');
  if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
  }

  // Jika hasil cleaning beda dengan input user, paksa update value input
  if (value !== clean) {
     localInput.value = clean;
     // Hack untuk memaksa render update jika v-model tidak mendeteksi perubahan drastis
     event.target.value = clean; 
  }
}

// --- Logic Inti: Normalize ---
function normalizeValue(val) {
  if (props.ignoreRange) return val
  
  if (props.cyclic) {
    const rangeSpan = (props.max - props.min) + (Number.isInteger(props.step) ? props.step : 0)
    const wrapped = ((val - props.min) % rangeSpan + rangeSpan) % rangeSpan + props.min
    return parseFloat(wrapped.toFixed(2))
  }

  let clamped = val
  if (clamped < props.min) clamped = props.min
  if (clamped > props.max) clamped = props.max
  return clamped
}

function updateModel(val) {
  // Handle empty string atau hanya "-" atau "."
  if (val === '' || val === '-' || val === '.') {
      return; // Jangan update model dgn NaN, biarkan user ngetik
  }

  const num = parseFloat(val)
  if (isNaN(num)) return // Safety check

  const finalVal = normalizeValue(num)
  model.value = finalVal
  
  // Update tampilan jika hasil normalisasi berbeda (misal kena clamp min/max)
  // Tapi jika user mengetik "1.0", jangan ubah jadi "1" dulu agar user bisa ngetik "1.05"
  if (finalVal !== num) {
      localInput.value = finalVal 
  }
}

// --- Scrubbing Logic Updated ---
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

  const change = deltaX * props.step * multiplier * props.scrubSensitivity
  
  let newValue = startValue + change

  if (Number.isInteger(props.step) && !event.altKey && Number.isInteger(startValue) && Number.isInteger(props.scrubSensitivity)) {
     newValue = Math.round(newValue)
  } else {
     newValue = parseFloat(newValue.toFixed(2))
  }

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
  localInput.value = newValue // Force update display
}

function handleBlur() {
   // Saat blur (user selesai ngetik), baru kita paksa format ulang
   // Misal user ngetik "10." -> jadi "10"
   // Atau "007" -> jadi "7"
   updateModel(localInput.value)
   // Sync display dengan model akhir
   localInput.value = model.value 
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
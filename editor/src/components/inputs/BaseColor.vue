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
      :style="{
        borderRadius: radius,
        height: height,
      }"
    >
      <div
        class="relative h-full flex items-center justify-center px-2 border-r border-transparent 
                bg-muted/20 group-focus-within:border-border transition-colors"
      >
        <div 
          class="w-5 h-5 rounded-[2px] border border-border shadow-sm transition-transform active:scale-95"
          :style="{ backgroundColor: model }"
        ></div>

        <input
          type="color"
          :value="model"
          @input="onColorPickerChange"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Choose color"
        />
      </div>

      <input
        :id="id"
        v-model="localValue"
        type="text"
        maxlength="7"
        spellcheck="false"
        class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground font-mono uppercase 
               placeholder:text-muted-foreground/40 focus:ring-0 px-3"
        placeholder="#000000"
        @keydown.enter="validateAndSync"
        @blur="validateAndSync"
      />
    </div>
  </div>
</template>

<script setup>
import { useId, ref, watch } from 'vue'

const props = defineProps({
  label: String,
  radius: { type: String, default: '0.375rem' },
  height: { type: String, default: '2rem' }
})

const model = defineModel({ default: '#000000' })
const id = useId()

const localValue = ref(model.value)

watch(model, (newVal) => {
  localValue.value = newVal
})

function onColorPickerChange(e) {
  const val = e.target.value
  localValue.value = val
  model.value = val 
}

function validateAndSync() {
  let val = localValue.value.trim()
  
  if (val.length > 0 && !val.startsWith('#')) {
    val = '#' + val
  }

  const hexRegex = /^#([0-9A-F]{3}){1,2}$/i
  
  if (hexRegex.test(val)) {
    const formatted = val.toUpperCase()
    localValue.value = formatted
    model.value = formatted
  } else {
    localValue.value = model.value
  }
}
</script>

<style scoped>
    input {
        font-variant-numeric: tabular-nums;
    }
</style>
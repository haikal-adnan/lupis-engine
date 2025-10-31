<template>
  <div class="flex flex-col w-full space-y-1">
    <!-- Label di atas -->
    <label
      v-if="label"
      class="text-xs font-medium text-white/80 select-none"
      :style="{ marginBottom: labelGap }"
    >
      {{ label }}
    </label>

    <!-- Input -->
    <input
      v-model="localValue"
      type="text"
      class="w-full text-sm outline-none focus:ring-2 focus:ring-blue-400 transition"
      :placeholder="placeholder"
      :style="{
        backgroundColor: background,
        borderRadius: radius,
        padding: padding,
        height: height,
        color: color,
        border: border
      }"
      @input="$emit('update:modelValue', localValue)"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  radius: { type: String, default: '6px' },
  background: { type: String, default: 'rgba(255,255,255,0.1)' },
  color: { type: String, default: '#fff' },
  border: { type: String, default: '1px solid rgba(255,255,255,0.15)' },
  padding: { type: String, default: '6px 10px' },
  height: { type: String, default: '32px' },
  labelGap: { type: String, default: '2px' }
})

const emit = defineEmits(['update:modelValue'])
const localValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => (localValue.value = v)
)
</script>

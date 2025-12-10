<template>
  <div class="flex flex-col w-full space-y-1">
    <label
      v-if="label"
      class="text-xs font-medium text-secondary select-none"
      :style="{ marginBottom: labelGap }"
    >
      {{ label }}
    </label>

    <input
      v-model="localValue"
      type="text"
      class="w-full text-sm outline-none transition-all duration-200
             bg-element text-primary border border-transparent 
             focus:border-action placeholder:text-muted"
      :placeholder="placeholder"
      :style="{
        borderRadius: radius,
        padding: padding,
        height: height,
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
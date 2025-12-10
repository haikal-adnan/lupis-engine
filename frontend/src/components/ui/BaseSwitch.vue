<template>
  <div
    class="flex items-center justify-between w-full select-none"
    :style="{ padding }"
  >
    <span class="text-sm text-secondary">{{ label }}</span>

    <button
      @click="toggle"
      class="relative transition-colors duration-200 border border-transparent focus:outline-none"
      :class="[
        'flex items-center',
        value 
          ? 'bg-action'         // Aktif: Zinc-900 (Light) / Zinc-50 (Dark)
          : 'bg-element hover:bg-element-hover' // Tidak aktif: Abu-abu
      ]"
      :style="{ 
        borderRadius: radius,
        width: '42px',
        height: '22px'
      }"
    >
      <span
        class="absolute rounded-full transition-transform duration-200 shadow-sm bg-panel"
        :class="value ? 'translate-x-[22px]' : 'translate-x-[4px]'"
        :style="{
          width: knobSize,
          height: knobSize
        }"
      />
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  label: { type: String, default: "Switch" },
  modelValue: { type: Boolean, default: false },
  radius: { type: String, default: "9999px" },
  knobSize: { type: String, default: "14px" },
  padding: { type: String, default: "4px 0" }
})

const emit = defineEmits(["update:modelValue"])
const value = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => (value.value = v)
)

function toggle() {
  value.value = !value.value
  emit("update:modelValue", value.value)
}
</script>
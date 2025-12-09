<template>
  <div
    class="flex items-center justify-between w-full select-none"
    :style="{ padding }"
  >
    <!-- Label kiri -->
    <span class="text-sm text-white/80">{{ label }}</span>

    <!-- Switch kanan -->
    <button
      @click="toggle"
      class="relative transition-all duration-200"
      :class="[
        'w-[42px] h-[22px] rounded-full flex items-center',
        value
          ? 'bg-blue-500 hover:bg-blue-600'
          : 'bg-white/20 hover:bg-white/30'
      ]"
      :style="{ borderRadius: radius }"
    >
      <!-- Knob -->
      <span
        class="absolute bg-white rounded-full transition-all duration-200 shadow-sm"
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

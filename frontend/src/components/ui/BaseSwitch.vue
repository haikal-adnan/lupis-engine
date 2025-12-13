<template>
  <div
    class="flex items-center justify-between w-full select-none"
    :style="{ padding }"
  >
    <label 
      v-if="label" 
      :for="id" 
      class="text-xs font-medium cursor-pointer text-muted-foreground"
    >
      {{ label }}
    </label>

    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="model"
      @click="toggle"
      class="relative flex items-center transition-colors duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      :class="[
        model 
          ? 'bg-primary'              
          : 'bg-zinc-200 dark:bg-zinc-700' 
      ]"
      :style="{ 
        borderRadius: radius,
        width: '42px',
        height: '22px'
      }"
    >
      <span
        class="absolute rounded-full shadow-sm ring-0 transition-transform duration-200 bg-white"
        :class="[
          model ? 'translate-x-[22px]' : 'translate-x-[4px]'
        ]"
        :style="{
          width: knobSize,
          height: knobSize
        }"
      />
    </button>
  </div>
</template>

<script setup>
import { useId } from 'vue'

const {
  label,
  radius = '9999px',
  knobSize = '14px',
  padding = '4px 0'
} = defineProps({
  label: String,
  radius: String,
  knobSize: String,
  padding: String
})

const model = defineModel({ type: Boolean, default: false })
const id = useId()

function toggle() {
  model.value = !model.value
}
</script>
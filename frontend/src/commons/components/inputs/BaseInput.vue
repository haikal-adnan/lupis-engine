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
        v-if="prefix"
        class="h-full flex items-center justify-center pl-3 pr-2 select-none border-r border-transparent 
               bg-muted/20 text-muted-foreground group-focus-within:text-primary group-focus-within:border-border/50 transition-colors"
      >
        <span class="text-xs font-bold font-mono">
          {{ prefix }}
        </span>
      </div>

      <input
        :id="id"
        v-model="localValue"
        :type="type"
        class="w-full h-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40
               focus:ring-0 px-2"
        :placeholder="placeholder"
        :style="{
          paddingLeft: prefix ? '0px' : paddingX
        }"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
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
import { useId, ref, watch } from 'vue'

const props = defineProps({
  label: String,
  prefix: String,
  suffix: String,
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  radius: { type: String, default: '0.375rem' },
  height: { type: String, default: '2rem' },
  paddingX: { type: String, default: '0.75rem' }
})

const emit = defineEmits(['blur', 'change'])
const model = defineModel()
const id = useId()

const localValue = ref(model.value)

watch(() => model.value, (newVal) => {
  localValue.value = newVal
})

const commitValue = () => {
  if (model.value !== localValue.value) {
    model.value = localValue.value
  }
}

function handleBlur(event) {
  commitValue()
  emit('blur', event)
}

function handleEnter(event) {
  event.target.blur() 
}
</script>
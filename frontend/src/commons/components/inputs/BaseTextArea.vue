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
      class="group relative flex items-start w-full transition-all duration-200 border rounded-md bg-background 
             focus-within:border-primary focus-within:ring-1 focus-within:ring-primary
             hover:border-muted-foreground/50 border-input overflow-hidden"
      :style="{
        borderRadius: radius,
        height: height === 'auto' ? 'auto' : height
      }"
    >
      <div
        v-if="prefix"
        class="h-full flex items-start pt-2 justify-center pl-3 pr-2 select-none border-r border-transparent 
               bg-muted/20 text-muted-foreground group-focus-within:text-primary group-focus-within:border-border/50 transition-colors"
      >
        <span class="text-xs font-bold font-mono">
          {{ prefix }}
        </span>
      </div>

      <textarea
        :id="id"
        v-model="model"
        class="
          w-full h-0 bg-transparent border-none outline-none text-sm text-foreground 
          placeholder:text-muted-foreground/40 focus:ring-0 py-2 custom-scrollbar resize-none
        "
        :placeholder="placeholder"
        :rows="rows"
        :style="{
          paddingLeft: prefix ? '0px' : paddingX,
          paddingRight: suffix ? '0px' : paddingX,
          minHeight: minHeight,
          resize: resize
        }"
        spellcheck="false"
      ></textarea>
      
      <div 
        v-if="suffix" 
        class="h-full flex items-start pt-2 pr-3 pl-1 text-xs text-muted-foreground select-none bg-muted/20"
      >
        {{ suffix }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useId } from 'vue'

const { 
  label, 
  prefix, 
  suffix,
  placeholder = '', 
  radius = '0.375rem', 
  height = 'auto',     
  minHeight = '52px',  
  paddingX = '0.75rem',
  rows = 3,
  resize = 'none'    
} = defineProps({
  label: String,
  prefix: String,
  suffix: String,
  placeholder: String,
  radius: String,
  height: String,
  minHeight: String,
  paddingX: String,
  rows: [String, Number],
  resize: String
})

const model = defineModel()
const id = useId()
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
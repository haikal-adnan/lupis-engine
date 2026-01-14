<template>
  <div class="relative group w-full max-w-xs transition-all duration-300">
    <Search 
      class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors z-10"
      :class="isFocused ? 'text-primary' : 'text-muted-foreground'"
    />

    <input 
      v-model="model"
      type="text" 
      :placeholder="placeholder"
      @focus="isFocused = true"
      @blur="isFocused = false"
      class="w-full h-7 pl-8 pr-7 text-xs bg-background border border-border rounded-md outline-none 
             placeholder:text-muted-foreground/50 transition-all duration-200
             hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20"
    />

    <button 
      v-if="model"
      @click="model = ''"
      class="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-sm 
             text-muted-foreground hover:text-foreground hover:bg-secondary 
             transition-colors"
    >
      <X class="w-3 h-3" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, X } from 'lucide-vue-next'

const props = defineProps({
  placeholder: { type: String, default: 'Search...' }
})

const model = defineModel({ type: String, default: '' })
const isFocused = ref(false)
</script>
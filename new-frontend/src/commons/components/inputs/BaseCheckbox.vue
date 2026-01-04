<template>
  <label class="flex items-center gap-2 cursor-pointer group select-none py-1">
    <div class="relative flex items-center">
      <input 
        type="checkbox" 
        v-model="model"
        class="
          peer appearance-none w-3.5 h-3.5 rounded-[3px] border border-input bg-background 
          checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all
          disabled:cursor-not-allowed disabled:opacity-50
        "
      />
      <svg 
        class="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity duration-200" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="4" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    
    <span 
      v-if="label" 
      class="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors"
    >
      {{ label }}
    </span>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' }
})

const model = defineModel({ type: Boolean })
</script>
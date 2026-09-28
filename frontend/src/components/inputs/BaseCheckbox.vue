<template>
  <label 
    class="flex items-center gap-2 cursor-pointer group select-none py-1"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <div class="relative flex items-center justify-center">
      <input 
        type="checkbox" 
        v-model="model"
        :disabled="disabled"
        class="
          peer appearance-none rounded-[3px] border border-input bg-background 
          checked:bg-primary checked:border-primary 
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50
          group-hover:border-primary/50 transition-all duration-200
          disabled:cursor-not-allowed disabled:hover:border-input
        "
        :class="[boxSize]"
      />
      <svg 
        class="absolute text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" 
        :class="[iconSize]"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="3.5" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    
    <span 
      v-if="label" 
      class="font-medium text-muted-foreground group-hover:text-foreground transition-colors"
      :class="[textSize]"
    >
      {{ label }}
    </span>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  boxSize: { type: String, default: 'w-3.5 h-3.5' },
  iconSize: { type: String, default: 'w-2.5 h-2.5' },
  textSize: { type: String, default: 'text-[10px]' }
})

const model = defineModel({ type: Boolean })
</script>
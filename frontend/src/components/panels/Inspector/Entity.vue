<template>
  <div class="w-full select-none">
    <div 
      @click="isOpen = !isOpen"
      class="
        group flex items-center justify-between 
        py-2 px-2 rounded-md cursor-pointer 
        transition-all duration-200 ease-in-out
        border border-transparent
        
        /* HOVER EFFECTS */
        hover:bg-secondary/50 
        hover:border-border/50 
        hover:shadow-sm
        active:scale-[0.99]
      "
    >
      <div class="flex items-center gap-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" height="16" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round"
          class="text-muted-foreground group-hover:text-primary transition-colors"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        
        <span class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Object</span>
        
        <span
          class="
            inline-flex items-center
            px-2.5 py-0.5
            text-[11px] font-semibold
            rounded-full
            truncate max-w-[140px]
            bg-secondary/90
            text-secondary-foreground
            border border-border
            shadow-sm
            group-hover:bg-background transition-colors
          "
        >
          {{ objectData.name || 'Entity' }}
        </span>
      </div>

      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" height="16" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" stroke-width="2" 
        stroke-linecap="round" stroke-linejoin="round"
        class="text-muted-foreground transition-transform duration-200 group-hover:text-foreground"
        :class="isOpen ? 'rotate-0' : '-rotate-90'"
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>

    </div>

    <div v-show="isOpen" class="flex flex-col mt-2 space-y-4 px-1">
      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Name
        </label>
        <div class="w-full">
          <BaseInput 
            v-model="objectData.name"
            type="text"
            placeholder="Nama Objek"
          />
        </div>
      </div>
      
      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Layer
        </label>
        <div class="w-full">
          <BaseSelect
            v-model="objectData.tag"
            :options="tags"
            placeholder="Untagged"
          />
        </div>
      </div>


      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tag
        </label>
        <div class="w-full">
          <BaseSelect
            v-model="objectData.layer"
            :options="layers"
            placeholder="Default"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Appearance
        </label>
        
        <div class="flex gap-2 items-center">
            <div class="w-full">
                <BaseInput 
                    v-model="objectData.opacity" 
                    prefix="%" 
                    type="number"
                    :min="0"
                    :max="100"
                    placeholder="100"
                />
            </div>
            
            <button 
                @click="objectData.locked = !objectData.locked"
                :class="objectData.locked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
                class="p-2 transition-colors rounded-md border border-transparent hover:border-border"
                title="Lock Object"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </button>
            
            <button 
                @click="objectData.visible = !objectData.visible"
                :class="objectData.visible ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
                class="p-2 transition-colors rounded-md border border-transparent hover:border-border"
                title="Toggle Visibility"
            >
                <svg v-if="objectData.visible" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.48-1.65"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import BaseInput from "../../ui/BaseInput.vue" 
import BaseSelect from '../../ui/BaseSelect.vue'

const isOpen = ref(true)

const objectData = reactive({
  name: 'PlayerCharacter',
  visible: true,
  locked: false,
  opacity: 1.0,
  tag: 'player',
  layer: 'default'
})

const tags = [
  { label: 'Untagged', value: 'untagged' },
  { label: 'Player', value: 'player' },
  { label: 'Enemy', value: 'enemy' },
  { label: 'MainCamera', value: 'main_camera' }
]

const layers = [
  { label: 'Default', value: 'default' },
  { label: 'TransparentFX', value: 'transparent_fx' },
  { label: 'Ignore Raycast', value: 'ignore_raycast' },
  { label: 'Water', value: 'water' },
  { label: 'UI', value: 'ui' }
]
</script>
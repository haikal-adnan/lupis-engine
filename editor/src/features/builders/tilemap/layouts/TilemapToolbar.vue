<template>
  <PropertySection title="Tile Tool" :showMenu="false">
    
    <div class="p-2">
      <div class="grid grid-cols-3 gap-1">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="setTool(tool.id)"
          class="
            flex items-center justify-center h-8 rounded-md transition-all
            border focus:outline-none focus:ring-1 focus:ring-primary/40
          "
          :class="activeTool === tool.id 
            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
            : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border-border'
          "
          :title="tool.label"
        >
          <component :is="tool.icon" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <PropertyRow label="Scene Opacity">
      <div class="grid grid-cols-1 gap-2">
        <BaseNumber 
            prefix="%"
            :model-value="context.opacity" 
            @update:model-value="setContextOpacity"
            :min="0" 
            :max="1" 
            :step="0.1" 
            :scrub-sensitivity="0.05"
            class="font-mono flex-1" 
        />
      </div>
    </PropertyRow>

    <PropertyRow label="Visibility">
      <BaseButton 
        :active="context.showOthers"
        @click="toggleContextVisibility"
        class="w-full h-7 text-xs gap-2 justify-center"
        ghost
      >
        <Eye v-if="context.showOthers" class="w-3.5 h-3.5 text-white" />
        <EyeOff v-else class="w-3.5 h-3.5 text-muted-foreground" />
        
        <span>{{ context.showOthers ? 'Scene Visible' : 'Scene Hidden' }}</span>
      </BaseButton>
    </PropertyRow>

    <PropertyRow label="Grid">
      <BaseButton 
        :active="context.showGrid ?? true"
        @click="toggleGridVisibility"
        class="w-full h-7 text-xs gap-2 justify-center"
        ghost
      >
        <Grid3x3 v-if="context.showGrid ?? true" class="w-3.5 h-3.5 text-white" />
        <Grid3x3 v-else class="w-3.5 h-3.5 text-muted-foreground" />
        
        <span>{{ (context.showGrid ?? true) ? 'Grid Visible' : 'Grid Hidden' }}</span>
      </BaseButton>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { Hand, MousePointer2, Brush, Eraser, PaintBucket, Pipette, Eye, EyeOff, Grid3x3 } from 'lucide-vue-next';
import { useTilemapLogic } from '@builders/builders.js';
import { PropertySection, PropertyRow, BaseButton, BaseNumber } from '@components/components.js';

const { activeTool, context, setTool, setContextOpacity, toggleContextVisibility, toggleGridVisibility } = useTilemapLogic();

const tools = [
  { id: 'hand',       icon: Hand,          label: 'Pan Tool (Space)' },
  { id: 'select',     icon: MousePointer2,  label: 'Select / Move (V) (Hold Ctrl for Marquee)' },
  { id: 'brush',      icon: Brush,          label: 'Brush (B)' },
  { id: 'eraser',     icon: Eraser,         label: 'Eraser (E)' },
  { id: 'bucket',     icon: PaintBucket,    label: 'Bucket Fill (G)' },
  { id: 'eyedropper', icon: Pipette,        label: 'Picker (I)' },
];
</script>
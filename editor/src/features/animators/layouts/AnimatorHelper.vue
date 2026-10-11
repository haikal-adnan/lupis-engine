<template>
  <div class="h-full flex flex-col bg-background text-foreground relative select-none" data-testid="animator-helper-container">
    
    <!-- State 1: Tidak ada komponen Animator -->
    <div v-if="!hasAnimator" class="h-full flex flex-col items-center justify-center text-center p-4 opacity-50" data-testid="animator-helper-no-component">
      <Film class="w-8 h-8 mb-2 text-muted-foreground" />
      <span class="text-xs font-medium">No Animator Component</span>
      <span class="text-[10px] mt-1">Select an entity with SpriteAnimator.</span>
    </div>

    <!-- State 2: Komponen ada tetapi tidak ada Clip yang dipilih -->
    <ScrollArea v-else-if="!activeClipId" class="flex-1" data-testid="animator-helper-no-clip-settings">
      <div class="p-2 space-y-2">
        <PropertySection title="Viewport & Overlay Settings" :icon="Eye" :default-open="true">
          
          <PropertyRow label="Show Shadow (Onion Skin)">
            <BaseCheckbox 
              v-model="showShadow" 
              :label="showShadow ? 'Enabled' : 'Disabled'"
              data-testid="animator-helper-shadow-checkbox"
            />
          </PropertyRow>

          <template v-if="showShadow">
            <PropertyRow label="Shadow Frames">
              <BaseNumber 
                v-model="shadowFrameCount" 
                :min="1" 
                :max="10" 
                :step="1" 
                class="font-mono w-full" 
                data-testid="animator-helper-shadow-count"
              />
            </PropertyRow>

            <PropertyRow label="Base Opacity (%)">
              <BaseNumber 
                v-model="shadowOpacity" 
                :min="5" 
                :max="100" 
                :step="5" 
                class="font-mono w-full" 
                data-testid="animator-helper-shadow-opacity"
              />
            </PropertyRow>
          </template>

          <PropertyRow label="Show Grid Overlay">
            <BaseCheckbox 
              v-model="showGrid" 
              :label="showGrid ? 'Enabled' : 'Disabled'"
              data-testid="animator-helper-grid-checkbox"
            />
          </PropertyRow>

          <PropertyRow v-if="showGrid" label="Grid Size (px)">
            <BaseNumber 
              v-model="gridSize" 
              :min="4" 
              :max="256" 
              :step="4" 
              class="font-mono w-full" 
              data-testid="animator-helper-grid-size-input"
            />
          </PropertyRow>

        </PropertySection>

        <div class="p-4 text-center border border-dashed border-border rounded-lg bg-muted/10 opacity-70">
          <Film class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
          <span class="text-xs font-medium block">No Clip Selected</span>
          <span class="text-[10px] text-muted-foreground">Select or create a clip from the clips panel to edit properties.</span>
        </div>
      </div>
    </ScrollArea>

    <!-- State 3: Menampilkan Properti Clip & Editor Settings -->
    <ScrollArea v-else class="flex-1" data-testid="animator-helper-content">
      <div class="p-2 space-y-2 pb-20">
        <AnimatorProperty />
        <AnimatorSetting />
      </div>
    </ScrollArea>

  </div>
</template>

<script setup>
import { Film, Eye } from 'lucide-vue-next';
import { ScrollArea, PropertySection, PropertyRow, BaseNumber, BaseCheckbox } from '@components/components.js';
import { useAnimatorLogic, AnimatorProperty, AnimatorSetting } from '@animators/animators.js';

const { hasAnimator, activeClipId, showShadow, shadowFrameCount, shadowOpacity, showGrid, gridSize } = useAnimatorLogic();
</script>
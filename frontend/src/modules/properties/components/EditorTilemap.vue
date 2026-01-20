<template>
  <PropertySection title="Tilemap" :icon="Grid3X3" v-if="hasComponent">
    
    <template #header-extra>
      <div class="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border font-mono">
        {{ totalWidth }}px × {{ totalHeight }}px
      </div>
    </template>

    <template #menu="{ close }">
       </template>

    <PropertyRow label="Source">
      <div class="flex gap-2 w-full">
        <BaseThumbnail 
          :src="currentTextureUrl"
          fallback-text="None"
          sizeClass="w-9 h-9 bg-muted/20 border-border/60 shrink-0 rounded"
          class="object-contain"
        />

        <BaseButton 
          @click="openTilemapEditor" 
          class="flex-1 h-9 text-xs gap-2 justify-center"
          variant="outline" 
        >
          <Brush class="w-3.5 h-3.5 text-primary" />
          <span>Open Editor</span>
        </BaseButton>
      </div>
    </PropertyRow>

    <PropertyRow label="Tile Size">
      <div class="grid grid-cols-2 gap-2">
        <BaseNumber v-model="tileWidth" prefix="W" :disabled="true" class="font-mono opacity-70" />
        <BaseNumber v-model="tileHeight" prefix="H" :disabled="true" class="font-mono opacity-70" />
      </div>
    </PropertyRow>

    <PropertyRow label="Opacity">
        <BaseNumber 
            prefix="%"
            v-model="opacity" 
            :min="0" :max="1" :step="0.1" 
            class="font-mono w-full" 
        />
    </PropertyRow>

    <PropertyRow label="Physics">
         <BaseCheckbox 
            v-model="isSolid" 
            label="Solid Layer" 
            description="Enable collision"
            class="w-full"
          />
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from "vue";
import { Grid3X3, Brush } from "lucide-vue-next"; 
import { useTilemapLogic } from "@/modules/tilemap/composables/useTilemapLogic.js"; // Import path yang benar

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseThumbnail from "@/commons/components/display/BaseThumbnail.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseCheckbox from "@/commons/components/inputs/BaseCheckbox.vue"; 
import BaseButton from "@/commons/components/buttons/BaseButton.vue"; 

// Gunakan Composable
const { 
  selectedEntity, 
  hasTilemap, 
  currentTextureUrl, 
  bindComponentProp, 
  openTilemapEditor 
} = useTilemapLogic();

const hasComponent = hasTilemap;

// Bindings
const tileWidth = bindComponentProp('Tilemap', 'tileWidth');
const tileHeight = bindComponentProp('Tilemap', 'tileHeight');
const mapWidth = bindComponentProp('Tilemap', 'width');
const mapHeight = bindComponentProp('Tilemap', 'height');
const opacity = bindComponentProp('Tilemap', 'opacity');
const isSolid = bindComponentProp('Tilemap', 'isSolid');

const totalWidth = computed(() => (tileWidth.value || 0) * (mapWidth.value || 0));
const totalHeight = computed(() => (tileHeight.value || 0) * (mapHeight.value || 0));
</script>
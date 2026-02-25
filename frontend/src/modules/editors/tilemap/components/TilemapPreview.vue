<template>
  <PropertySection title="Tilemap Settings" :icon="Grid3x3" v-if="hasTilemap">
    
    <div class="flex gap-2.5 mb-1 pt-1">
      
      <BaseThumbnail 
        :src="currentTextureUrl"
        :rect="null" 
        fallback-text="No Set"
        sizeClass="w-[52px] h-[52px] bg-muted/20 border-border/60 shrink-0"
      />

      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <PropertyRow label="Tileset" :no-margin="true">
          <button 
            type="button"
            @click="openAssetSelector"
            class="
              group flex items-center w-full relative text-left
              bg-secondary/40 border border-border rounded-md
              hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200
              focus:ring-1 focus:ring-primary
              cursor-pointer h-7 overflow-hidden
            "
            title="Click to select tileset asset"
          >
            <span class="flex-1 px-2 text-[11px] font-mono text-muted-foreground/90 truncate select-none group-hover:text-foreground transition-colors">
              {{ assetId || 'None' }}
            </span>

            <div class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10 text-muted-foreground/50 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
              <FolderSearch class="w-3 h-3" />
            </div>
          </button>
        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Tile Size (Px)">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber 
            v-model="tileWidth" 
            prefix="W" 
            :min="1" 
            :step="1"
            class="font-mono" 
          />
          <BaseNumber 
            v-model="tileHeight" 
            prefix="H" 
            :min="1" 
            :step="1"
            class="font-mono" 
          />
        </div>
    </PropertyRow>

    <PropertyRow label="Map Size (Grid)">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber 
            v-model="width" 
            prefix="Col" 
            :min="1" 
            :step="1"
            class="font-mono"
            title="Total Columns"
          />
          <BaseNumber 
            v-model="height" 
            prefix="Row" 
            :min="1" 
            :step="1"
            class="font-mono" 
            title="Total Rows"
          />
        </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { Grid3x3, FolderSearch } from "lucide-vue-next"; 
import { useTilemapLogic } from "@editors/tilemap/composables/useTilemapLogic.js"; 

import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseThumbnail from "@/commons/components/display/BaseThumbnail.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";

const { 
  hasTilemap,
  currentTextureUrl,
  assetId,
  tileWidth,
  tileHeight,
  width,
  height
} = useTilemapLogic();

function openAssetSelector() {
  console.log("Open Asset Selector Triggered for Tilemap. Current Asset:", assetId.value);
}
</script>
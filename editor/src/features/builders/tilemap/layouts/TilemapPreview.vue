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

    <!-- Tile Size (Px) -->
    <PropertyRow label="Tile Size (Px)">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber 
            v-model="width" 
            prefix="W" 
            :min="1" 
            :step="1" 
            class="font-mono" 
            :disabled="hasPaintedTiles"
            :title="hasPaintedTiles ? 'Clear tilemap first to change tile size' : 'Tile Width'" 
          />
          <BaseNumber 
            v-model="height" 
            prefix="H" 
            :min="1" 
            :step="1" 
            class="font-mono" 
            :disabled="hasPaintedTiles"
            :title="hasPaintedTiles ? 'Clear tilemap first to change tile size' : 'Tile Height'" 
          />
        </div>
    </PropertyRow>

    <!-- Clear Tilemap Data -->
    <div class="pt-2 border-t border-border/40 mt-3">
      <BaseButton 
        variant="danger" 
        size="sm" 
        class="w-full text-xs font-medium"
        :disabled="!hasPaintedTiles"
        @click="handleResetTilemap"
      >
        <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
        Clear Tilemap Data
      </BaseButton>
    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Grid3x3, FolderSearch, RotateCcw } from "lucide-vue-next"; 
import { useTilemapLogic } from "@builders/builders.js"; 
import { PropertySection, PropertyRow, BaseThumbnail, BaseNumber, BaseButton } from '@components/components.js';
import { useConfirm } from '@composables/composables.js';

const { 
  hasTilemap, 
  selectedEntity,
  currentTextureUrl, 
  assetId, 
  width, 
  height, 
  openAssetSelector,
  applyTileDataMutation
} = useTilemapLogic();

const { confirm } = useConfirm();

const hasPaintedTiles = computed(() => {
  const data = selectedEntity.value?.components?.Tilemap?.data;
  if (!data || typeof data !== 'object') return false;
  return Object.keys(data).length > 0;
});

const handleResetTilemap = async () => {
  const isConfirmed = await confirm({
    title: 'Clear Tilemap',
    message: 'Are you sure you want to delete all tiles from this tilemap?',
    type: 'danger',
    confirmText: 'Clear'
  });

  if (isConfirmed) {
    applyTileDataMutation({});
  }
};
</script>
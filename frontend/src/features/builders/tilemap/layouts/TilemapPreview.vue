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

    <!-- Tile Size (Px) - Disabled saat ada tile terisi -->
    <PropertyRow label="Tile Size (Px)">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber 
            v-model="tileWidth" 
            prefix="W" 
            :min="1" 
            :step="1" 
            class="font-mono" 
            :disabled="hasPaintedTiles"
            :title="hasPaintedTiles ? 'Reset tilemap terlebih dahulu untuk mengubah ukuran tile' : 'Tile Width'" 
          />
          <BaseNumber 
            v-model="tileHeight" 
            prefix="H" 
            :min="1" 
            :step="1" 
            class="font-mono" 
            :disabled="hasPaintedTiles"
            :title="hasPaintedTiles ? 'Reset tilemap terlebih dahulu untuk mengubah ukuran tile' : 'Tile Height'" 
          />
        </div>
    </PropertyRow>

    <!-- Map Size (Grid) - Disabled saat ada tile terisi -->
    <PropertyRow label="Map Size (Grid)">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber 
            v-model="width" 
            prefix="Col" 
            :min="1" 
            :step="1" 
            class="font-mono" 
            :disabled="hasPaintedTiles"
            :title="hasPaintedTiles ? 'Reset tilemap terlebih dahulu untuk mengubah ukuran grid' : 'Total Columns'" 
          />
          <BaseNumber 
            v-model="height" 
            prefix="Row" 
            :min="1" 
            :step="1" 
            class="font-mono" 
            :disabled="hasPaintedTiles"
            :title="hasPaintedTiles ? 'Reset tilemap terlebih dahulu untuk mengubah ukuran grid' : 'Total Rows'" 
          />
        </div>
    </PropertyRow>

    <!-- BaseButton Reset Tilemap -->
    <div class="pt-2 border-t border-border/40 mt-3">
      <BaseButton 
        variant="danger" 
        size="sm" 
        class="w-full text-xs font-medium"
        :disabled="!hasPaintedTiles"
        @click="handleResetTilemap"
      >
        <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
        Reset Tilemap Data
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
  tileWidth, 
  tileHeight, 
  width, 
  height, 
  openAssetSelector,
  applyTileDataMutation
} = useTilemapLogic();

const { confirm } = useConfirm();

const hasPaintedTiles = computed(() => {
  const data = selectedEntity.value?.components?.Tilemap?.data;
  if (!data) return false;

  if (Array.isArray(data)) {
    return data.some(tile => tile !== 0 && tile !== null && tile !== -1);
  }

  if (typeof data === 'object') {
    return Object.values(data).some(tile => tile !== 0 && tile !== null && tile !== -1);
  }

  return false;
});

const handleResetTilemap = async () => {
  const isConfirmed = await confirm({
    title: 'Reset Tilemap',
    message: 'Apakah kamu yakin ingin menghapus semua tile dari tilemap ini? Aksi ini dapat di-undo.',
    type: 'danger',
    confirmText: 'Reset'
  });

  if (isConfirmed) {
    const totalTiles = (width.value || 0) * (height.value || 0);
    const emptyData = new Array(totalTiles).fill(0);
    applyTileDataMutation(emptyData);
  }
};
</script>
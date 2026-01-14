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
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"; 
import { useAssetStore } from '@/stores/useAssetStore';
import { useEditorStore } from '@/stores/useEditorStore'; // 1. Import Store Editor

// Atomic Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseThumbnail from "@/commons/components/display/BaseThumbnail.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseCheckbox from "@/commons/components/inputs/BaseCheckbox.vue"; 
import BaseButton from "@/commons/components/buttons/BaseButton.vue"; 

const { 
  selectedEntity, 
  bindComponentProp,
  currentTextureUrl
} = useInspectorLogic();

const assetStore = useAssetStore();
const editorStore = useEditorStore(); // 2. Inisialisasi Store

// Cek keberadaan komponen
const hasComponent = computed(() => !!selectedEntity.value?.components?.Tilemap);

// ---------------------------------------
// BINDINGS
// ---------------------------------------

// 1. Grid Settings (Read-Only)
const tileWidth = bindComponentProp('Tilemap', 'tileWidth');
const tileHeight = bindComponentProp('Tilemap', 'tileHeight');
const mapWidth = bindComponentProp('Tilemap', 'width');
const mapHeight = bindComponentProp('Tilemap', 'height');

// 2. Settings (Editable)
const opacity = bindComponentProp('Tilemap', 'opacity');
const isSolid = bindComponentProp('Tilemap', 'isSolid');

// Computed Total Size for Header Extra
const totalWidth = computed(() => (tileWidth.value || 0) * (mapWidth.value || 0));
const totalHeight = computed(() => (tileHeight.value || 0) * (mapHeight.value || 0));

// 3. Implementasi Logika Buka Tab
function openTilemapEditor() {
    const entity = selectedEntity.value;
    
    if (!entity) {
        console.warn("No entity selected");
        return;
    }

    console.log("Opening Tilemap Editor for entity:", entity._id);

    // Panggil action openTab dari store
    editorStore.openTab({
        id: entity._id,                 // ID dari Entity
        name: entity.name || 'Tilemap', // Nama Entity (Fallback ke 'Tilemap' jika kosong)
        type: 'tilemap',                // Tipe Tab
        fixed: false                    // Sesuai request: fixed false
    });
}
</script>
<template>
  <PropertySection title="Sprite Renderer" :icon="Image" v-if="hasComponent">
    
    <template #header-extra>
      <div class="ml-auto"></div>
    </template>

    <template #menu="{ close }">
      <div class="p-1 space-y-0.5">
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          Move Up
        </button>
        <button @click="close" class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
          Move Down
        </button>
        <div class="h-px bg-border my-1" />
        <button 
          @click="removeComponent('SpriteRenderer'); close()" 
          class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-destructive hover:text-destructive-foreground text-destructive font-medium transition-colors"
        >
          <Trash2 class="w-3 h-3 mr-2" />
          Remove Component
        </button>
      </div>
    </template>

<div class="flex gap-2.5 mb-1 pt-1">
      <BaseThumbnail 
        :src="dummyImageUrl"
        :rect="currentRect" 
        sizeClass="w-[52px] h-[52px] bg-muted/20 border-border/60 shrink-0"
      />

      <div class="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <PropertyRow label="Texture" :no-margin="true">
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
            title="Click to select asset"
          >
            <span class="flex-1 px-2 text-[11px] font-mono text-muted-foreground/90 truncate select-none group-hover:text-foreground transition-colors">
              Hero_Sheet.png
            </span>

            <div class="px-2 h-full flex items-center justify-center border-l border-border bg-muted/10 text-muted-foreground/50 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
              <FolderSearch class="w-3 h-3" />
            </div>
          </button>

        </PropertyRow>
      </div>
    </div>

    <PropertyRow label="Source Rect" :no-margin="true">
        <div class="grid grid-cols-2 gap-2">
          <BaseNumber v-model="sourceRaw.x.value" prefix="X" :scrubbable="true" class="font-mono" />
          <BaseNumber v-model="sourceRaw.y.value" prefix="Y" :scrubbable="true" class="font-mono" />
          <BaseNumber v-model="sourceRaw.w.value" prefix="W" :min="0" :scrubbable="true" class="font-mono" />
          <BaseNumber v-model="sourceRaw.h.value" prefix="H" :min="0" :scrubbable="true" class="font-mono" />
        </div>
      </PropertyRow>

    <BaseCollapse title="Advanced" v-model="isAdvancedOpen">
        <div class="space-y-1">
            <BaseCheckbox 
            v-model="autoResetRect" 
            label="Reset Rect on Texture Change" 
            />
        </div>
    </BaseCollapse>

  </PropertySection>
</template>

<script setup>
import { computed, ref } from "vue";
import { Image, Trash2, FolderSearch } from "lucide-vue-next"; 

// Import Logic
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js"; 

// Atomic Components
import PropertySection from "@/modules/properties/parts/PropertySection.vue";
import PropertyRow from "@/modules/properties/parts/PropertyRow.vue";
import BaseThumbnail from "@ui/display/BaseThumbnail.vue";
import BaseInput from "@ui/inputs/BaseInput.vue";
import BaseNumber from "@ui/inputs/BaseNumber.vue";
import BaseCheckbox from "@ui/inputs/BaseCheckbox.vue"; // Atomic Baru
import BaseCollapse from "@ui/display/BaseCollapse.vue"; // Atomic Baru

const { selectedEntity, removeComponent, bindNestedProp } = useInspectorLogic();

const hasComponent = computed(() => !!selectedEntity.value?.components?.SpriteRenderer);

// Binding Data (Mock)
const sourceRaw = {
    x: bindNestedProp('SpriteRenderer', 'source', 'x'),
    y: bindNestedProp('SpriteRenderer', 'source', 'y'),
    w: bindNestedProp('SpriteRenderer', 'source', 'w'),
    h: bindNestedProp('SpriteRenderer', 'source', 'h'),
};

const currentRect = computed(() => ({
    x: sourceRaw.x.value || 0,
    y: sourceRaw.y.value || 0,
    w: sourceRaw.w.value || 0,
    h: sourceRaw.h.value || 0
}));

const isAdvancedOpen = ref(false);
const autoResetRect = ref(false); // Local ref untuk checkbox
const dummyImageUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png";

function openAssetSelector() {
  console.log("Open Asset Panel triggered!");
  // TODO: Emit event atau panggil composable untuk membuka panel aset
}
</script>
<template>
  <PropertySection title="Tile Palette" :showMenu="false">
    
    <div class="p-2">
      <div class="grid grid-cols-3 gap-1">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="editorStore.setTool(tool.id)"
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

    <PropertyRow label="Opacity">
      <div class="grid grid-cols-1 gap-2">
        <BaseNumber 
            prefix="%"
            :model-value="context.opacity" 
            @update:model-value="editorStore.setContextOpacity"
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
        @click="editorStore.toggleContextVisibility"
        class="w-full h-7 text-xs gap-2 justify-center"
        ghost
      >
        <Eye v-if="context.showOthers" class="w-3.5 h-3.5 text-white" />
        <EyeOff v-else class="w-3.5 h-3.5 text-muted-foreground" />
        
        <span>{{ context.showOthers ? 'Scene Visible' : 'Scene Hidden' }}</span>
      </BaseButton>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { 
  Hand, 
  MousePointer2, 
  Brush, 
  Eraser, 
  PaintBucket, 
  Pipette,
  Eye,
  EyeOff 
} from 'lucide-vue-next';

// Stores
import { useEditorStore } from '@/stores/useEditorStore.js';

// Components
import PropertySection from "@ui/display/PropertySection.vue";
import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";

const editorStore = useEditorStore();
const { activeTool, tilemapContext: context } = storeToRefs(editorStore);

// Konfigurasi Tool
const tools = [
  { id: 'hand',       icon: Hand,           label: 'Pan Tool (Space)' },
  { id: 'select',     icon: MousePointer2,  label: 'Select / Move (V)' },
  { id: 'brush',      icon: Brush,          label: 'Brush (B)' },
  { id: 'eraser',     icon: Eraser,         label: 'Eraser (E)' },
  { id: 'bucket',     icon: PaintBucket,    label: 'Bucket Fill (G)' },
  { id: 'eyedropper', icon: Pipette,        label: 'Picker (I)' },
];

const activeToolLabel = computed(() => {
  const t = tools.find(t => t.id === activeTool.value);
  return t ? t.label.split('(')[0].trim() : 'Unknown';
});
</script>
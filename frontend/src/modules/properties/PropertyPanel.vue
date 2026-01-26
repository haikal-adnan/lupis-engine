<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    
    <ScrollArea v-if="hasSelection" class="flex-1">
      <div class="p-2 space-y-1">
        <EditorObject />
        <EditorTransform />
        
        <EditorSprite v-if="selectedEntity.components.SpriteRenderer" />
        <EditorShape v-if="selectedEntity.components.ShapeRenderer" />
        <EditorText v-if="selectedEntity.components.TextRenderer" />
        <EditorTilemap v-if="selectedEntity.components.Tilemap" />
        
        <EditorScript v-if="selectedEntity.components.ScriptController" />

        <div class="pt-4 px-1 pb-2">
           <div class="relative">
              <BaseSelect 
                placeholder="Add Component..."
                :options="availableComponentOptions"
                :model-value="null" 
                @update:model-value="handleAddComponent"
              />
           </div>
        </div>

      </div>
    </ScrollArea>

    <div v-else class="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
      <div class="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
        <BoxSelect class="w-6 h-6 opacity-50" />
      </div>
      <p class="text-xs font-medium">No object selected</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { BoxSelect } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

// Atomic Components
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue'
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue"; // Pastikan import BaseSelect

// Inspector Parts
import EditorObject from '@/modules/properties/components/EditorObject.vue'
import EditorTransform from '@/modules/properties/components/EditorTransform.vue'
import EditorSprite from '@/modules/properties/components/EditorSprite.vue'
import EditorShape from '@/modules/properties/components/EditorShape.vue'
import EditorText from '@/modules/properties/components/EditorText.vue'
import EditorTilemap from '@/modules/properties/components/EditorTilemap.vue'
import EditorScript from '@/modules/properties/components/EditorScript.vue'

const { hasSelection, selectedEntity, addComponentToSelection } = useInspectorLogic();

// Definisi Group Renderer (Exclusive)
const RENDERER_GROUP = [
  'SpriteRenderer', 
  'ShapeRenderer', 
  'TextRenderer', 
  'Tilemap'
];

// Computed untuk memproses opsi select
const availableComponentOptions = computed(() => {
  if (!selectedEntity.value || !selectedEntity.value.components) return [];

  const comps = selectedEntity.value.components;

  // 1. Cek apakah entity sudah punya SALAH SATU dari renderer group
  const hasRenderer = RENDERER_GROUP.some(r => !!comps[r]);

  // 2. Daftar semua kemungkinan komponen yang bisa di-add
  const allOptions = [
    { label: 'Sprite Renderer', value: 'SpriteRenderer', isRenderer: true },
    { label: 'Shape Renderer', value: 'ShapeRenderer', isRenderer: true },
    { label: 'Text Renderer', value: 'TextRenderer', isRenderer: true },
    { label: 'Tilemap', value: 'Tilemap', isRenderer: true },
    { label: 'Script Controller', value: 'ScriptController', isRenderer: false },
  ];

  // 3. Map status disabled
  const processedOptions = allOptions.map(opt => {
    let disabled = false;
    let reason = '';

    // Logic A: Jika komponen sudah ada -> Disable
    if (comps[opt.value]) {
      disabled = true;
      reason = '(Added)';
    } 
    // Logic B: Jika ini renderer, dan entity sudah punya renderer lain -> Disable
    else if (opt.isRenderer && hasRenderer) {
      disabled = true;
      reason = '(Conflict)';
    }

    return {
      ...opt,
      disabled,
      // Opsional: update label agar user tahu kenapa didisable (tergantung support BaseSelect Anda)
      label: disabled ? `${opt.label} ${reason}` : opt.label 
    };
  });

  // 4. Sorting: Yang enable di atas, yang disabled pindah ke bawah
  return processedOptions.sort((a, b) => {
    // false (0) < true (1), jadi disabled=false (aktif) akan naik ke atas
    return Number(a.disabled) - Number(b.disabled);
  });
});

const handleAddComponent = (value) => {
  if (!value) return;
  addComponentToSelection(value);
  // BaseSelect biasanya otomatis update v-model, karena kita set :model-value="null",
  // dia akan mereset tampilan kembali ke placeholder setelah selection.
};
</script>
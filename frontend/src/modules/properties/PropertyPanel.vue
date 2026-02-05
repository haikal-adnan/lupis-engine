<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    
    <ScrollArea v-if="hasSelection" class="flex-1">
      <div class="p-2 space-y-1">
        
        <EditorObject />

        <EditorUITransform v-if="selectedEntity.components.UITransform" />
        <EditorTransform v-else />
        
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

    <ScrollArea v-else class="flex-1">
       <div class="p-2 space-y-1">
          <EditorScene />
          <EditorUI />
          <EditorGrid />
       </div>
    </ScrollArea>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

// Atomic Components
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue'
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue"; 

// Entity Editors
import EditorObject from '@/modules/properties/components/EditorObject.vue'
import EditorTransform from '@/modules/properties/components/EditorTransform.vue'
// [BARU] Import Editor UI Transform dari folder ui
import EditorUITransform from '@/modules/properties/components/ui/EditorUITransform.vue'

import EditorSprite from '@/modules/properties/components/EditorSprite.vue'
import EditorShape from '@/modules/properties/components/EditorShape.vue'
import EditorText from '@/modules/properties/components/EditorText.vue'
import EditorTilemap from '@/modules/properties/components/EditorTilemap.vue'
import EditorScript from '@/modules/properties/components/EditorScript.vue'

// Scene Editors
import EditorScene from '@/modules/properties/components/settings/EditorScene.vue'
import EditorGrid from '@/modules/properties/components/settings/EditorGrid.vue'
import EditorUI from '@/modules/properties/components/settings/EditorUI.vue'

const { hasSelection, selectedEntity, addComponentToSelection } = useInspectorLogic();

const RENDERER_GROUP = ['SpriteRenderer', 'ShapeRenderer', 'TextRenderer', 'Tilemap'];

const availableComponentOptions = computed(() => {
  if (!selectedEntity.value || !selectedEntity.value.components) return [];
  
  const comps = selectedEntity.value.components;
  const hasRenderer = RENDERER_GROUP.some(r => !!comps[r]);
  
  // Cek apakah ini UI Entity (punya UITransform)
  const isUIEntity = !!comps.UITransform;

  // Daftar opsi dasar
  let allOptions = [
    { label: 'Sprite Renderer', value: 'SpriteRenderer', isRenderer: true }, // Bisa untuk UI Image
    { label: 'Shape Renderer', value: 'ShapeRenderer', isRenderer: true },   // Bisa untuk UI Panel/Button
    { label: 'Text Renderer', value: 'TextRenderer', isRenderer: true },     // Bisa untuk UI Text
    { label: 'Tilemap', value: 'Tilemap', isRenderer: true },
    { label: 'Script Controller', value: 'ScriptController', isRenderer: false },
  ];

  // [LOGIC OPTION BERBEDA]
  // Jika UI Entity, buang opsi 'Tilemap' karena tidak relevan
  if (isUIEntity) {
    allOptions = allOptions.filter(opt => opt.value !== 'Tilemap');
  }

  return allOptions.map(opt => {
    let disabled = false;
    let label = opt.label;
    
    // Cek duplikasi
    if (comps[opt.value]) { 
        disabled = true; 
        label += ' (Added)'; 
    } 
    // Cek konflik renderer (hanya boleh satu renderer per entity)
    else if (opt.isRenderer && hasRenderer) { 
        disabled = true; 
        label += ' (Conflict)'; 
    }
    
    return { ...opt, disabled, label };
  }).sort((a, b) => Number(a.disabled) - Number(b.disabled));
});

const handleAddComponent = (value) => {
  if (value) addComponentToSelection(value);
};
</script>
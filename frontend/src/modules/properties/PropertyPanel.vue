<template>
  <div class="h-full flex flex-col bg-background text-foreground">
    
    <ScrollArea v-if="hasSelection" class="flex-1">
      <div class="p-2 space-y-1 pb-20"> 
        
        <EditorObject />

        <EditorUITransform v-if="selectedEntity.components.UITransform" />
        <EditorTransform v-else />
        
        <EditorSprite v-if="selectedEntity.components.SpriteRenderer" />
        <EditorShape v-if="selectedEntity.components.ShapeRenderer" />
        <EditorText v-if="selectedEntity.components.TextRenderer" />
        <EditorTilemap v-if="selectedEntity.components.Tilemap" />

        <EditorPhysics v-if="selectedEntity.components.Physics" />
        <EditorCollider v-if="selectedEntity.components.Collider" />
        <EditorScript v-if="selectedEntity.components.ScriptController" />

        <div class="pt-6 px-1">
            <div class="relative" ref="addComponentWrapper">
              <div class="text-xs font-semibold text-muted-foreground mb-2 px-1">Actions</div>
              <BaseSelect 
                placeholder="Add Component..."
                :options="availableComponentOptions"
                :model-value="null" 
                @update:model-value="handleAddComponent"
                @click="scrollToBottom"
              />
            </div>
        </div>

        <div class="h-20" aria-hidden="true"></div>
      </div>
    </ScrollArea>

    <div v-else-if="isMultiSelection" class="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Multiple objects selected
    </div>

    <ScrollArea v-else class="flex-1">
        <div class="p-2 space-y-1 pb-10">
            <EditorProject />
            <EditorScene />
        </div>
    </ScrollArea>

  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";

import ScrollArea from '@/commons/components/overlay/ScrollArea.vue'
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue"; 
import EditorObject from '@/modules/properties/components/EditorObject.vue'
import EditorTransform from '@/modules/properties/components/EditorTransform.vue'
import EditorUITransform from '@/modules/properties/components/ui/EditorUITransform.vue'
import EditorSprite from '@/modules/properties/components/EditorSprite.vue'
import EditorShape from '@/modules/properties/components/EditorShape.vue'
import EditorText from '@/modules/properties/components/EditorText.vue'
import EditorTilemap from '@/modules/properties/components/EditorTilemap.vue'
import EditorScript from '@/modules/properties/components/EditorScript.vue'
import EditorCollider from '@/modules/properties/components/EditorCollider.vue'
import EditorPhysics from '@/modules/properties/components/EditorPhysics.vue'
import EditorScene from '@/modules/properties/components/settings/EditorScene.vue'
import EditorProject from '@/modules/properties/components/settings/EditorProject.vue'

const { hasSelection, selectedEntity, addComponentToSelection, isMultiSelection } = useInspectorLogic();

const addComponentWrapper = ref(null);
const RENDERER_GROUP = ['SpriteRenderer', 'ShapeRenderer', 'TextRenderer', 'Tilemap'];

const scrollToBottom = async () => {
  await nextTick();
  if (addComponentWrapper.value) {
    addComponentWrapper.value.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
};

const availableComponentOptions = computed(() => {
  if (!selectedEntity.value || !selectedEntity.value.components) return [];
  
  const comps = selectedEntity.value.components;
  const hasRenderer = RENDERER_GROUP.some(r => !!comps[r]);
  const isUIEntity = !!comps.UITransform;

  let allOptions = [
    { label: 'Sprite Renderer', value: 'SpriteRenderer', isRenderer: true },
    { label: 'Shape Renderer', value: 'ShapeRenderer', isRenderer: true },  
    { label: 'Text Renderer', value: 'TextRenderer', isRenderer: true },    
    { label: 'Tilemap', value: 'Tilemap', isRenderer: true },
    { label: 'Physics Body', value: 'Physics', isRenderer: false },
    { label: 'Collider', value: 'Collider', isRenderer: false },
    { label: 'Script Controller', value: 'ScriptController', isRenderer: false },
  ];

  if (isUIEntity) {
    allOptions = allOptions.filter(opt => opt.value !== 'Tilemap');
  }

  return allOptions.map(opt => {
    let disabled = false;
    let label = opt.label;
    
    if (comps[opt.value]) { 
        disabled = true; 
        label += ' (Added)'; 
    } 
    else if (opt.isRenderer && hasRenderer) { 
        disabled = true; 
        label += ' (Conflict)'; 
    }
    
    return { ...opt, disabled, label };
  }).sort((a, b) => Number(a.disabled) - Number(b.disabled));
});

const handleAddComponent = (value) => {
  if (value) {
    addComponentToSelection(value);
    setTimeout(scrollToBottom, 100);
  }
};
</script>
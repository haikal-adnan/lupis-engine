<template>
  <PropertySection title="Object">
    
    <template #header-extra>
      <div class="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border truncate max-w-[120px]">
        {{ name || 'Entity' }}
      </div>
    </template>

    <template #menu="{ close }">
       </template>

    <PropertyRow label="Name">
      <BaseInput v-model="name" placeholder="ObjectName" />
    </PropertyRow>

    <PropertyRow label="Tag">
      <BaseSelect v-model="tag" :options="tagOptions" />
    </PropertyRow>

    <PropertyRow label="Appearance">
      <div class="flex gap-1 items-center w-full">
        
        <BaseButton 
          :active="active"
          @click="active = !active"
          class="flex-1 h-7 text-xs gap-2 justify-center"
          ghost
        >
          <Power class="w-3.5 h-3.5" :class="active ? 'text-primary' : 'text-muted-foreground'" />
          <span>{{ active ? 'Active' : 'Inactive' }}</span>
        </BaseButton>

        <div class="w-px h-4 bg-border mx-1"></div>

        <IconButton 
          :active="visible" 
          @click="visible = !visible"
          :tooltip="visible ? 'Hide Object' : 'Show Object'"
        >
          <Eye v-if="visible" class="w-4 h-4" />
          <EyeOff v-else class="w-4 h-4 text-muted-foreground" />
        </IconButton>

        <IconButton 
          :active="locked" 
          @click="locked = !locked"
          :tooltip="locked ? 'Unlock Object' : 'Lock Object'"
        >
          <Lock v-if="locked" class="w-3.5 h-3.5 text-primary" />
          <Unlock v-else class="w-3.5 h-3.5" />
        </IconButton>

      </div>
    </PropertyRow>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue'
import { Eye, EyeOff, Lock, Unlock, Power } from 'lucide-vue-next'
import { useInspectorLogic } from "@/modules/properties/composables/useInspectorLogic.js";
import { useSceneStore } from '@/stores/scene/useSceneStore.js';

// Components
import PropertySection from "@/modules/properties/parts/PropertySection.vue";
import PropertyRow from "@/modules/properties/parts/PropertyRow.vue";
import BaseInput from '@/commons/components/inputs/BaseInput.vue'
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue'
import BaseButton from '@/commons/components/buttons/BaseButton.vue'
import IconButton from '@/commons/components/buttons/IconButton.vue'

const { bindEntityProp, selectedEntity } = useInspectorLogic();
const sceneStore = useSceneStore();

// Binding Direct Properties
const name = bindEntityProp('name');
const tag = bindEntityProp('tag');
const active = bindEntityProp('active');
const visible = bindEntityProp('visible');

// Binding Manual untuk Nested Object (_editor.locked)
// Karena bindEntityProp biasanya hanya level 1, kita buat manual computed setter-nya
const locked = computed({
  get: () => selectedEntity.value?._editor?.locked || false,
  set: (val) => {
    if (!selectedEntity.value) return;
    // Kita update properti '_editor' secara utuh atau buat logic update nested di store
    // Untuk safety, kita ambil object lama dan update key locked
    const currentEditor = selectedEntity.value._editor || {};
    sceneStore.updateEntityProp(selectedEntity.value._id, '_editor', { ...currentEditor, locked: val });
  }
});

const tagOptions = [
  { label: 'Untagged', value: 'untagged' },
  { label: 'Player', value: 'player' },
  { label: 'Enemy', value: 'enemy' },
  { label: 'Background', value: 'background' },
  { label: 'UI', value: 'ui' }
]
</script>
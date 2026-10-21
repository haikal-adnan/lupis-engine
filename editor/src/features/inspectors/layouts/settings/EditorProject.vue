<template>
  <div class="flex flex-col h-full w-full relative outline-none select-none" data-testid="editor-project-section">
    
    <PropertySection title="Quick Actions" :icon="Zap" :default-open="true" data-testid="project-quick-actions-section">
      <div class="flex flex-col gap-2 px-1 py-1">
        <BaseCheckbox v-model="showBorder" label="Show UI Bound" :disabled="!active" text-size="text-xs" data-testid="project-show-ui-bounds-toggle" />
        <BaseCheckbox v-model="showWorldBounds" label="Show World Bounds" text-size="text-xs" data-testid="project-show-world-bounds-toggle" />
        <BaseCheckbox v-model="showColliderSolid" label="Show Collider Solid Bounds" text-size="text-xs" data-testid="project-show-collider-solid-toggle" />
        <BaseCheckbox v-model="showColliderTrigger" label="Show Collider Trigger Bounds" text-size="text-xs" data-testid="project-show-collider-trigger-toggle" />
        <BaseCheckbox v-model="showColliderHitbox" label="Show Collider Hitbox Bounds" text-size="text-xs" data-testid="project-show-collider-hitbox-toggle" />
        <BaseCheckbox v-model="showColliderHurtbox" label="Show Collider Hurtbox Bounds" text-size="text-xs" data-testid="project-show-collider-hurtbox-toggle" />
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { Zap } from 'lucide-vue-next';
import { useInspectorBinding } from "@inspectors/inspectors.js";
import { BaseCheckbox, PropertySection } from '@components/components.js';

const { bindSettingProp } = useInspectorBinding();

const active              = bindSettingProp('ui', 'active');
const showBorder          = bindSettingProp('ui', 'showUIBorder');
const showWorldBounds     = bindSettingProp('worldBounds', 'active');
const showColliderSolid   = bindSettingProp('colliders', 'solid');
const showColliderTrigger = bindSettingProp('colliders', 'trigger');
const showColliderHitbox  = bindSettingProp('colliders', 'hitbox');
const showColliderHurtbox = bindSettingProp('colliders', 'hurtbox');
</script>
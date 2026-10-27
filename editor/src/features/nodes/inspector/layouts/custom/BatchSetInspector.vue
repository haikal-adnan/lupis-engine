<template>
  <div class="space-y-2" data-testid="batch-set-inspector">
    <PropertySection title="Batch Operations" :icon="Layers">
      <template #actions>
        <button
          @click="unlockToCustom"
          class="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
          title="Unlock code and switch to Custom Script Inspector"
        >
          <Unlock class="w-3 h-3" />
          <span>Unlock</span>
        </button>
      </template>

      <div class="px-1 py-1 space-y-3">
        <div class="relative pl-3 border-l-2 border-dashed border-border space-y-3">
          <div 
            v-for="(step, index) in steps" 
            :key="index" 
            class="relative group mt-2"
          >
            <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>

            <div class="bg-secondary/20 p-2 pt-3 rounded border border-border relative">
              <div class="absolute -top-2 left-2 bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-black text-muted-foreground z-10 shadow-sm">
                #{{ index + 1 }}
              </div>

              <button 
                @click="removeStep(index)"
                class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-destructive hover:border-destructive transition-all z-20 shadow-sm"
                title="Remove Step"
              >
                <Trash2 class="w-3 h-3" />
              </button>

              <!-- Target Entity Input -->
              <div class="mb-2 relative">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[9px] text-muted-foreground uppercase font-bold">Target Entity</label>
                  <span v-if="isConnected(`targetEntity${index}`)" class="text-[9px] text-emerald-600 dark:text-green-400 font-mono font-bold">
                    LINKED
                  </span>
                </div>
                
                <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(`targetEntity${index}`) }">
                  <BaseInput 
                    :model-value="getValue(`targetEntity${index}`)"
                    @update:model-value="(v) => updateValue(`targetEntity${index}`, v)"
                    placeholder="self"
                    class="h-7 text-xs w-full font-mono bg-background/50 focus:bg-background"
                  />
                </div>
              </div>

              <!-- Component & Property Selectors -->
              <div class="mb-2 flex gap-2">
                <div class="flex-1 min-w-0">
                  <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Component</label>
                  <BaseSelect 
                    :model-value="step.component"
                    @update:model-value="(v) => handleComponentChange(index, v)"
                    :options="componentOptions"
                    class="w-full text-xs"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Property</label>
                  <BaseSelect 
                    :model-value="step.property"
                    @update:model-value="(v) => updateStep(index, 'property', v)"
                    :options="getPropertyOptions(step.component)"
                    class="w-full text-xs"
                  />
                </div>
              </div>

              <!-- Direct Value Input (Number, Boolean, String) -->
              <div class="relative overflow-hidden mt-2">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[9px] text-muted-foreground uppercase font-bold">Value</label>
                  <span v-if="isConnected(`value${index}`)" class="text-[9px] text-green-400 font-mono font-bold">
                    LINKED
                  </span>
                </div>

                <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(`value${index}`) }">
                  <BaseNumber 
                    v-if="getPropertyType(step.component, step.property) === 'number'"
                    :model-value="getValue(`value${index}`)" 
                    @update:model-value="(v) => updateValue(`value${index}`, v)"
                    class="h-7 text-xs font-mono w-full bg-background/50 focus:bg-background"
                  />
                  
                  <BaseSelect 
                    v-else-if="getPropertyType(step.component, step.property) === 'boolean'"
                    :model-value="getValue(`value${index}`)"
                    :options="[{ label: 'True', value: true }, { label: 'False', value: false }]"
                    @update:model-value="(v) => updateValue(`value${index}`, v)"
                    class="w-full text-xs"
                  />

                  <BaseInput 
                    v-else
                    :model-value="getValue(`value${index}`)" 
                    @update:model-value="(v) => updateValue(`value${index}`, v)"
                    class="h-7 text-xs w-full bg-background/50 focus:bg-background"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        <div v-if="steps.length === 0" class="text-[11px] text-muted-foreground/60 italic py-2 text-center">
          No batch steps added. Click below to add one.
        </div>

        <button 
          @click="addStep"
          type="button"
          class="w-full py-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2 transition-colors group"
        >
          <Plus class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Add Batch Step</span>
        </button>
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Layers, Trash2, Plus, Unlock } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { getPortColor } from '@nodes/nodes.js';
import { PropertySection, BaseInput, BaseSelect, BaseNumber } from '@components/components.js';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const store = useScriptStore();
const confirmComposable = typeof useConfirm === 'function' ? useConfirm() : null;
const confirm = confirmComposable?.confirm;
const popComposable = typeof usePopAlert === 'function' ? usePopAlert() : null;
const showPop = popComposable?.showPop;

const componentRegistry = {
  Entity: {
    label: 'Entity (Root)',
    props: { 
      name: 'string', 
      tag: 'string', 
      type: 'string',
      zIndex: 'number',
      orderIndex: 'number',
      active: 'boolean', 
      visible: 'boolean',
      locked: 'boolean'
    }
  },
  SpriteRenderer: {
    label: 'Sprite',
    props: { 
      assetId: 'string', 
      color: 'string', 
      opacity: 'number', 
      sourceX: 'number', 
      sourceY: 'number', 
      sourceWidth: 'number', 
      sourceHeight: 'number' 
    }
  },
  TextRenderer: {
    label: 'Text',
    props: { 
      value: 'string', 
      fontSize: 'number', 
      color: 'string', 
      opacity: 'number', 
      align: 'string', 
      maxWidth: 'number' 
    }
  },
  ShapeRenderer: {
    label: 'Shape',
    props: { 
      type: 'string', 
      color: 'string', 
      width: 'number', 
      height: 'number', 
      thickness: 'number', 
      opacity: 'number' 
    }
  },
  Tilemap: {
    label: 'Tilemap',
    props: { 
      assetId: 'string', 
      width: 'number', 
      height: 'number', 
      tileWidth: 'number', 
      tileHeight: 'number', 
      isSolid: 'boolean', 
      opacity: 'number' 
    }
  },
  RigidBody2D: {
    label: 'RigidBody2D',
    props: {
      gravityScale: 'number',
      velocityX: 'number',
      velocityY: 'number',
      mass: 'number',
      drag: 'number'
    }
  },
  Collider2D: {
    label: 'Collider2D',
    props: {
      isSolid: 'boolean',
      isTrigger: 'boolean',
      offsetX: 'number',
      offsetY: 'number',
      width: 'number',
      height: 'number'
    }
  }
};

const componentOptions = Object.keys(componentRegistry).map(key => ({
  label: componentRegistry[key].label,
  value: key
}));

function getPropertyOptions(compKey) {
  if (!compKey || !componentRegistry[compKey]) return [];
  return Object.keys(componentRegistry[compKey].props).map(p => ({
    label: p.charAt(0).toUpperCase() + p.slice(1), 
    value: p
  }));
}

function getPropertyType(compKey, propKey) {
  if (!compKey || !propKey || !componentRegistry[compKey]) return 'string';
  return componentRegistry[compKey].props[propKey] || 'string';
}

const steps = computed(() => props.node.data?.steps || []);

function isConnected(portId) {
  return store.isInputConnected(props.node.id, portId);
}

function getValue(portId) {
  return props.node.data?.values?.[portId] ?? null;
}

function updateValue(portId, newValue) {
  if (isConnected(portId)) return;
  const currentValues = props.node.data?.values || {};
  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      values: { ...currentValues, [portId]: newValue }
    }
  });
}

function updateStep(index, key, value) {
  const newSteps = [...steps.value];
  newSteps[index] = { ...newSteps[index], [key]: value };
  syncStructure(newSteps);
}

function handleComponentChange(index, newComp) {
  const newSteps = [...steps.value];
  const firstProp = Object.keys(componentRegistry[newComp]?.props || {})[0] || '';
  newSteps[index] = { ...newSteps[index], component: newComp, property: firstProp };
  syncStructure(newSteps);
}

function generateBatchCode() {
  return [
    'const steps = node.data.steps || [];',
    '',
    'steps.forEach((step, index) => {',
    '  const targetId = inputs["targetEntity" + index] || "self";',
    '  const entity = context.assert.exists(context.entity.get(targetId));',
    '',
    '  if (("value" + index) in inputs) {',
    '    const rawVal = inputs["value" + index];',
    '    if (step.component === "Entity") {',
    '      entity[step.property] = rawVal;',
    '    } else {',
    '      const comp = context.assert.hasComponent(entity, step.component);',
    '      comp[step.property] = rawVal;',
    '    }',
    '  }',
    '});',
    '',
    'outputs.execOut = true;',
    'return;'
  ].join('\n');
}

function syncStructure(newSteps) {
  const currentInputs = props.node.inputs || [];
  const currentValues = props.node.data?.values || {};
  const newValues = { ...currentValues };

  const execIn = currentInputs.find(i => i.id === 'execIn') || {
    id: 'execIn',
    dataType: 'execution',
    color: '#FFFFFF'
  };

  const finalInputs = [execIn];

  newSteps.forEach((step, index) => {
    const targetId = `targetEntity${index}`;
    const valId = `value${index}`;
    const dataType = getPropertyType(step.component, step.property);
    const portColor = getPortColor(dataType);

    finalInputs.push({
      id: targetId,
      dataType: 'string',
      color: '#F48FB1',
      defaultValue: 'self'
    });

    finalInputs.push({
      id: valId,
      dataType: dataType,
      color: portColor,
      defaultValue: dataType === 'number' ? 0 : (dataType === 'boolean' ? false : '')
    });

    if (newValues[targetId] === undefined) {
      newValues[targetId] = step.targetId || 'self';
    }

    if (newValues[valId] === undefined) {
      newValues[valId] = dataType === 'number' ? 0 : (dataType === 'boolean' ? false : '');
    }
  });

  const validKeys = new Set(finalInputs.map(i => i.id));
  Object.keys(newValues).forEach(key => {
    if (!validKeys.has(key)) {
      delete newValues[key];
    }
  });

  if (store.activeScript?.edges) {
    store.activeScript.edges = store.activeScript.edges.filter(edge => {
      if (edge.target === props.node.id) {
        return validKeys.has(edge.targetHandle);
      }
      return true;
    });
  }

  const execOut = (props.node.outputs || []).find(p => p.id === 'execOut') || {
    id: 'execOut',
    dataType: 'execution',
    color: '#FFFFFF'
  };

  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      steps: newSteps,
      values: newValues,
      code: generateBatchCode(newSteps)
    },
    inputs: finalInputs,
    outputs: [execOut]
  });
}

function addStep() {
  let nextComponent = 'SpriteRenderer';
  let nextProperty = 'opacity';

  if (steps.value.length > 0) {
    const lastStep = steps.value[steps.value.length - 1];
    nextComponent = lastStep.component;
    nextProperty = lastStep.property;
  }

  const newSteps = [...steps.value, { 
    targetId: 'self', 
    component: nextComponent, 
    property: nextProperty 
  }];
  
  syncStructure(newSteps);
}

function removeStep(index) {
  const newSteps = [...steps.value];
  newSteps.splice(index, 1);
  syncStructure(newSteps);
}

async function unlockToCustom() {
  let isConfirmed = false;
  if (confirm) {
    isConfirmed = await confirm({
      title: 'Unlock Node to Custom Script',
      message: 'Unlock this node to custom script? Its custom inspector will be detached and code will become fully editable.',
      confirmText: 'Unlock',
      cancelText: 'Cancel',
      type: 'warning'
    });
  } else if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    isConfirmed = window.confirm('Unlock this node to custom script? Its custom inspector will be detached and code will become fully editable.');
  } else {
    isConfirmed = true;
  }

  if (isConfirmed) {
    store.updateNodeInActive(props.node.id, {
      isCustomScript: true,
      originalType: props.node.type
    });
    if (showPop) {
      const nodeTitle = props.node.settings?.headerTitle || props.node.label || 'Batch Set';
      showPop({
        title: 'Custom Inspector Detached',
        message: `Node "${nodeTitle}" has been unlocked to custom script. Code is now fully editable in the code panel.`,
        type: 'success'
      });
    }
  }
}
</script>

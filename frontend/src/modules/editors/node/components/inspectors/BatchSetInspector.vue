<template>
  <PropertySection title="Batch Operations" :icon="Layers" v-if="node">
    
    <div class="px-1 py-2 space-y-3">
      
      <div class="relative pl-3 border-l-2 border-dashed border-border space-y-3">
        
        <div v-for="(step, index) in steps" :key="index" class="relative group animate-in fade-in slide-in-from-left-2 mt-2">
          
          <div class="absolute -left-[19px] top-1/2 w-4 h-[2px] bg-border"></div>

          <div class="bg-secondary/20 p-2 pt-3 rounded border border-border relative">
            
            <div class="absolute -top-2 left-2 bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-black text-muted-foreground z-10 shadow-sm">
              #{{ index }}
            </div>

            <button 
              @click="removeStep(index)"
              class="absolute -top-2 -right-2 bg-background border border-border p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-400 transition-all z-20 shadow-sm"
              title="Remove Step"
            >
              <Trash2 class="w-3 h-3" />
            </button>

            <div class="mb-2 relative">
               <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Target ID</label>
               
               <div v-if="isConnected(`target_${index}`)" class="absolute top-5 right-1 text-[9px] text-green-400 font-mono z-10 animate-pulse">
                 LINKED
               </div>

               <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(`target_${index}`) }">
                 <BaseInput 
                   :model-value="getValue(`target_${index}`)"
                   @update:model-value="(v) => updateValue(`target_${index}`, v)"
                   placeholder="Self"
                   class="h-7 text-xs w-full bg-background/50 focus:bg-background"
                 />
               </div>
            </div>

            <div class="mb-2 flex gap-2">
              <div class="flex-1">
                <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Component</label>
                <BaseSelect 
                  :model-value="step.component"
                  @update:model-value="(v) => handleComponentChange(index, v)"
                  :options="componentOptions"
                  class="w-full text-xs"
                />
              </div>
              <div class="flex-1">
                <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Property</label>
                <BaseSelect 
                  :model-value="step.property"
                  @update:model-value="(v) => updateStep(index, 'property', v)"
                  :options="getPropertyOptions(step.component)"
                  class="w-full text-xs"
                />
              </div>
            </div>

            <div class="relative overflow-hidden mt-2">
               <div v-if="isConnected(`val_${index}`)" class="absolute top-1 right-1 text-[9px] text-green-400 font-mono z-10 animate-pulse">
                 LINKED
               </div>

               <div :class="{ 'opacity-40 pointer-events-none filter grayscale': isConnected(`val_${index}`) }">
                 <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Value</label>
                 
                 <BaseNumber 
                   v-if="getPropertyType(step.component, step.property) === 'number'"
                   :model-value="getValue(`val_${index}`)" 
                   @update:model-value="(v) => updateValue(`val_${index}`, v)"
                   class="h-7 text-xs font-mono w-full bg-background/50 focus:bg-background"
                 />
                 
                 <BaseSelect 
                   v-else-if="getPropertyType(step.component, step.property) === 'boolean'"
                   :model-value="getValue(`val_${index}`)"
                   :options="[{ label: 'True', value: true }, { label: 'False', value: false }]"
                   @update:model-value="(v) => updateValue(`val_${index}`, v)"
                   class="w-full text-xs"
                 />

                 <BaseInput 
                   v-else
                   :model-value="getValue(`val_${index}`)" 
                   @update:model-value="(v) => updateValue(`val_${index}`, v)"
                   class="h-7 text-xs w-full bg-background/50 focus:bg-background"
                 />
               </div>
            </div>

          </div>
        </div>

      </div>

      <button 
        @click="addStep"
        class="w-full py-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2 transition-colors group"
      >
        <Plus class="w-3 h-3 group-hover:scale-110 transition-transform" />
        Add Batch Step
      </button>

    </div>

  </PropertySection>
</template>

<script setup>
import { computed } from 'vue';
import { Layers, Trash2, Plus } from 'lucide-vue-next';
import { useScriptStore } from '@/stores/useScriptStore.js';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';

const props = defineProps({ node: Object });
const store = useScriptStore();

// Konfigurasi Komponen & Property lengkap
const componentRegistry = {
  'Entity': {
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
  'SpriteRenderer': {
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
  'TextRenderer': {
    label: 'Text',
    props: { 
      value: 'string', 
      mode: 'string', 
      assetId: 'string', 
      fontSize: 'number', 
      color: 'string', 
      opacity: 'number', 
      align: 'string', 
      maxWidth: 'number', 
      maxLine: 'number', 
      lineSpacing: 'number', 
      letterSpacing: 'number', 
      overflow: 'string', 
      autoFit: 'boolean', 
      smoothing: 'number', 
      bias: 'number', 
      outlineWidth: 'number', 
      outlineColor: 'string', 
      shadowEnabled: 'boolean', 
      shadowColor: 'string', 
      shadowOpacity: 'number', 
      shadowOffsetX: 'number', 
      shadowOffsetY: 'number', 
      shadowBlur: 'number' 
    }
  },
  'ShapeRenderer': {
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
  'Tilemap': {
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
  }
};

const componentOptions = Object.keys(componentRegistry).map(key => ({
  label: componentRegistry[key].label, value: key
}));

const getPropertyOptions = (compKey) => {
  if (!compKey || !componentRegistry[compKey]) return [];
  return Object.keys(componentRegistry[compKey].props).map(p => ({
    label: p.charAt(0).toUpperCase() + p.slice(1), 
    value: p
  }));
};

const getPropertyType = (compKey, propKey) => {
  if (!compKey || !propKey || !componentRegistry[compKey]) return 'string';
  return componentRegistry[compKey].props[propKey] || 'string';
};

const steps = computed(() => props.node.data?.steps || []);

const isConnected = (inputId) => store.isInputConnected(props.node._id, inputId);

const getValue = (inputId) => {
  return props.node.data?.values?.[inputId] ?? null;
};

const updateValue = (inputId, newValue) => {
  if (isConnected(inputId)) return;
  const currentValues = props.node.data?.values || {};
  store.updateNodeInActive(props.node._id, {
    data: { ...props.node.data, values: { ...currentValues, [inputId]: newValue } }
  });
};

const updateStep = (index, key, value) => {
  const newSteps = [...steps.value];
  newSteps[index] = { ...newSteps[index], [key]: value };
  syncStructure(newSteps);
};

const handleComponentChange = (index, newComp) => {
  const newSteps = [...steps.value];
  // Reset property saat komponen berubah
  const firstProp = Object.keys(componentRegistry[newComp]?.props || {})[0] || '';
  newSteps[index] = { ...newSteps[index], component: newComp, property: firstProp };
  syncStructure(newSteps);
};

const syncStructure = (newSteps) => {
    const currentInputs = props.node.inputs || [];
    const currentValues = props.node.data?.values || {};
    const newValues = { ...currentValues };
    
    // Pastikan port eksekusi (exec_in) selalu ada di awal
    const execIn = currentInputs.find(i => i._id === 'exec_in') || { 
        _id: 'exec_in', 
        label: 'In', 
        dataType: 'execution', 
        color: '#ffffff' 
    };
    const finalInputs = [execIn];

    newSteps.forEach((step, index) => {
        const targetId = `target_${index}`;
        const valId = `val_${index}`;
        
        // Ambil tipe data dari componentRegistry
        const dataType = getPropertyType(step.component, step.property);
        
        // Tentukan warna port sesuai dengan tipe data
        let portColor = '#9c27b0'; // Default warna untuk string (ungu)
        if (dataType === 'number') portColor = '#00e676'; // Hijau
        if (dataType === 'boolean') portColor = '#f44336'; // Merah

        // Tambahkan port untuk Target
        finalInputs.push({
            _id: targetId,
            label: `[${index}] Target`,
            dataType: 'string',
            color: '#E040FB' // Ungu muda
        });

        // Tambahkan port untuk Value
        finalInputs.push({
            _id: valId,
            label: `[${index}] ${step.property}`,
            dataType: dataType,
            color: portColor
        });

        // Set default value untuk Target jika belum ada
        if (newValues[targetId] === undefined) {
            newValues[targetId] = step.targetId || 'Self';
        }
        
        // Set default value untuk Value jika belum ada sesuai tipe datanya
        if (newValues[valId] === undefined) {
            if (dataType === 'number') {
                newValues[valId] = 0;
            } else if (dataType === 'boolean') {
                newValues[valId] = false;
            } else {
                newValues[valId] = ''; // Default string
            }
        }
    });

    // Bersihkan value statis yang sudah tidak terpakai
    const validKeys = finalInputs.map(i => i._id);
    Object.keys(newValues).forEach(key => {
        if (!validKeys.includes(key)) {
            delete newValues[key];
        }
    });

    // Terapkan perubahan ke global store
    store.updateNodeInActive(props.node._id, {
        data: { ...props.node.data, steps: newSteps, values: newValues },
        inputs: finalInputs
    });
};

const addStep = () => {
    // Nilai default
    let nextComponent = 'SpriteRenderer';
    let nextProperty = 'opacity';

    // Ambil component dan property dari step terakhir (jika ada)
    if (steps.value.length > 0) {
        const lastStep = steps.value[steps.value.length - 1];
        nextComponent = lastStep.component;
        nextProperty = lastStep.property;
    }

    const newSteps = [...steps.value, { 
      targetId: 'Self', 
      component: nextComponent, 
      property: nextProperty 
    }];
    
    syncStructure(newSteps);
};

const removeStep = (index) => {
    const newSteps = [...steps.value];
    newSteps.splice(index, 1);
    syncStructure(newSteps);
};
</script>
<template>
  <div class="space-y-2" data-testid="keyboard-mapper-inspector">
    <PropertySection title="Key Mapping Config" :icon="Keyboard">
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

      <div class="space-y-3 px-1 py-1">
        <div 
          v-for="(map, index) in mappings" 
          :key="map.id || index" 
          class="bg-secondary/20 p-2.5 rounded border border-border relative group transition-all"
        >
          <button 
            @click="removeMapping(index)"
            class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-all z-10"
            title="Remove Mapping"
          >
            <Trash2 class="w-3 h-3" />
          </button>

          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Key</label>
              <BaseInput 
                :model-value="map.key" 
                @update:model-value="(v) => updateMapping(index, 'key', String(v || '').toUpperCase())"
                placeholder="e.g. W, SPACE"
                class="h-7 text-xs font-mono text-center uppercase w-full"
              />
            </div>

            <div>
              <label class="text-[9px] text-muted-foreground uppercase font-bold block mb-1">Trigger</label>
              <BaseSelect 
                :model-value="map.trigger || 'press'"
                @update:model-value="(v) => updateMapping(index, 'trigger', v)"
                :options="triggerOptions"
                class="w-full text-xs"
              />
            </div>
          </div>

          <!-- Port Output Preview -->
          <div class="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
            <span class="font-mono text-[9px] text-blue-600 dark:text-blue-400">Port: onKey{{ index }}</span>
            <span class="font-mono text-[9px] text-zinc-400">{{ map.key || '?' }} ({{ map.trigger }})</span>
          </div>

          <!-- Hold options -->
          <div v-if="map.trigger === 'hold'" class="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
            <span class="text-[9px] text-muted-foreground whitespace-nowrap">Hold (ms):</span>
            <BaseNumber 
              :model-value="map.threshold || 0" 
              @update:model-value="(v) => updateMapping(index, 'threshold', v)"
              class="h-6 text-xs w-20 text-center font-mono" 
            />
            <div class="flex-1 flex justify-end items-center gap-1.5">
              <span class="text-[9px] text-muted-foreground">Repeat:</span>
              <BaseCheckbox 
                :model-value="map.repeat || false"
                @update:model-value="(v) => updateMapping(index, 'repeat', v)"
              />
            </div>
          </div>
        </div>

        <div v-if="mappings.length === 0" class="text-[11px] text-muted-foreground/60 italic py-2 text-center">
          No key mappings configured.
        </div>

        <button 
          @click="addMapping"
          type="button"
          class="w-full py-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2 transition-colors group"
        >
          <Plus class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Add Key Map</span>
        </button>
      </div>
    </PropertySection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Keyboard, Trash2, Plus, Unlock } from 'lucide-vue-next';
import { useScriptStore } from '@scripts/scripts.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { useScriptHistory } from '@historys/historys.js';
import { GenerateUUID } from '@utils/utils.js';
import { PropertySection, BaseInput, BaseSelect, BaseNumber, BaseCheckbox } from '@components/components.js';

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
const history = useScriptHistory();

const triggerOptions = [
  { label: 'On Press', value: 'press' },
  { label: 'On Hold', value: 'hold' },
  { label: 'On Release', value: 'release' }
];

const mappings = computed(() => props.node.data?.mappings || []);

function generateMappingCode(mappingList) {
  const lines = [
    'context.onTick(() => {',
    '  const keyboard = context.input && context.input.keyboard;',
    '  if (!keyboard) return;'
  ];

  mappingList.forEach((m, idx) => {
    const k = (m.key || '').toLowerCase();
    const trigger = m.trigger || 'press';
    const outPort = 'onKey' + idx;
    if (trigger === 'hold') {
      lines.push("  if (keyboard.isDown('" + k + "')) { context.triggerFlow('" + outPort + "'); outputs." + outPort + " = true; }");
    } else if (trigger === 'release') {
      lines.push("  if (keyboard.isJustUp('" + k + "')) { context.triggerFlow('" + outPort + "'); outputs." + outPort + " = true; }");
    } else {
      lines.push("  if (keyboard.isJustDown('" + k + "')) { context.triggerFlow('" + outPort + "'); outputs." + outPort + " = true; }");
    }
  });

  lines.push('});');
  lines.push('return;');
  return lines.join('\n');
}

function syncPorts(newMappings) {
  const newOutputs = newMappings.map((m, index) => ({
    id: `onKey${index}`,
    label: `${m.key || 'Key'} (${m.trigger || 'press'})`,
    dataType: 'execution',
    color: '#FFFFFF'
  }));

  const validOutputIds = new Set(newOutputs.map(p => p.id));
  if (store.activeScript?.edges) {
    store.activeScript.edges = store.activeScript.edges.filter(edge => {
      if (edge.source === props.node.id) {
        return validOutputIds.has(edge.sourceHandle);
      }
      return true;
    });
  }

  const generatedCode = generateMappingCode(newMappings);

  store.updateNodeInActive(props.node.id, {
    data: {
      ...props.node.data,
      mappings: newMappings,
      code: generatedCode
    },
    outputs: newOutputs
  });
}

function addMapping() {
  const newMap = {
    id: GenerateUUID(),
    key: 'SPACE',
    trigger: 'press',
    threshold: 0,
    repeat: false
  };
  syncPorts([...mappings.value, newMap]);
}

function removeMapping(index) {
  const newList = [...mappings.value];
  newList.splice(index, 1);
  syncPorts(newList);
}

function updateMapping(index, field, value) {
  const newList = JSON.parse(JSON.stringify(mappings.value));
  if (!newList[index]) return;
  newList[index][field] = value;
  syncPorts(newList);
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
      const nodeTitle = props.node.settings?.headerTitle || props.node.label || 'Keyboard Mapper';
      showPop({
        title: 'Custom Inspector Detached',
        message: `Node "${nodeTitle}" has been unlocked to custom script. Code is now fully editable in the code panel.`,
        type: 'success'
      });
    }
  }
}
</script>

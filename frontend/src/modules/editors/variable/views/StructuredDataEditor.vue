<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 md:scale-95 translate-y-full md:translate-y-0"
      enter-to-class="opacity-100 md:scale-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 md:scale-100 translate-y-0"
      leave-to-class="opacity-0 md:scale-95 translate-y-full md:translate-y-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
        @mousedown="onOutsideMouseDown"
        @mouseup="onOutsideMouseUp"
      >
        <div class="w-full md:w-[750px] max-w-4xl max-h-[95vh] md:max-h-[85vh] bg-card md:border border-border md:rounded-xl rounded-t-2xl shadow-2xl flex flex-col relative overflow-hidden" @mousedown.stop>
          
          <div class="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 shrink-0">
            <div class="flex items-center gap-1.5 text-sm flex-wrap flex-1">
              <span class="text-muted-foreground mr-1">Variables</span>
              
              <template v-for="(level, index) in stack" :key="index">
                <ChevronRight class="w-3.5 h-3.5 opacity-50 text-muted-foreground" />
                
                <button 
                  @click="navigateTo(index)"
                  class="flex items-center gap-1.5 transition-colors px-1.5 py-0.5 rounded"
                  :class="index === stack.length - 1 ? 'font-bold text-foreground cursor-default' : 'text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer'"
                  :disabled="index === stack.length - 1"
                >
                  <div class="w-2 h-2 rounded-full shadow-sm" :style="{ backgroundColor: getVarColor(level.type) }"></div>
                  {{ level.label }}
                </button>
              </template>
            </div>

            <button 
              v-if="stack.length > 1"
              @click="copyToClipboard(currentLevelPath)" 
              class="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mx-2 shrink-0 border border-transparent hover:border-border"
            >
              <Copy class="w-3 h-3" />
              <span class="hidden sm:inline">Copy Path</span>
            </button>

            <div class="w-px h-4 bg-border mx-1"></div>

            <button @click="openRawEditor" class="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors ml-2 shrink-0" title="Edit Raw JSON">
              <Code class="w-4 h-4" />
            </button>

            <button @click="handleCancel" class="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1 shrink-0">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div ref="scrollContainerRef" class="w-full flex-1 min-h-0 bg-background overflow-y-auto custom-scroll">
            <div class="p-5 flex flex-col min-h-full">
              
              <div v-if="currentData.length > 0" class="flex items-center gap-2 px-8 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div v-if="currentType === 'Map'" class="w-32">Key</div>
                <div v-else class="w-8 text-center">Idx</div>
                <div class="w-28">Type</div>
                <div class="flex-1">Value</div>
              </div>

              <TransitionGroup name="list-reorder" tag="div" class="flex flex-col gap-2 relative">
                <div 
                  v-for="(item, idx) in currentData" 
                  :key="item._id"
                  draggable="true"
                  @dragstart="onDragStart($event, idx)"
                  @dragover.prevent
                  @dragenter.prevent
                  @drop="onDrop($event, idx)"
                  class="group flex items-center gap-2 p-1.5 pr-2 rounded-lg border border-border bg-card hover:border-primary/30 transition-all shadow-sm"
                  :class="{ 'opacity-40 scale-[0.98] border-primary/50 bg-primary/5': dragIndex === idx }"
                >
                  <div class="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground group-hover:text-primary/60 transition-colors shrink-0">
                    <GripVertical class="w-4 h-4" />
                  </div>

                  <div v-if="currentType === 'Map'" class="w-32 shrink-0">
                    <BaseInput v-model="item.key" placeholder="Enter key..." class="font-mono text-sm" />
                  </div>
                  <div v-else class="w-8 text-[10px] font-mono text-muted-foreground font-bold select-none">
                    {{ idx }}
                  </div>

                  <div class="w-28 shrink-0">
                    <BaseSelect 
                      v-model="item.type"
                      :options="typeOptions"
                      @update:model-value="onItemTypeChange(item)"
                      class="w-full"
                    />
                  </div>

                  <div class="flex-1 min-w-[150px]">
                    <BaseButton 
                      v-if="item.type === 'List' || item.type === 'Map'"
                      @click="enterNestedLevel(item, idx)"
                      variant="outline"
                      class="w-full justify-center border-dashed gap-2 hover:bg-primary/5 hover:border-primary/40 text-xs"
                    >
                      <Settings2 class="w-3.5 h-3.5" />
                      Edit {{ item.type }} 
                      <span class="opacity-60">({{ Array.isArray(item.value) ? item.value.length : 0 }} items)</span>
                    </BaseButton>

                    <BaseSelect v-else-if="item.type === 'Boolean'" v-model="item.value" :options="boolOptions" />
                    <BaseNumber v-else-if="item.type === 'Number'" v-model="item.value" class="font-mono" />
                    <BaseInput v-else v-model="item.value" placeholder="Enter string..." />
                  </div>

                  <div class="flex items-center shrink-0 ml-1">
                    <BaseDropdown align="right">
                      <template #trigger>
                        <button class="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <MoreVertical class="w-4 h-4" />
                        </button>
                      </template>

                      <template #default="{ close }">
                        <div class="w-auto whitespace-nowrap flex flex-col py-1 text-xs min-w-[130px]">
                          <button @click="copyToClipboard(getItemPath(item, idx)); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors">
                            <Link class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Copy Path
                          </button>
                          <button @click="duplicateItem(idx); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors">
                            <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Duplicate
                          </button>
                          <div class="h-px bg-border my-1"></div>
                          <button @click="removeItem(idx); close()" class="flex items-center px-2 py-1.5 hover:bg-destructive/10 text-destructive text-left transition-colors">
                            <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete
                          </button>
                        </div>
                      </template>
                    </BaseDropdown>
                  </div>
                </div>
              </TransitionGroup>

              <div v-if="currentData.length === 0" class="py-10 text-center border-2 border-dashed border-border rounded-xl bg-muted/5 mb-4 mt-2">
                <p class="text-sm text-muted-foreground italic">
                  This {{ currentType }} is empty.
                </p>
              </div>

              <BaseButton 
                @click="addNewItem"
                variant="outline"
                class="mt-4 w-full py-6 border-dashed border-2 transition-all group"
                :class="currentType === 'Map' ? 'hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : 'hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400'"
              >
                <Plus class="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
                <span>Add New {{ currentType === 'Map' ? 'Key-Value' : 'Element' }}</span>
              </BaseButton>
            </div>
          </div>

          <div class="flex items-center justify-end px-5 py-4 border-t border-border bg-muted/20 gap-3 shrink-0">
            <BaseButton @click="handleCancel" variant="ghost" class="px-5">
              Cancel
            </BaseButton>
            <BaseButton 
              @click="handleSave"
              class="px-8 bg-primary hover:bg-primary/90 text-primary font-medium"
            >
              Save Changes
            </BaseButton>
          </div>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-4"
          >
            <div v-if="isRawEditorOpen" class="absolute inset-0 z-50 flex flex-col bg-card">
              <div class="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Code class="w-4 h-4 text-primary" />
                  Raw JSON Editor (Experimental)
                </div>
                <button @click="closeRawEditor" class="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div class="flex-1 p-4 bg-muted/5">
                <textarea 
                  v-model="rawJsonString" 
                  class="text-foreground w-full h-full p-4 font-mono text-sm bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 custom-scroll"
                  placeholder="Paste your JSON here..."
                  spellcheck="false"
                ></textarea>
              </div>
              <div class="flex items-center justify-end px-5 py-4 border-t border-border bg-muted/20 gap-3">
                <BaseButton @click="closeRawEditor" variant="ghost" class="px-5">Cancel</BaseButton>
                <BaseButton @click="saveRawJson" class="px-8 bg-primary hover:bg-primary/90 text-primary-foreground">Apply JSON</BaseButton>
              </div>
            </div>
          </Transition>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { X, GripVertical, Trash2, Plus, ChevronRight, Settings2, Copy, Link, MoreVertical, Code } from 'lucide-vue-next'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { usePopAlert } from '@/composables/usePopAlert';
import { getVarColor } from '@editors/variable/parts/VariableConfig.js';

import BaseInput from '@/commons/components/inputs/BaseInput.vue';
import BaseNumber from '@/commons/components/inputs/BaseNumber.vue';
import BaseSelect from '@/commons/components/inputs/BaseSelect.vue';
import BaseButton from '@/commons/components/buttons/BaseButton.vue';
import BaseDropdown from '@/commons/components/overlay/BaseDropdown.vue';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  variable: { type: Object, default: () => ({ name: '', type: 'List', defaultValue: [] }) }
});

const emit = defineEmits(['close', 'save']);
const { showPop } = usePopAlert();

const rootData = ref([]); 
const stack = ref([]);
const dragIndex = ref(null);
const scrollContainerRef = ref(null);
const isMouseDownOutside = ref(false);

const isRawEditorOpen = ref(false);
const rawJsonString = ref('');

const typeOptions = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'List', value: 'List' },
  { label: 'Map', value: 'Map' }
];

const boolOptions = [
  { label: 'False', value: false },
  { label: 'True', value: true }
];

const currentLevel = computed(() => stack.value[stack.value.length - 1] || {});
const currentType = computed(() => currentLevel.value.type);
const currentData = computed(() => currentLevel.value.dataRef || []);

const currentLevelPath = computed(() => {
  return stack.value.slice(1).map(s => s.accessor).join('');
});

const getItemPath = (item, idx) => {
  const isMap = currentType.value === 'Map';
  const itemAccessor = isMap ? `[${item.key || ''}]` : `[${idx}]`;
  const basePath = currentLevelPath.value;
  
  let finalPath = `${basePath}${itemAccessor}`;
  if (finalPath.startsWith('.')) finalPath = finalPath.substring(1);
  
  return finalPath;
};

const copyToClipboard = async (text) => {
  try {
    const textToCopy = text || "[]";
    await navigator.clipboard.writeText(textToCopy);
    showPop({ title: 'Copied!', message: `Path "${textToCopy}" copied.`, type: 'success', duration: 1500 });
  } catch (err) {
    showPop({ title: 'Error', message: 'Failed to copy path.', type: 'error' });
  }
};

const formatDataDeep = (val, type) => {
  if (type === 'Map') {
    const obj = val || {};
    return Object.entries(obj).map(([key, v]) => {
      let vType = Array.isArray(v) ? 'List' 
                : (typeof v === 'object' && v !== null) ? 'Map' 
                : typeof v === 'boolean' ? 'Boolean' 
                : typeof v === 'number' ? 'Number' : 'String';
                
      return {
        _id: GenerateUUID(),
        key: key,
        type: vType,
        value: (vType === 'List' || vType === 'Map') ? formatDataDeep(v, vType) : v
      };
    });
  } 
  else {
    if (!Array.isArray(val)) return [];
    return val.map(v => {
      let vType = Array.isArray(v) ? 'List' 
                : (typeof v === 'object' && v !== null) ? 'Map' 
                : typeof v === 'boolean' ? 'Boolean' 
                : typeof v === 'number' ? 'Number' : 'String';
                
      return {
        _id: GenerateUUID(),
        type: vType,
        value: (vType === 'List' || vType === 'Map') ? formatDataDeep(v, vType) : v
      };
    });
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.variable) {
    const clone = JSON.parse(JSON.stringify(props.variable.defaultValue || []));
    rootData.value = formatDataDeep(clone, props.variable.type);

    stack.value = [{
      label: props.variable.name || 'Unnamed',
      type: props.variable.type,
      dataRef: rootData.value,
      accessor: props.variable.name 
    }];
  } else {
    stack.value = [];
    rootData.value = [];
    isRawEditorOpen.value = false; 
  }
});

const navigateTo = (index) => {
  stack.value = stack.value.slice(0, index + 1);
};

const enterNestedLevel = (item, idx) => {
  if (!Array.isArray(item.value)) {
    item.value = [];
  }
  
  const isMap = currentType.value === 'Map';
  const label = isMap ? (item.key || `EmptyKey`) : `Idx ${idx}`;
  
  const pathAccessor = isMap ? `.${item.key || ''}` : `[${idx}]`;
  
  stack.value.push({
    label: label,
    type: item.type,
    dataRef: item.value,
    accessor: pathAccessor
  });
};

const addNewItem = async () => {
  const newItem = { _id: GenerateUUID(), type: 'String', value: '' };
  if (currentType.value === 'Map') newItem.key = '';
  
  currentData.value.push(newItem);
  
  await nextTick();
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTo({ top: scrollContainerRef.value.scrollHeight, behavior: 'smooth' });
  }
};

const duplicateItem = (idx) => {
  const itemToDuplicate = currentData.value[idx];
  
  const clonedItem = JSON.parse(JSON.stringify(itemToDuplicate));
  
  const regenerateIds = (obj) => {
    if (Array.isArray(obj)) {
      obj.forEach(child => regenerateIds(child));
    } else if (obj && typeof obj === 'object') {
      if (obj._id) obj._id = GenerateUUID();
      if (obj.value && (obj.type === 'List' || obj.type === 'Map')) {
        regenerateIds(obj.value);
      }
    }
  };
  
  regenerateIds(clonedItem);

  if (currentType.value === 'Map') {
    clonedItem.key = `${clonedItem.key}_copy`;
  }
  
  currentData.value.splice(idx + 1, 0, clonedItem);
};

const removeItem = (idx) => currentData.value.splice(idx, 1);

const onItemTypeChange = (item) => {
  if (item.type === 'Boolean') item.value = false;
  else if (item.type === 'Number') item.value = 0;
  else if (item.type === 'List' || item.type === 'Map') item.value = []; 
  else item.value = '';
};

const onDragStart = (e, idx) => {
  dragIndex.value = idx;
  e.dataTransfer.effectAllowed = 'move';
};

const onDrop = (e, dropIndex) => {
  if (dragIndex.value === null || dragIndex.value === dropIndex) return;
  const item = currentData.value.splice(dragIndex.value, 1)[0];
  currentData.value.splice(dropIndex, 0, item);
  dragIndex.value = null;
};

const cleanDataDeep = (arr, type) => {
  if (type === 'Map') {
    const result = {};
    arr.forEach(item => {
      if (!item.key || item.key.trim() === '') return;
      
      if (item.type === 'List' || item.type === 'Map') {
        result[item.key] = cleanDataDeep(item.value, item.type);
      } else {
        result[item.key] = item.value;
      }
    });
    return result;
  } else {
    return arr.map(item => {
      if (item.type === 'List' || item.type === 'Map') {
        return cleanDataDeep(item.value, item.type);
      }
      return item.value;
    });
  }
};

const openRawEditor = () => {
  const cleanData = cleanDataDeep(rootData.value, props.variable.type);
  rawJsonString.value = JSON.stringify(cleanData, null, 2);
  isRawEditorOpen.value = true;
};

const closeRawEditor = () => {
  isRawEditorOpen.value = false;
};

const saveRawJson = () => {
  try {
    const parsed = JSON.parse(rawJsonString.value);
    
    if (props.variable.type === 'Map' && (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null)) {
      throw new Error("Tipe data tidak valid. Root elemen harus berupa Object (Map).");
    }
    if (props.variable.type === 'List' && !Array.isArray(parsed)) {
      throw new Error("Tipe data tidak valid. Root elemen harus berupa Array (List).");
    }

    rootData.value = formatDataDeep(parsed, props.variable.type);
    
    stack.value = [{
      label: props.variable.name || 'Unnamed',
      type: props.variable.type,
      dataRef: rootData.value,
      accessor: props.variable.name 
    }];
    
    isRawEditorOpen.value = false;
    showPop({ title: 'Berhasil', message: 'JSON berhasil diterapkan ke editor.', type: 'success', duration: 1500 });
  } catch (err) {
    showPop({ title: 'JSON Error', message: err.message, type: 'error' });
  }
};

const handleSave = () => {
  const finalData = cleanDataDeep(rootData.value, props.variable.type);
  emit('save', finalData);
  emit('close');
};

const handleCancel = () => emit('close');
const onOutsideMouseDown = (e) => isMouseDownOutside.value = e.target === e.currentTarget;
const onOutsideMouseUp = (e) => {
  if (isMouseDownOutside.value && e.target === e.currentTarget) handleCancel();
  isMouseDownOutside.value = false;
};
</script>

<style scoped>
.list-reorder-move { transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
.list-reorder-enter-active, .list-reorder-leave-active { transition: all 0.3s ease; }
.list-reorder-enter-from, .list-reorder-leave-to { opacity: 0; transform: translateX(20px); }
.list-reorder-leave-active { position: absolute; width: 100%; }
.custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.3) transparent; }
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; margin-block: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 9999px; border: 1px solid transparent; background-clip: padding-box; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.6); }
</style>
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 md:scale-95 translate-y-4"
      enter-to-class="opacity-100 md:scale-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 md:scale-100 translate-y-0"
      leave-to-class="opacity-0 md:scale-95 translate-y-4"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 overflow-y-auto"
        @mousedown="onOutsideMouseDown"
        @mouseup="onOutsideMouseUp"
      >
        <div 
          class="w-full md:w-[920px] max-w-5xl h-[85vh] max-h-[800px] bg-card border border-border rounded-xl shadow-2xl flex flex-col relative overflow-hidden my-auto" 
          @mousedown.stop
        >
          <!-- Top Bar Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 shrink-0 gap-3">
            <div class="flex items-center bg-muted/60 p-1 rounded-lg border border-border shrink-0">
              <button 
                @click="switchScope('Global')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
                :class="currentScope === 'Global' ? 'bg-background text-primary shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'"
              >
                <Globe class="w-3.5 h-3.5" />
                <span>Global</span>
              </button>
              <button 
                @click="switchScope('Local')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
                :class="currentScope === 'Local' ? 'bg-background text-primary shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'"
              >
                <FileCode class="w-3.5 h-3.5" />
                <span>Local</span>
              </button>
            </div>

            <div class="w-px h-4 bg-border hidden sm:block shrink-0"></div>

            <!-- Breadcrumbs Navigation -->
            <div class="flex items-center gap-1 text-xs flex-wrap flex-1 min-w-0 overflow-hidden">
              <span class="text-muted-foreground font-semibold truncate">{{ currentScope }} Variables</span>
              
              <template v-for="(level, index) in stack" :key="index">
                <ChevronRight class="w-3.5 h-3.5 opacity-50 text-muted-foreground shrink-0" />
                <button 
                  @click="navigateTo(index)"
                  class="flex items-center gap-1.5 transition-colors px-1.5 py-0.5 rounded text-xs truncate"
                  :class="index === stack.length - 1 ? 'font-bold text-foreground cursor-default' : 'text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer'"
                  :disabled="index === stack.length - 1"
                >
                  <div class="w-2 h-2 rounded-full shadow-sm shrink-0" :style="{ backgroundColor: getVarColor(level.type) }"></div>
                  <span class="truncate">{{ level.label }}</span>
                </button>
              </template>
            </div>

            <!-- Search & Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <BaseSearchInput 
                v-model="searchQuery" 
                placeholder="Search variables..." 
                class="w-40 sm:w-52"
              />

              <button 
                v-if="!isRootLevel"
                @click="openRawEditor" 
                class="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary transition-colors" 
                title="Edit Raw JSON"
              >
                <Code class="w-4 h-4" />
              </button>

              <button 
                @click="handleClose" 
                class="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Content Body -->
          <div ref="scrollContainerRef" class="w-full flex-1 min-h-0 bg-background overflow-y-auto custom-scroll">
            <div class="p-6 flex flex-col min-h-full">
              
              <!-- Column Headers -->
              <div v-if="displayItems.length > 0" class="flex items-center gap-2 px-8 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div v-if="isRootLevel" class="w-8 text-center shrink-0" title="Expose variable">Panel</div>
                <div v-if="isRootLevel" class="w-40">Variable Name</div>
                <div v-else-if="currentType?.toLowerCase() === 'map'" class="w-36">Map Key</div>
                <div v-else class="w-10 text-center">Index</div>
                
                <div class="w-32">Type</div>
                <div class="flex-1">Value / Structure</div>
              </div>

              <!-- Item List -->
              <TransitionGroup name="list-reorder" tag="div" class="flex flex-col gap-2 relative">
                <div 
                  v-for="(item, idx) in displayItems" 
                  :key="item.keyId || item.id || idx"
                  draggable="true"
                  @dragstart="onDragStart($event, idx)"
                  @dragover.prevent
                  @dragenter.prevent
                  @drop="onDrop($event, idx)"
                  class="group flex items-center gap-2 p-2 pr-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all shadow-sm"
                  :class="{ 'opacity-40 scale-[0.98] border-primary/50 bg-primary/5': dragIndex === idx }"
                >
                  <div class="cursor-grab active:cursor-grabbing p-1 text-muted-foreground group-hover:text-primary/60 transition-colors shrink-0">
                    <GripVertical class="w-4 h-4" />
                  </div>

                  <!-- Root Level: Expose Checkbox -->
                  <div v-if="isRootLevel" class="w-8 flex justify-center shrink-0">
                    <input 
                      type="checkbox"
                      :checked="!!item.isExposed"
                      @change="e => handleUpdateField(idx, 'isExposed', e.target.checked)"
                      class="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer accent-primary"
                    />
                  </div>

                  <!-- Root Level: Variable Name -->
                  <div v-if="isRootLevel" class="w-40 shrink-0">
                    <input 
                      :value="item.name"
                      @change="e => handleUpdateField(idx, 'name', e.target.value)"
                      placeholder="Var Name..."
                      class="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none font-bold text-xs py-1 text-foreground"
                    />
                  </div>

                  <div v-else-if="currentType?.toLowerCase() === 'map'" class="w-36 shrink-0">
                    <BaseInput 
                      :model-value="item.key" 
                      @update:model-value="val => handleMapKeyChange(item.key, val)" 
                      placeholder="Key..." 
                      class="font-mono text-xs" 
                    />
                  </div>

                  <!-- Nested Level: List Index Label -->
                  <div v-else class="w-10 text-[10px] font-mono text-muted-foreground font-bold text-center select-none shrink-0">
                    {{ idx }}
                  </div>

                  <!-- Type Selector -->
                  <div class="w-32 shrink-0">
                    <BaseSelect 
                      :model-value="item.type"
                      :options="typeOptions"
                      @update:model-value="val => handleTypeChange(item, idx, val)"
                      class="w-full text-xs"
                    />
                  </div>

                  <!-- Value Renderer -->
                  <div class="flex-1 min-w-[150px]">
                    <!-- Button if Value is List or Map -->
                    <BaseButton 
                      v-if="isCollectionType(item.type)"
                      @click="enterNestedLevel(item, idx)"
                      variant="outline"
                      class="w-full justify-center border-dashed gap-2 hover:bg-primary/5 hover:border-primary/40 text-xs h-9"
                    >
                      <Settings2 class="w-3.5 h-3.5 text-primary" />
                      <span>Configure {{ item.type.toUpperCase() }}</span>
                      <span class="opacity-60 text-[10px]">({{ getNestedCount(item.value) }} items)</span>
                    </BaseButton>

                    <!-- Primitive Type Editors -->
                    <BaseSelect 
                      v-else-if="item.type?.toLowerCase() === 'boolean'" 
                      :model-value="item.value"
                      @update:model-value="val => handleValueChange(item, idx, val)"
                      :options="boolOptions" 
                    />
                    <BaseNumber 
                      v-else-if="item.type?.toLowerCase() === 'number'" 
                      :model-value="item.value"
                      @update:model-value="val => handleValueChange(item, idx, val)"
                      class="font-mono text-xs" 
                    />
                    <BaseInput 
                      v-else 
                      :model-value="item.value"
                      @update:model-value="val => handleValueChange(item, idx, val)"
                      placeholder="Value..." 
                      class="text-xs" 
                    />
                  </div>

                  <!-- Context Menu Actions -->
                  <div class="flex items-center shrink-0 ml-1">
                    <BaseDropdown align="right">
                      <template #trigger>
                        <button class="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <MoreVertical class="w-4 h-4" />
                        </button>
                      </template>

                      <template #default="{ close }">
                        <div class="w-auto whitespace-nowrap flex flex-col py-1 text-xs min-w-[130px]">
                          <button @click="handleDuplicate(item, idx); close()" class="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-left transition-colors">
                            <Copy class="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Duplicate
                          </button>
                          <div class="h-px bg-border my-1"></div>
                          <button @click="handleRemove(item, idx); close()" class="flex items-center px-2 py-1.5 hover:bg-destructive/10 text-destructive text-left transition-colors">
                            <Trash2 class="w-3.5 h-3.5 mr-2" /> Delete
                          </button>
                        </div>
                      </template>
                    </BaseDropdown>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Empty State -->
              <div v-if="displayItems.length === 0" class="py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/5 mb-4 mt-2 select-none">
                <p class="text-sm text-muted-foreground italic">
                  <span v-if="searchQuery">No items matching "{{ searchQuery }}".</span>
                  <span v-else>No {{ isRootLevel ? `${currentScope.toLowerCase()} variables` : currentType }} items defined.</span>
                </p>
              </div>

              <!-- Add New Button -->
              <BaseButton 
                @click="addNewItem"
                variant="outline"
                class="mt-4 w-full py-5 border-dashed border-2 transition-all group hover:border-primary/50 hover:bg-primary/5 text-primary"
              >
                <Plus class="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
                <span>Add New {{ isRootLevel ? 'Variable' : (currentType?.toLowerCase() === 'map' ? 'Key-Value Pair' : 'Element') }}</span>
              </BaseButton>

            </div>
          </div>

          <div class="flex items-center justify-end px-5 py-3 border-t border-border bg-muted/20 gap-3 shrink-0">
            <BaseButton @click="handleClose" variant="ghost" class="px-5">
              Done & Close
            </BaseButton>
          </div>

          <!-- Raw JSON Editor Overlay -->
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
                  Raw JSON Editor ({{ stack[stack.length - 1]?.label }})
                </div>
                <button @click="isRawEditorOpen = false" class="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
                <BaseButton @click="isRawEditorOpen = false" variant="ghost" class="px-5">Cancel</BaseButton>
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
import { 
  X, GripVertical, Trash2, Plus, ChevronRight, Settings2, 
  Copy, MoreVertical, Code, Globe, FileCode 
} from 'lucide-vue-next'; 
import { usePopAlert } from '@composables/composables.js';
import { useVariableConfig, useVariableLogic } from '@nodes/nodes.js';
import {
  BaseInput,
  BaseNumber,
  BaseSelect,
  BaseButton,
  BaseDropdown,
  BaseSearchInput
} from '@components/components.js';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialScope: { type: String, default: 'Local' }
});

const emit = defineEmits(['close']);
const { showPop } = usePopAlert();
const { getVarColor, typeOptions, isCollectionType, getDefaultValueForType } = useVariableConfig();

const currentScope = ref(props.initialScope);
const searchQuery = ref('');

const { 
  variables, 
  addVariable, 
  updateVariable, 
  duplicateVariable, 
  deleteVariable,
  reorderVariables
} = useVariableLogic(() => currentScope.value);

const stack = ref([]);
const dragIndex = ref(null);
const scrollContainerRef = ref(null);
const isMouseDownOutside = ref(false);

const isRawEditorOpen = ref(false);
const rawJsonString = ref('');

const boolOptions = [
  { label: 'False', value: false },
  { label: 'True', value: true }
];

const isRootLevel = computed(() => stack.value.length === 1);
const currentLevel = computed(() => stack.value[stack.value.length - 1] || {});
const currentType = computed(() => currentLevel.value.type);

/**
 * Deteksi Tipe Data Nilai secara otomatis
 */
const detectTypeFromValue = (val) => {
  if (Array.isArray(val)) return 'list';
  if (val !== null && typeof val === 'object') return 'map';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  return 'string';
};

/**
 * Normalisasi data untuk dikonsumsi oleh UI Modal
 */
const displayItems = computed(() => {
  if (isRootLevel.value) {
    return (variables.value || []).map(v => ({
      ...v,
      type: (v.type || 'string').toLowerCase(),
      value: v.defaultValue
    }));
  }

  const parentRef = currentLevel.value.targetRef;
  const cType = currentType.value?.toLowerCase();

  let items = [];

  if (cType === 'list' && Array.isArray(parentRef)) {
    items = parentRef.map((val, idx) => ({
      keyId: `list_${idx}`,
      type: detectTypeFromValue(val),
      value: val
    }));
  } else if (cType === 'map' && parentRef && typeof parentRef === 'object') {
    items = Object.entries(parentRef).map(([k, val]) => ({
      keyId: `map_${k}`,
      key: k,
      type: detectTypeFromValue(val),
      value: val
    }));
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return items;

  return items.filter(item => {
    const nameMatch = item.name ? item.name.toLowerCase().includes(query) : false;
    const keyMatch = item.key ? item.key.toLowerCase().includes(query) : false;
    const valueMatch = (typeof item.value === 'string') ? item.value.toLowerCase().includes(query) : false;
    return nameMatch || keyMatch || valueMatch;
  });
});

const getNestedCount = (val) => {
  if (Array.isArray(val)) return val.length;
  if (val && typeof val === 'object') return Object.keys(val).length;
  return 0;
};

const initStack = () => {
  stack.value = [{
    label: 'Root',
    type: 'Root',
    targetRef: variables.value
  }];
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    currentScope.value = props.initialScope;
    searchQuery.value = '';
    initStack();
  } else {
    stack.value = [];
    isRawEditorOpen.value = false;
  }
});

const switchScope = (newScope) => {
  if (currentScope.value === newScope) return;
  currentScope.value = newScope;
  searchQuery.value = '';
  initStack();
};

const navigateTo = (index) => {
  stack.value = stack.value.slice(0, index + 1);
  searchQuery.value = '';
};

/**
 * Pindah Ke Level Dalam (Masuk ke Konfigurasi List/Map)
 */
const enterNestedLevel = (item, idx) => {
  let val = item.value;
  const isMap = currentType.value?.toLowerCase() === 'map';
  const targetType = (item.type || 'string').toLowerCase();

  // Jika nilai belum berupa koleksi, paksakan inisialisasi awal
  if (!val || (targetType === 'list' && !Array.isArray(val)) || (targetType === 'map' && typeof val !== 'object')) {
    val = getDefaultValueForType(targetType);
    handleValueChange(item, idx, val);
  }

  const label = isRootLevel.value 
    ? (item.name || 'Unnamed Var') 
    : (isMap ? (item.key || 'EmptyKey') : `Idx ${idx}`);

  searchQuery.value = '';
  stack.value.push({
    label: label,
    type: targetType,
    targetRef: val
  });
};

/**
 * Menambahkan Item Baru (Root atau Nested Level)
 */
const addNewItem = async () => {
  if (isRootLevel.value) {
    addVariable();
  } else {
    const parentRef = currentLevel.value.targetRef;
    const cType = currentType.value?.toLowerCase();

    if (cType === 'list' && Array.isArray(parentRef)) {
      parentRef.push('');
    } else if (cType === 'map' && parentRef && typeof parentRef === 'object') {
      // 1. Jika Map masih kosong, key awal dibuat string kosong ''
      let newKey = '';
      
      // 2. Jika key '' sudah ada, beri nama unik temporary tanpa prefiks 'key'
      if (newKey in parentRef) {
        let count = 1;
        newKey = `key_${count}`;
        while (newKey in parentRef) {
          count++;
          newKey = `key_${count}`;
        }
      }
      
      parentRef[newKey] = '';
    }
  }
  
  await nextTick();
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTo({ top: scrollContainerRef.value.scrollHeight, behavior: 'smooth' });
  }
};

const handleUpdateField = (idx, key, value) => {
  if (isRootLevel.value) {
    updateVariable(idx, key, value);
  }
};

const handleMapKeyChange = (oldKey, newKey) => {
  // Jika key tidak berubah, batalkan
  if (oldKey === newKey) return;
  
  const parentRef = currentLevel.value.targetRef;
  if (!parentRef || typeof parentRef !== 'object' || Array.isArray(parentRef)) return;

  const trimmedNewKey = newKey; // Memungkinkan string kosong saat mengetik

  // Jika key baru sudah ada di dalam Map (selain key lama itu sendiri)
  if (trimmedNewKey !== '' && trimmedNewKey in parentRef && trimmedNewKey !== oldKey) {
    showPop({ 
      title: 'Duplicate Key', 
      message: `Key "${trimmedNewKey}" already exists in this Map.`, 
      type: 'warning', 
      duration: 2500 
    });
    return;
  }

  // Simpan nilai lama, hapus key lama, lalu set dengan key baru
  const val = parentRef[oldKey];
  delete parentRef[oldKey];
  parentRef[trimmedNewKey] = val;
};


/**
 * Mengubah Tipe Data Item
 */
const handleTypeChange = (item, idx, newType) => {
  const cleanType = String(newType).toLowerCase();
  const newVal = getDefaultValueForType(cleanType);

  if (isRootLevel.value) {
    updateVariable(idx, 'type', cleanType);
  } else {
    handleValueChange(item, idx, newVal);
  }
};

/**
 * Mengubah Nilai Item
 */
const handleValueChange = (item, idx, val) => {
  if (isRootLevel.value) {
    updateVariable(idx, 'defaultValue', val);
  } else {
    const parentRef = currentLevel.value.targetRef;
    const cType = currentType.value?.toLowerCase();

    if (cType === 'list' && Array.isArray(parentRef)) {
      parentRef[idx] = val;
    } else if (cType === 'map' && parentRef && typeof parentRef === 'object') {
      parentRef[item.key] = val;
    }
  }
};

const handleDuplicate = (item, idx) => {
  if (isRootLevel.value) {
    duplicateVariable(idx);
  } else {
    const parentRef = currentLevel.value.targetRef;
    const cType = currentType.value?.toLowerCase();

    if (cType === 'list' && Array.isArray(parentRef)) {
      const copyVal = JSON.parse(JSON.stringify(parentRef[idx]));
      parentRef.splice(idx + 1, 0, copyVal);
    } else if (cType === 'map' && parentRef && typeof parentRef === 'object') {
      const copyVal = JSON.parse(JSON.stringify(parentRef[item.key]));
      let newKey = `${item.key}_copy`;
      let count = 1;
      while (newKey in parentRef) {
        newKey = `${item.key}_copy_${count++}`;
      }
      parentRef[newKey] = copyVal;
    }
  }
};

const handleRemove = (item, idx) => {
  if (isRootLevel.value) {
    deleteVariable(idx);
  } else {
    const parentRef = currentLevel.value.targetRef;
    const cType = currentType.value?.toLowerCase();

    if (cType === 'list' && Array.isArray(parentRef)) {
      parentRef.splice(idx, 1);
    } else if (cType === 'map' && parentRef && typeof parentRef === 'object') {
      delete parentRef[item.key];
    }
  }
};

const onDragStart = (e, idx) => {
  dragIndex.value = idx;
  e.dataTransfer.effectAllowed = 'move';
};

const onDrop = (e, dropIndex) => {
  if (dragIndex.value === null || dragIndex.value === dropIndex) return;
  if (isRootLevel.value) {
    reorderVariables(dragIndex.value, dropIndex);
  } else {
    const parentRef = currentLevel.value.targetRef;
    if (Array.isArray(parentRef)) {
      const item = parentRef.splice(dragIndex.value, 1)[0];
      parentRef.splice(dropIndex, 0, item);
    }
  }
  dragIndex.value = null;
};

const openRawEditor = () => {
  rawJsonString.value = JSON.stringify(currentLevel.value.targetRef, null, 2);
  isRawEditorOpen.value = true;
};

const saveRawJson = () => {
  try {
    const parsed = JSON.parse(rawJsonString.value);
    const target = currentLevel.value.targetRef;

    if (Array.isArray(target)) {
      if (!Array.isArray(parsed)) throw new Error("Format JSON harus berupa Array.");
      target.length = 0;
      parsed.forEach(item => target.push(item));
    } else if (typeof target === 'object') {
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error("Format JSON harus berupa Object Map.");
      Object.keys(target).forEach(k => delete target[k]);
      Object.assign(target, parsed);
    }

    isRawEditorOpen.value = false;
    showPop({ title: 'Success', message: 'JSON successfully applied.', type: 'success', duration: 1500 });
  } catch (err) {
    showPop({ title: 'JSON Error', message: err.message, type: 'error' });
  }
};

const handleClose = () => emit('close');
const onOutsideMouseDown = (e) => isMouseDownOutside.value = e.target === e.currentTarget;
const onOutsideMouseUp = (e) => {
  if (isMouseDownOutside.value && e.target === e.currentTarget) handleClose();
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
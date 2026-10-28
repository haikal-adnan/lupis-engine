<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { 
  Folder, FileText, RefreshCw, 
  ChevronRight, ChevronDown, Box, Code, Image as ImageIcon, 
  Film, FileCode, FileQuestion 
} from 'lucide-vue-next';

import { useOPFSStore, useOPFSActions } from '@opfs/opfs.js';
import { useTheme } from '@composables/composables.js';

const { isDark } = useTheme();

const opfsStore = useOPFSStore();
const { 
  refreshTree,
  openFile 
} = useOPFSActions();

const selectedItem = ref(null);

// State & Getters dari Store
const fileTree = computed(() => opfsStore.fileTree);
const isLoading = computed(() => opfsStore.isLoading);
const activeFile = computed(() => opfsStore.activeFile);
const fileContent = computed(() => opfsStore.fileContent);
const imageUrl = computed(() => opfsStore.imageUrl);
const activeFileType = computed(() => opfsStore.activeFileType);

const openFolders = ref(new Set());

const toggleFolderUI = (path) => {
  if (openFolders.value.has(path)) {
    openFolders.value.delete(path);
  } else {
    openFolders.value.add(path);
  }
};

const handleSelectItem = async (item) => {
  selectedItem.value = item;
  if (item.kind === 'file') {
    await openFile(item);
  } else {
    toggleFolderUI(item.path);
  }
};

const getFileIcon = (name) => {
  if (name === 'project.json' || name === 'assets.json') return Box;
  if (name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.ts')) return Code;
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) return ImageIcon;
  if (name.endsWith('.scene') || name.endsWith('.prefab')) return Film;
  return FileText;
};

onMounted(() => {
  refreshTree();
});

onBeforeUnmount(() => {
  opfsStore.clearActiveFile();
});
</script>

<template>
  <div 
    class="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] w-full relative font-sans select-none p-2 transition-colors duration-300"
    :class="isDark ? 'bg-[#1e1e1e] text-slate-200' : 'bg-gray-50 text-slate-700'"
  >
    <!-- Tree Explorer Side Panel -->
    <div 
      class="col-span-1 flex flex-col h-full border rounded-xl overflow-hidden shadow-sm transition-colors duration-300"
      :class="isDark ? 'bg-[#252526] border-white/10' : 'bg-white border-black/10'"
    >
      <div 
        class="p-3 border-b flex items-center justify-between gap-2 transition-colors duration-300"
        :class="isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-gray-100/70'"
      >
        <span class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 font-mono" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          <Box class="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> OPFS Explorer
        </span>

        <div class="flex items-center gap-1">
          <button 
            @click="refreshTree" 
            title="Refresh OPFS" 
            :class="[
              'p-1.5 rounded-lg transition-colors',
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5',
              isLoading && 'animate-spin'
            ]"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div v-if="isLoading && !fileTree.length" class="flex items-center justify-center py-12 text-sm text-slate-400 font-mono">
          <RefreshCw class="w-4 h-4 animate-spin mr-2" /> Memuat struktur...
        </div>

        <template v-else>
          <template v-for="item in fileTree" :key="item.path">
            <TreeItemNode 
              :item="item" 
              :selected-item="selectedItem"
              :open-folders="openFolders"
              :is-dark="isDark"
              :get-icon="getFileIcon"
              @select="handleSelectItem"
            />
          </template>
        </template>
      </div>
    </div>

    <!-- Preview Panel (Read Only) -->
    <div 
      class="col-span-1 md:col-span-2 h-full border rounded-xl overflow-hidden shadow-sm flex flex-col transition-colors duration-300"
      :class="isDark ? 'bg-[#252526] border-white/10' : 'bg-white border-black/10'"
    >
      <div 
        class="p-3 border-b flex items-center justify-between gap-2 transition-colors duration-300"
        :class="isDark ? 'border-white/10 bg-black/20' : 'border-black/5 bg-gray-100/70'"
      >
        <div class="flex items-center gap-2 truncate">
          <FileCode v-if="activeFileType === 'code'" class="w-4 h-4 text-cyan-400 shrink-0" />
          <ImageIcon v-else-if="activeFileType === 'image'" class="w-4 h-4 text-emerald-400 shrink-0" />
          <span class="text-xs font-semibold truncate font-mono" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
            {{ activeFile ? activeFile.name : 'Preview File OPFS' }}
          </span>
        </div>
        <span 
          class="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border transition-colors"
          :class="isDark ? 'bg-black/50 text-slate-400 border-white/10' : 'bg-white/80 text-slate-600 border-black/10'"
        >
          Readonly
        </span>
      </div>

      <div class="flex-1 overflow-auto p-4 flex flex-col justify-center items-center">
        <div v-if="!activeFile" class="text-center text-sm font-mono" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          Select a file from the explorer to preview.
        </div>

        <div v-else-if="activeFileType === 'code'" class="w-full h-full">
          <textarea
            :value="fileContent"
            readonly
            spellcheck="false"
            class="w-full h-full p-3 font-mono text-xs border rounded-lg resize-none focus:outline-none cursor-default transition-colors"
            :class="isDark ? 'bg-[#1e1e1e] text-slate-200 border-white/10 selection:bg-cyan-500/30' : 'bg-gray-50 text-slate-800 border-black/10 selection:bg-cyan-500/20'"
          ></textarea>
        </div>

        <div v-else-if="activeFileType === 'image'" class="w-full h-full flex flex-col items-center justify-center p-2">
          <div 
            class="max-w-full max-h-[400px] border rounded-lg overflow-hidden p-2 flex items-center justify-center shadow-inner transition-colors"
            :class="isDark ? 'bg-[#1e1e1e] border-white/10' : 'bg-gray-100 border-black/10'"
          >
            <img :src="imageUrl" :alt="activeFile.name" class="max-w-full max-h-[360px] object-contain rounded" />
          </div>
          <span class="text-xs mt-2 font-mono" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ activeFile.name }}</span>
        </div>

        <div v-else class="flex flex-col items-center gap-2 text-sm font-mono" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          <FileQuestion class="w-8 h-8 opacity-50" />
          <p>This file format does not support live preview.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { h } from 'vue';

const TreeItemNode = {
  name: 'TreeItemNode',
  props: ['item', 'selectedItem', 'openFolders', 'isDark', 'getIcon'],
  emits: ['select'],
  render() {
    const { item, selectedItem, openFolders, isDark, getIcon } = this;
    const isSelected = selectedItem?.path === item.path;
    const isOpen = openFolders.has(item.path);

    if (item.kind === 'directory') {
      return h('div', { class: 'text-xs font-mono space-y-0.5' }, [
        h('div', {
          onClick: () => this.$emit('select', item),
          class: [
            'group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
            isSelected 
              ? (isDark ? 'bg-cyan-500/20 text-cyan-400 font-medium' : 'bg-cyan-500/10 text-cyan-600 font-medium') 
              : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-black/5 text-slate-700')
          ]
        }, [
          h('div', { class: 'flex items-center gap-1.5 min-w-0' }, [
            h('button', { class: 'p-0.5 rounded text-slate-400' }, [
              isOpen 
                ? h(ChevronDown, { class: 'w-3.5 h-3.5' }) 
                : h(ChevronRight, { class: 'w-3.5 h-3.5' })
            ]),
            h(Folder, { class: 'w-4 h-4 text-cyan-400 shrink-0' }),
            h('span', { class: 'truncate' }, item.name)
          ])
        ]),
        isOpen && item.children && item.children.length > 0
          ? h('div', { 
              class: [
                'pl-3 space-y-0.5 border-l ml-3 transition-colors',
                isDark ? 'border-white/10' : 'border-black/10'
              ]
            }, item.children.map(child => h(TreeItemNode, {
              item: child,
              selectedItem,
              openFolders,
              isDark,
              getIcon,
              onSelect: (i) => this.$emit('select', i)
            })))
          : null
      ]);
    } else {
      const IconComponent = getIcon ? getIcon(item.name) : FileText;

      return h('div', {
        onClick: () => this.$emit('select', item),
        class: [
          'group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs font-mono',
          isSelected 
            ? (isDark ? 'bg-cyan-500/20 text-cyan-400 font-medium' : 'bg-cyan-500/10 text-cyan-600 font-medium') 
            : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-black/5 text-slate-700')
        ]
      }, [
        h('div', { class: 'flex items-center gap-2 min-w-0 ml-5' }, [
          h(IconComponent, { class: 'w-4 h-4 text-cyan-400/80 shrink-0' }),
          h('span', { class: 'truncate' }, item.name)
        ])
      ]);
    }
  }
};
</script>

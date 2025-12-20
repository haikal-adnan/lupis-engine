<script setup>
import { computed } from 'vue';
import FileNode from './FileNode.vue';

const props = defineProps({
  folders: { type: Array, default: () => [] },
  assets: { type: Array, default: () => [] }
});

const treeData = computed(() => {
  const map = {};
  const roots = [];

  // 1. Masukkan Folder ke Map
  props.folders.forEach(f => {
    map[f._id] = { ...f, type: 'folder', children: [] };
  });

  // 2. Masukkan Assets ke Map (sebagai leaf node)
  props.assets.forEach(a => {
    map[a._id] = { ...a, children: [] }; // Asset biasanya tidak punya children, tapi disiapkan saja
  });

  // 3. Bangun Hierarki Folder (Sub-folder)
  props.folders.forEach(f => {
    const node = map[f._id];
    // Asumsi: Folder bisa punya parentId jika itu subfolder
    if (f.parentId && map[f.parentId]) {
      map[f.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 4. Masukkan Asset ke Folder yang sesuai
  props.assets.forEach(a => {
    const node = map[a._id];
    // Asset menggunakan 'folderId' untuk merujuk ke parent folder
    if (a.folderId && map[a.folderId]) {
      map[a.folderId].children.push(node);
    } else {
      // Jika asset tidak punya folder (di root project)
      roots.push(node);
    }
  });

  return roots;
});
</script>

<template>
  <div class="py-1">
    <div v-if="treeData.length === 0" class="px-4 py-8 text-center">
      <div class="text-2xl mb-2 opacity-20">📁</div>
      <p class="text-[10px] text-muted-foreground uppercase tracking-widest">No resources</p>
    </div>

    <FileNode v-for="node in treeData" :key="node._id" :item="node" />
  </div>
</template>
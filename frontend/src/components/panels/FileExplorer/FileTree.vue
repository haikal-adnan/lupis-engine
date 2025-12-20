<script setup>
import { computed } from 'vue';
import FileNode from './FileNode.vue';

const props = defineProps({
  folders: { type: Array, default: () => [] },
  assets: { type: Array, default: () => [] }
});

const treeData = computed(() => {
  // Pastikan props tersedia dan merupakan array
  if (!props.folders?.length && !props.assets?.length) return [];

  const map = {};
  const roots = [];

  // Inisialisasi Map
  props.folders.forEach(f => {
    map[f._id] = { ...f, type: 'folder', children: [] };
  });
  
  props.assets.forEach(a => {
    map[a._id] = { ...a, children: [] };
  });

  // Susun Hierarki
  [...props.folders, ...props.assets].forEach(item => {
    const node = map[item._id];
    const parentId = item.folderId || item.parentId;

    if (parentId && map[parentId]) {
      map[parentId].children.push(node);
    } else {
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
      <p class="text-[10px] text-muted-foreground uppercase tracking-widest">No assets found</p>
      <button class="mt-3 text-[10px] text-primary hover:underline">Import Assets</button>
    </div>

    <FileNode v-for="node in treeData" :key="node._id" :item="node" />
  </div>
</template>
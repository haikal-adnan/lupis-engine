<script setup>
import { computed } from 'vue';
import SceneNode from './SceneNode.vue';

const props = defineProps({
  data: { type: Array, default: () => [] }, // Flat array dari backend (Mongo) atau IndexedDB
  selectedId: String
});

defineEmits(['select']);

// Transformasi Flat Array -> Nested Tree
const nestedEntities = computed(() => {
  // Cek defensive programming
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return [];
  }

  const map = {};
  const roots = [];

  // 1. Buat Map dan Normalisasi ID (_id -> id)
  props.data.forEach(entity => {
    // PENTING: Backend Mongoose mengirim '_id', tapi IndexedDB/UI mungkin pakai 'id'.
    // Kita ambil mana yang ada (prioritas _id dari server).
    const uniqueId = entity._id || entity.id;

    if (!uniqueId) return; // Skip jika data corrupt tidak punya ID

    // Clone object dan siapkan array children
    // Kita inject properti 'id' agar komponen anak (SceneNode) konsisten membacanya
    map[uniqueId] = { 
      ...entity, 
      id: uniqueId, // Standardisasi ke 'id'
      children: [] 
    };
  });

  // 2. Susun relasi Parent-Child
  props.data.forEach(entity => {
    const uniqueId = entity._id || entity.id;
    const node = map[uniqueId];
    
    // Safety check jika node entah kenapa tidak masuk map
    if (!node) return;

    // Cek apakah punya parent DAN parent-nya ada di dalam list saat ini
    // (Penting: kadang parentId ada, tapi parent-nya belum terload/terhapus)
    if (entity.parentId && map[entity.parentId]) {
      map[entity.parentId].children.push(node);
    } else {
      // Jika parentId null atau parent tidak ditemukan, anggap sebagai Root
      roots.push(node);
    }
  });

  return roots;
});
</script>

<template>
  <div class="py-1">
    <div v-if="!nestedEntities || nestedEntities.length === 0" class="px-4 py-8 text-center select-none">
      <div class="text-2xl mb-2 opacity-20">🧊</div>
      <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Scene is empty</p>
      <p class="text-[9px] text-muted-foreground/60 mt-1">Right-click to add Entity</p>
    </div>

    <SceneNode 
      v-else
      v-for="node in nestedEntities" 
      :key="node.id" 
      :node="node" 
      :selectedId="selectedId"
      @select="$emit('select', $event)"
    />
  </div>
</template>
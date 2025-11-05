<template>
  <div class="text-sm text-white/90">
    <h3 class="font-semibold mb-2">File System</h3>

    <!-- Loading -->
    <div v-if="loading" class="text-xs italic opacity-70">
      Memuat struktur project...
    </div>

    <!-- Pohon folder -->
    <ul v-else-if="fileTree.length" class="space-y-1">
      <FileItem
        v-for="(node, index) in fileTree"
        :key="index"
        :node="node"
        :level="0"
      />
    </ul>

    <!-- Jika kosong -->
    <div v-else class="text-xs italic opacity-70">
      Tidak ada file ditemukan.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import FileItem from "./FileItem.vue";
import { useBackend } from "@/composables/useBackend";

const projectId = "template-platformer"; // proyek aktif
const { projectFiles, fetchProjectFiles, loading } = useBackend();
const fileTree = ref([]);

// Ambil data project saat komponen di-mount
onMounted(async () => {
  await fetchProjectFiles(projectId);
});

// Sinkronkan jika projectFiles reactive berubah
watch(projectFiles, (v) => {
  fileTree.value = v;
});
</script>

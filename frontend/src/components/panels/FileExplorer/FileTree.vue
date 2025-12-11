<template>
  <div class="text-sm text-primary transition-colors duration-200">
    <div v-if="loading" class="text-xs italic text-muted">
      Memuat struktur project...
    </div>

    <ul v-else-if="fileTree.length" class="space-y-1">
      <FileNode
        v-for="(node, index) in fileTree"
        :key="index"
        :node="node"
        :level="0"
      />
    </ul>

    <div v-else class="text-xs italic text-muted">
      Tidak ada file ditemukan.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import FileNode from "./FileNode.vue";
import { useBackend } from "@/composables/useBackend";

const projectId = "template"; 
const { projectFiles, fetchProjectFiles, loading } = useBackend();
const fileTree = ref([]);

onMounted(async () => {
  await fetchProjectFiles(projectId);
});

watch(projectFiles, (v) => {
  fileTree.value = v;
});
</script>
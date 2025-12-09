<!-- components/management/AssetManagement.vue -->

<template>
  <div class="flex h-full text-white text-sm select-none">
    <div class="w-64 border-r border-white/10 p-2 overflow-auto">
      <h3 class="font-semibold mb-2">Asset Folders</h3>

      <ul v-if="fileTreeFiltered.length" class="space-y-1">
        <FileItem
          v-for="(node, index) in fileTreeFiltered"
          :key="index"
          :node="node"
          :level="0"
          @click.stop="selectFolder(node)"
        />
      </ul>

      <div v-else class="text-white/50 italic text-xs mt-3">Tidak ada data asset.</div>
    </div>

    <div class="flex-1 p-3 overflow-auto">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h3 class="font-semibold text-base">Content</h3>
          <p class="text-xs opacity-60">
            {{ currentFolder ? currentFolder.name : "Pilih folder di sebelah kiri" }}
          </p>
        </div>
      </div>

      <div
        v-if="filteredChildren.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3"
      >
        <div
          v-for="(child, index) in filteredChildren"
          :key="index"
          class="bg-white/5 border border-white/10 rounded-md p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition"
        >
          <img
            :src="child.type === 'folder' ? folderIcon : fileIcon"
            class="w-6 h-6 mb-1 filter invert brightness-200"
          />
          <span class="truncate text-xs opacity-90">{{ child.name }}</span>
        </div>
      </div>

      <div v-else class="text-center text-white/50 mt-12">
        <p class="text-sm italic">
          Folder ini masih kosong atau tidak ada file dengan ekstensi valid.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useBackend } from "@/composables/useBackend";
import FileItem from "../system/FileItem.vue";
import fileIcon from "@/assets/icons/ic_file_code.svg";
import folderIcon from "@/assets/icons/ic_folder_open.svg";

const props = defineProps({
  projectId: {
    type: String,
    default: "game-demo",
  },
  extensions: {
    type: Array,
    default: () => [".png", ".jpg", ".jpeg", ".svg", ".wav", ".mp3"],
  },
});

const currentFolder = ref(null);
const { assets, fetchAssets, loading } = useBackend();

onMounted(async () => {
  await fetchAssets(props.projectId);
  // Setelah data masuk, pilih folder pertama
  if (assets.value.length > 0) {
    currentFolder.value = assets.value[0];
  }
});

function normalizeExts(exts) {
  return exts.map((e) => {
    const s = e.trim().toLowerCase();
    return s.startsWith(".") ? s : `.${s}`;
  });
}

function matchExt(filename, validExts) {
  const lower = filename.toLowerCase();
  return validExts.some((ext) => lower.endsWith(ext));
}

function filterTreeNodes(nodes, validExts) {
  if (!Array.isArray(nodes)) return [];

  const out = [];

  for (const node of nodes) {
    if (node.type === "file") {
      if (matchExt(node.name, validExts)) {
        out.push({ ...node, _raw: node });
      }
    } else if (node.type === "folder") {
      const filteredChildren = filterTreeNodes(node.children || [], validExts);

      out.push({
        ...node,
        children: filteredChildren,
        _raw: node,
      });
    }
  }

  return out;
}

const fileTreeFiltered = computed(() => {
  const validExts = normalizeExts(props.extensions);
  return filterTreeNodes(assets.value, validExts);
});

function selectFolder(node) {
  const target = node?._raw ?? node;
  if (target?.type === "folder") {
    currentFolder.value = target;
  }
}

const filteredChildren = computed(() => {
  if (!currentFolder.value) return [];
  const validExts = normalizeExts(props.extensions);

  return (
    currentFolder.value.children?.filter((child) => {
      if (child.type === "folder") return true;
      return matchExt(child.name, validExts);
    }) || []
  );
});
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>

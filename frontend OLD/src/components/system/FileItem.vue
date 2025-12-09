<template>
  <li>
    <div
      class="flex items-center gap-1 cursor-pointer select-none hover:bg-white/10 rounded px-1 py-0.5"
      :style="{ paddingLeft: `${level * 14}px` }"
      @click="toggle"
    >
      <!-- Panah (jika folder punya anak) -->
      <img
        v-if="node.type === 'folder' && hasChildren"
        :src="isOpen ? arrowDownIcon : arrowRightIcon"
        class="w-3.5 h-3.5 filter invert brightness-0"
      />
      <div v-else class="w-3.5 h-3.5"></div>

      <!-- Ikon utama (folder/file) -->
      <img
        :src="node.type === 'folder'
          ? (isOpen ? folderOpenIcon : folderCloseIcon)
          : fileIcon"
        class="w-4 h-4 filter invert brightness-0"
      />

      <!-- Nama -->
      <span class="ml-1">{{ node.name }}</span>
    </div>

    <!-- Anak folder -->
    <ul
      v-if="node.type === 'folder' && isOpen && hasChildren"
      class="mt-1 space-y-1"
    >
      <FileItem
        v-for="(child, index) in node.children"
        :key="index"
        :node="child"
        :level="level + 1"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue'

import fileIcon from '@/assets/icons/ic_file_code.svg'
import folderOpenIcon from '@/assets/icons/ic_folder_open.svg'
import folderCloseIcon from '@/assets/icons/ic_folder_close.svg'
import arrowRightIcon from '@/assets/icons/ic_arrow_right.svg'
import arrowDownIcon from '@/assets/icons/ic_arrow_down.svg'

const props = defineProps({
  node: Object,
  level: { type: Number, default: 0 }
})

const isOpen = ref(false)
const hasChildren = computed(() => props.node.children?.length > 0)

function toggle() {
  if (props.node.type === 'folder' && hasChildren.value) {
    isOpen.value = !isOpen.value
  }
}
</script>

<style scoped>
img {
  user-select: none;
  /* pastikan semua icon putih */
  filter: invert(1) brightness(200%);
}
</style>

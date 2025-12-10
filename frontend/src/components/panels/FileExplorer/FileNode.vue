<template>
  <li>
    <div
      class="flex items-center gap-1 cursor-pointer select-none hover:bg-element-hover rounded px-1 py-0.5 transition-colors duration-200"
      :style="{ paddingLeft: `${level * 14}px` }"
      @click="toggle"
    >
      <div v-if="node.type === 'folder' && hasChildren" class="flex items-center">
        <component 
          :is="isOpen ? ArrowDownIcon : ArrowRightIcon" 
          class="w-3.5 h-3.5 text-muted" 
        />
      </div>
      <div v-else class="w-3.5 h-3.5"></div>

      <div class="flex items-center">
        <component
          :is="node.type === 'folder' 
            ? (isOpen ? FolderOpenIcon : FolderCloseIcon) 
            : FileIcon"
          class="w-4 h-4 text-primary" 
        />
      </div>

      <span class="ml-1 text-primary">{{ node.name }}</span>
    </div>

    <ul v-if="node.type === 'folder' && isOpen && hasChildren" class="mt-1 space-y-1">
      <FileNode
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

// IMPORT SEBAGAI COMPONENT (Penting!)
import FileIcon from '@/assets/icons/ic_file_code.svg?component'
import FolderOpenIcon from '@/assets/icons/ic_folder_open.svg?component'
import FolderCloseIcon from '@/assets/icons/ic_folder_close.svg?component'
import ArrowRightIcon from '@/assets/icons/ic_arrow_right.svg?component'
import ArrowDownIcon from '@/assets/icons/ic_arrow_down.svg?component'

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
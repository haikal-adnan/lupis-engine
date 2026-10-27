<template>
  <div class="h-full flex flex-col bg-background text-foreground font-sans text-sm select-none">
    
    <!-- Top Toolbar -->
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border bg-background shrink-0">
      <div class="flex items-center gap-1">
        <button 
          v-for="filter in filters" 
          :key="filter.id"
          @click="activeFilter = filter.id"
          class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border border-transparent"
          :class="activeFilter === filter.id 
            ? 'bg-secondary text-foreground border-border/50 shadow-sm' 
            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'"
        >
          {{ filter.label }}
          <span v-if="filter.count > 0" class="ml-1 opacity-70">({{ filter.count }})</span>
        </button>
      </div>

      <div class="flex-1"></div>

      <BaseSearchInput v-model="searchQuery" placeholder="Filter logs..." />

      <div class="w-px h-4 bg-border mx-1"></div>

      <button 
        @click="triggerClear" 
        class="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded transition-colors" 
        title="Clear Console"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <!-- Scroll Container Bawaan dengan Tampilan Custom Scroll Area -->
    <div 
      ref="scrollContainer" 
      class="flex-1 overflow-y-auto bg-background custom-atomic-scrollbar p-1"
      @scroll="handleUserScroll"
    >
      <div v-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground/40 italic min-h-[200px]">
        <span class="text-xs">No logs to display</span>
      </div>

      <!-- Memberikan padding dan margin bawah ekstra agar entri log terakhir tidak mentok -->
      <div v-else class="flex flex-col pb-10 mb-2">
        <ConsoleItem 
          v-for="(log, i) in filteredLogs" 
          :key="i" 
          :log="log" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import ConsoleItem from './parts/ConsoleItem.vue'
import { useConsoleStore } from '@/stores/useConsoleStore.js'
import { storeToRefs } from 'pinia'

const consoleStore = useConsoleStore()
const { logs } = storeToRefs(consoleStore)

const activeFilter = ref('all')
const searchQuery = ref('')
const scrollContainer = ref(null)

const isUserAtBottom = ref(true)

const filters = computed(() => [
  { id: 'all', label: 'All', count: logs.value.length },
  { id: 'info', label: 'Info', count: logs.value.filter(l => l.type === 'info').length },
  { id: 'warn', label: 'Warn', count: logs.value.filter(l => l.type === 'warn').length },
  { id: 'error', label: 'Error', count: logs.value.filter(l => l.type === 'error').length },
])

const filteredLogs = computed(() => {
  let result = logs.value
  
  if (activeFilter.value !== 'all') {
    result = result.filter(l => l.type === activeFilter.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(l => {
      const msg = l.message ? l.message.toLowerCase() : ''
      const src = l.source ? l.source.toLowerCase() : ''
      return msg.includes(q) || src.includes(q)
    })
  }
  return result
})

const triggerClear = () => {
  consoleStore.clearLogs()
}

const handleUserScroll = () => {
  if (!scrollContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  const threshold = 15 
  
  isUserAtBottom.value = (scrollHeight - scrollTop - clientHeight) <= threshold
}

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

onMounted(() => {
  consoleStore.initListeners()
  scrollToBottom()
})

watch(() => logs.value.length, () => {
  if (isUserAtBottom.value && activeFilter.value === 'all' && !searchQuery.value) {
    scrollToBottom()
  }
})

watch(activeFilter, () => {
  isUserAtBottom.value = true
  scrollToBottom()
})
</script>

<style scoped>
/* Menirukan visualisasi track minimalis & thumb melayang dari ScrollArea atomic */
.custom-atomic-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  scroll-behavior: smooth;
}

/* Kustomisasi Webkit Engine (Chrome, Safari, Edge) */
.custom-atomic-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-atomic-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-atomic-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  transition: background 0.2s ease;
}

.custom-atomic-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}
</style>
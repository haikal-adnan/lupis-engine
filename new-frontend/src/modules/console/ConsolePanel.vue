<template>
  <div class="h-full flex flex-col bg-background text-foreground font-sans text-sm">
    
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

    <div ref="scrollContainer" class="flex-1 overflow-y-auto bg-background custom-scrollbar p-1">
      <div v-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground/40 italic">
        <span class="text-xs">No logs to display</span>
      </div>

      <ConsoleItem 
        v-for="(log, i) in filteredLogs" 
        :key="i" 
        :log="log" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { useConsole } from '@/modules/console/composables/useConsole.js' // Import composable
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import ConsoleItem from './parts/ConsoleItem.vue'

// Gunakan Composable
const { logs, triggerClear } = useConsole()

const activeFilter = ref('all')
const searchQuery = ref('')
const scrollContainer = ref(null)

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
    result = result.filter(l => 
      l.message.toLowerCase().includes(q) || 
      l.source.toLowerCase().includes(q)
    )
  }
  return result
})

// Auto Scroll ke bawah jika ada log baru
watch(() => logs.value.length, async () => {
  if (scrollContainer.value && activeFilter.value === 'all' && !searchQuery.value) {
    await nextTick()
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
})
</script>
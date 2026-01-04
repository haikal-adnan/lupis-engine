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

      <button @click="logs = []" class="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded transition-colors" title="Clear Console">
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto bg-background custom-scrollbar">
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
import { ref, computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue'
import ConsoleItem from './parts/ConsoleItem.vue'

const activeFilter = ref('all')
const searchQuery = ref('')

const logs = ref([
  { type: 'info', time: '10:23:45', source: 'System', message: 'Engine initialized successfully.' },
  { type: 'warn', time: '10:23:46', source: 'AssetLoader', message: 'Texture "hero_run.png" took 200ms to load.' },
  { type: 'error', time: '10:23:50', source: 'Script', message: 'ReferenceError: "player" is not defined at update()' },
  { type: 'info', time: '10:24:01', source: 'Network', message: 'Connected to localhost:3000' },
])

const filters = computed(() => [
  { id: 'all', label: 'All', count: logs.value.length },
  { id: 'info', label: 'Info', count: logs.value.filter(l => l.type === 'info').length },
  { id: 'warn', label: 'Warn', count: logs.value.filter(l => l.type === 'warn').length },
  { id: 'error', label: 'Error', count: logs.value.filter(l => l.type === 'error').length },
])

const filteredLogs = computed(() => {
  let result = logs.value
  
  // Filter Type
  if (activeFilter.value !== 'all') {
    result = result.filter(l => l.type === activeFilter.value)
  }

  // Filter Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(l => 
      l.message.toLowerCase().includes(q) || 
      l.source.toLowerCase().includes(q)
    )
  }
  return result
})
</script>
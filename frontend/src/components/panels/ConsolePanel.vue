<template>
  <div class="h-full flex flex-col bg-background text-foreground font-sans text-sm">
    
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background h-10 min-h-[40px]">
      
      <div class="flex items-center gap-1">
        <button 
          v-for="filter in filters" 
          :key="filter.id"
          @click="activeFilter = filter.id"
          :class="[
            'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border border-transparent',
            activeFilter === filter.id 
              ? 'bg-secondary text-foreground border-border/50 shadow-sm' 
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
          ]"
        >
          {{ filter.label }} <span v-if="filter.count" class="opacity-70 ml-0.5 font-normal">({{ filter.count }})</span>
        </button>
      </div>
      
      <div class="flex-1"></div>

      <div class="flex items-center gap-2">

        <div class="relative group transition-all duration-300 ease-out">
          <svg class="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Filter logs..." 
            class="w-40 focus:w-64 text-xs rounded-md pl-8 pr-2 py-1 outline-none transition-all duration-300
                   bg-background border border-border hover:border-border/50
                   focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/70"
          >
        </div>

        <div class="w-px h-4 bg-border mx-1"></div>

        <button 
          class="p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground rounded transition-colors" 
          title="Clear Console"
          @click="clearLogs"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>

        <div class="w-px h-4 bg-border mx-1"></div>

        <div class="flex items-center gap-0.5 shrink-0">
          <button class="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors" title="Options">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
          <button 
            @click="$emit('close')" 
            class="p-1.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded" 
            title="Minimize"
          >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>

      </div>
    </div>

    <div class="flex-1 overflow-y-auto font-mono text-xs bg-background">
      
      <div v-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground/50 italic">
        <span v-if="searchQuery">No logs matching "{{ searchQuery }}"</span>
        <span v-else>Console is empty</span>
      </div>

      <div 
        v-for="(log, i) in filteredLogs" 
        :key="i"
        :class="[
          'flex items-start gap-3 py-1.5 px-3 transition-colors',
          'border-b border-border/30 dark:border-white/5 hover:bg-secondary/20',
          getRowClass(log.type)
        ]"
      >
        <div class="mt-0.5 shrink-0">
          <svg v-if="log.type === 'error'" class="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          <svg v-else-if="log.type === 'warn'" class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          <svg v-else class="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        </div>

        <div class="flex-1 leading-relaxed font-sans">
          <span class="font-mono text-muted-foreground mr-2 opacity-60">[{{ log.time }}]</span>
          <span class="font-mono font-medium text-primary mr-2 cursor-pointer hover:underline">[{{ log.source }}]</span>
          <span :class="getMessageClass(log.type)">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

defineEmits(['close']); // Penting agar tombol minimize berfungsi

const activeFilter = ref('all');
const searchQuery = ref('');

const filters = [
  { id: 'all', label: 'All' },
  { id: 'info', label: 'Info', count: 4 },
  { id: 'warn', label: 'Warn', count: 1 },
  { id: 'error', label: 'Error', count: 1 },
];

const logs = ref([
  { type: 'info', time: '10:23:45', source: 'SceneManager', message: 'Scene loaded successfully' },
  { type: 'warn', time: '10:23:46', source: 'Animator', message: "Missing animation state: 'attack'" },
  { type: 'error', time: '10:23:47', source: 'AudioManager', message: 'Failed to load audio: "bgm_loop.wav" not found.' },
  { type: 'info', time: '10:23:48', source: 'System', message: 'Garbage collection finished.' },
  { type: 'info', time: '10:23:50', source: 'Network', message: 'Connected to local server.' },
]);

// Logic Filter: Gabungan antara Tab Type dan Search Query
const filteredLogs = computed(() => {
  let result = logs.value;

  // 1. Filter by Type
  if (activeFilter.value !== 'all') {
    result = result.filter(l => l.type === activeFilter.value);
  }

  // 2. Filter by Search Query (Message or Source)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(l => 
      l.message.toLowerCase().includes(query) || 
      l.source.toLowerCase().includes(query)
    );
  }

  return result;
});

function clearLogs() { logs.value = []; }

function getRowClass(type) {
  if (type === 'error') return 'bg-red-500/5 hover:bg-red-500/10';
  if (type === 'warn') return 'bg-yellow-500/5 hover:bg-yellow-500/10';
  return '';
}

function getMessageClass(type) {
  if (type === 'error') return 'text-red-400';
  if (type === 'warn') return 'text-yellow-400';
  return 'text-foreground';
}
</script>
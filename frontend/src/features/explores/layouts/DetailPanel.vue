<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  ArrowLeft, 
  Layers, 
  Box, 
  Code, 
  FileText, 
  Archive, 
  Cpu,
  Loader2 
} from 'lucide-vue-next';
import { PlayBrowser, useExportApp } from '@explores/explores.js';
import { useProjectActions } from '@projects/projects.js';

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const route = useRoute();
const router = useRouter();

const projectData = ref(null);
const isLoading = ref(true);
const errorMsg = ref('');

const { getProjectById } = useProjectActions();
const { isExporting, exportType, exportApp } = useExportApp();

const fetchProjectDetail = async (idToFetch) => {
  if (!idToFetch) return;
  
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const data = await getProjectById(idToFetch);
    projectData.value = data;
  } catch (err) {
    console.error('Failed to read project details:', err);
    errorMsg.value = err.message || 'Project not found in OPFS.';
  } finally {
    isLoading.value = false;
  }
};

const handleExport = async (format) => {
  const projectId = projectData.value?.project?.id || props.id;
  if (isExporting.value || !projectId) return;
  
  await exportApp(projectId, format);
};

watch(
  () => props.id,
  (newId) => {
    if (newId) fetchProjectDetail(newId);
  },
  { immediate: true }
);
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex-1 flex items-center justify-center min-h-[400px]">
    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
  </div>

  <!-- Error State -->
  <div v-else-if="errorMsg" class="flex-1 max-w-[800px] mx-auto w-full px-4 py-16 text-center">
    <div class="p-6 bg-card border border-border rounded-xl shadow-sm">
      <h2 class="text-xl font-bold text-rose-500 mb-2">Failed to Load Project</h2>
      <p class="text-sm text-muted-foreground mb-6">{{ errorMsg }}</p>
      <button 
        @click="router.back()" 
        class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-foreground hover:bg-accent/80 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" /> Back
      </button>
    </div>
  </div>

  <!-- Main Export Detail View -->
  <div v-else-if="projectData" class="flex-1 max-w-[1100px] mx-auto w-full px-4 lg:px-6 py-8 flex flex-col gap-8 font-sans">
    
    <!-- Header Navigation & Title -->
    <div class="flex items-center justify-between gap-4">
      <button 
        @click="router.back()" 
        class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4" /> Back to Explore
      </button>

      <span class="text-xs font-mono text-cyan-400 font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
        Export Mode
      </span>
    </div>

    <main class="w-full space-y-8">
      <!-- Container Canvas Game / Preview -->
      <div class="relative w-full aspect-[16/9] bg-slate-950 rounded-xl overflow-hidden border border-border shadow-2xl flex items-center justify-center">
        <PlayBrowser :projectId="projectData.project.id" />
      </div>

      <!-- Info Meta Project & Export Action Cards -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
              OPFS LOCAL
            </span>
            <span class="text-xs font-mono text-muted-foreground">
              ID: {{ projectData.project.id }}
            </span>
          </div>

          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            {{ projectData.project.name || 'Untitled Project' }}
          </h1>

          <div class="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <span>Created: {{ new Date(projectData.project.createdAt).toLocaleDateString() }}</span>
            <span>•</span>
            <span>Updated: {{ new Date(projectData.project.updatedAt).toLocaleDateString() }}</span>
          </div>
        </div>

        <!-- Export Option Buttons (ZIP & EXE) -->
        <div class="shrink-0 flex flex-col sm:flex-row items-stretch gap-3">
          <!-- Button Export ZIP -->
          <button
            @click="handleExport('zip')"
            :disabled="isExporting"
            class="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] rounded-xl transition-all border border-slate-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Loader2 v-if="isExporting && exportType === 'zip'" class="w-4 h-4 animate-spin text-cyan-400" />
            <Archive v-else class="w-4 h-4 text-cyan-400" />
            <span>{{ isExporting && exportType === 'zip' ? 'Exporting ZIP...' : 'Export Web (.ZIP)' }}</span>
          </button>

          <!-- Button Export EXE -->
          <button
            @click="handleExport('exe')"
            :disabled="isExporting"
            class="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Loader2 v-if="isExporting && exportType === 'exe'" class="w-4 h-4 animate-spin" />
            <Cpu v-else class="w-4 h-4" />
            <span>{{ isExporting && exportType === 'exe' ? 'Building EXE...' : 'Export App (.EXE)' }}</span>
          </button>
        </div>
      </div>

      <!-- Project Statistics -->
      <div class="grid grid-cols-3 gap-4">
        <div class="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
          <div class="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground font-mono">Total Scenes</p>
            <p class="text-lg font-bold font-mono text-foreground">{{ projectData.scenes?.length || 0 }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
          <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Box class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground font-mono">Total Assets</p>
            <p class="text-lg font-bold font-mono text-foreground">{{ projectData.assets?.length || 0 }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
          <div class="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Code class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground font-mono">Total Scripts</p>
            <p class="text-lg font-bold font-mono text-foreground">{{ projectData.scripts?.length || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Project Description -->
      <div>
        <h3 class="font-bold text-base mb-3 flex items-center gap-2 text-foreground">
          <FileText class="w-4 h-4 text-cyan-400" /> Project Description
        </h3>
        <p class="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-card/40 p-4 rounded-xl border border-border">
          {{ projectData.project.description || 'No description added for this project.' }}
        </p>
      </div>

    </main>

  </div>
</template>
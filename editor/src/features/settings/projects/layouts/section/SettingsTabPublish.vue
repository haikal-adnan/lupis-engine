<template>
  <div class="h-full flex flex-col justify-between p-2 sm:p-4 max-w-5xl mx-auto font-sans">
    
    <div class="space-y-5">
      <!-- Section Header -->
      <div class="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 class="text-lg font-bold text-foreground flex items-center gap-2">
            <Share2 class="w-5 h-5 text-cyan-400" />
            Build & Publish Module
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            Export your active project into web bundles, desktop executables, or backup project archives.
          </p>
        </div>
      </div>

      <!-- Export Options Stack -->
      <div class="space-y-3.5">
        
        <!-- Option 1: Web Standalone (.ZIP) -->
        <div class="bg-card/50 hover:bg-card border border-border hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Archive class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-sm text-foreground">Web Standalone (.ZIP)</h3>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">HTML5 Bundle</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                Bundles game engine scripts, canvas renderers, and project assets into an HTML5 web structure ready to host on web servers or platforms like itch.io.
              </p>
            </div>
          </div>

          <button
            @click="handleAppExport('zip')"
            :disabled="isProcessing"
            class="shrink-0 min-w-[160px] h-10 inline-flex items-center justify-center gap-2 px-4 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <Loader2 v-if="isExporting && exportType === 'zip'" class="w-4 h-4 animate-spin text-cyan-400" />
            <Archive v-else class="w-4 h-4 text-cyan-400" />
            <span>{{ isExporting && exportType === 'zip' ? 'Exporting ZIP...' : 'Export Web (.ZIP)' }}</span>
          </button>
        </div>

        <!-- Option 2: Windows Executable (.EXE) -->
        <div class="bg-card/50 hover:bg-card border border-border hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Cpu class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-sm text-foreground">Desktop App (.EXE)</h3>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Windows Native</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                Compiles your game into an independent desktop executable (.EXE) package built for offline gameplay on Windows operating systems.
              </p>
            </div>
          </div>

          <!-- Tombol Aksi Dinamis untuk EXE -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Jika EXE sudah siap diunduh -->
            <button
              v-if="exeDownloadUrl"
              @click="triggerDirectDownload"
              class="min-w-[160px] h-10 inline-flex items-center justify-center gap-2 px-4 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-500/20 animate-bounce cursor-pointer"
            >
              <Download class="w-4 h-4" />
              <span>Download (.EXE)</span>
            </button>

            <!-- Tombol Build Biasa -->
            <button
              @click="handleAppExport('exe')"
              :disabled="isProcessing"
              class="min-w-[160px] h-10 inline-flex items-center justify-center gap-2 px-4 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <Loader2 v-if="isExporting && exportType === 'exe'" class="w-4 h-4 animate-spin" />
              <Cpu v-else class="w-4 h-4" />
              <span>
                {{ isExporting && exportType === 'exe' ? 'Building EXE...' : (exeDownloadUrl ? 'Re-Build EXE' : 'Build App (.EXE)') }}
              </span>
            </button>
          </div>
        </div>

        <!-- Option 3: Lupis Project File (.lupisproject) -->
        <div class="bg-card/50 hover:bg-card border border-border hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <FolderArchive class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-sm text-foreground">Lupis Project Archive</h3>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">OPFS Raw Backup</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                Saves all raw OPFS scenes, scripts, node visual graphs, and asset files into a single compressed <code>.lupisproject</code> file to share or import back in Dashboard.
              </p>
            </div>
          </div>

          <button
            @click="handleProjectExport"
            :disabled="isProcessing"
            class="shrink-0 min-w-[160px] h-10 inline-flex items-center justify-center gap-2 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Loader2 v-if="isOpfsLoading" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            <span>{{ isOpfsLoading ? 'Saving File...' : 'Export (.lupisproject)' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Bottom Footer Status Info -->
    <div class="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Target Project: <strong class="text-foreground">{{ currentProjectId || 'None Selected' }}</strong>
      </span>
      <span>Lupis Engine v1.0</span>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Archive, Cpu, FolderArchive, Download, Loader2, Share2 } from 'lucide-vue-next';
import { useOPFSActions } from '@opfs/opfs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useExportApp, usePopAlert } from '@composables/composables.js';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const workspaceStore = useWorkspaceStore();
const { showPop } = usePopAlert();
const { isExporting, exportType, exeDownloadUrl, exportApp, downloadExeFile } = useExportApp();
const { exportToLupisProject, isLoading: isOpfsLoading } = useOPFSActions();

const currentProjectId = computed(() => {
  return workspaceStore.activeProjectId || props.info?.id || props.info?.project?.id || props.info?.projectId || null;
});

const isProcessing = computed(() => isExporting.value || isOpfsLoading.value);

const handleAppExport = async (format) => {
  const pid = currentProjectId.value;
  if (!pid || isProcessing.value) {
    if (!pid) {
      showPop({
        title: 'Export Failed',
        message: 'No active project ID found in workspace.',
        type: 'error'
      });
    }
    return;
  }

  await exportApp(pid, format);
};

const triggerDirectDownload = () => {
  downloadExeFile(currentProjectId.value);
};

const handleProjectExport = async () => {
  const pid = currentProjectId.value;
  if (!pid || isProcessing.value) {
    if (!pid) {
      showPop({
        title: 'Export Failed',
        message: 'No active project ID found in workspace.',
        type: 'error'
      });
    }
    return;
  }

  await exportToLupisProject(pid);
};
</script>
<template>
  <div class="min-h-full flex flex-col justify-between p-1 sm:p-2 md:p-4 max-w-5xl mx-auto font-sans">
    
    <div class="space-y-4 sm:space-y-5">
      <!-- Section Header (Deskripsi Ringkas, Tanpa Icon) -->
      <div class="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 class="text-base font-bold text-foreground">
            Build & Publish
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            Export your project into standalone web bundles, desktop executables, or backup archives.
          </p>
        </div>
      </div>

      <!-- Export Options Stack -->
      <div class="space-y-3.5">
        
        <!-- Option 1: Web Standalone (.ZIP) -->
        <div class="bg-card/50 hover:bg-card border border-border hover:border-primary/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
          <div class="space-y-1 flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-sm text-foreground">Web Standalone (.ZIP)</h3>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded text-primary border border-primary">HTML5</span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">Dev &amp; Release</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Export modular HTML5 web package ready for browser deployment.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-48">
            <!-- Tombol Export Web Development -->
            <button
              data-testid="export-web-dev-btn"
              @click="handleAppExport('zip', 'development')"
              :disabled="isProcessing"
              title="Export Web Development Bundle with Source Maps and unminified assets"
              class="w-full h-9 px-3 text-xs font-bold rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ isExporting && exportType === 'zip' && exportMode === 'development' ? 'Exporting Dev...' : 'Development (.ZIP)' }}
            </button>

            <!-- Tombol Export Web Release -->
            <button
              data-testid="export-web-release-btn"
              @click="handleAppExport('zip', 'release')"
              :disabled="isProcessing"
              title="Export optimized, obfuscated Web Release Bundle with encrypted assets"
              class="w-full h-9 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {{ isExporting && exportType === 'zip' && exportMode === 'release' ? 'Exporting Release...' : 'Release (.ZIP)' }}
            </button>
          </div>
        </div>

        <!-- Option 2: Windows Executable (.EXE) -->
        <div class="bg-card/50 hover:bg-card border border-border hover:border-primary/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
          <div class="space-y-1 flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-sm text-foreground">Desktop App (.EXE)</h3>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded text-primary border border-primary">Windows</span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">Dev &amp; Release</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Export standalone Windows desktop executable with Electron.
            </p>
          </div>

          <!-- Dynamic Action Buttons in a Clean Column -->
          <div class="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-48">
            <!-- Build Dev EXE -->
            <button
              data-testid="export-exe-dev-btn"
              @click="handleAppExport('exe', 'development')"
              :disabled="isProcessing"
              title="Build Windows executable with DevTools enabled and unminified code"
              class="w-full h-9 px-3 text-xs font-bold rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ isExporting && exportType === 'exe' && exportMode === 'development' ? 'Building Dev...' : 'Development (.EXE)' }}
            </button>

            <!-- Build Release EXE -->
            <button
              data-testid="export-exe-release-btn"
              @click="handleAppExport('exe', 'release')"
              :disabled="isProcessing"
              title="Build optimized standalone Windows production executable"
              class="w-full h-9 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {{ isExporting && exportType === 'exe' && exportMode === 'release' ? 'Building Release...' : 'Release (.EXE)' }}
            </button>
          </div>
        </div>

        <!-- Option 3: Lupis Project File (.lupisproject) -->
        <div class="bg-card/50 hover:bg-card border border-border hover:border-emerald-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
          <div class="space-y-1 flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-sm text-foreground">Project Archive</h3>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 border border-emerald-500">Backup</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Export raw project data, scenes, and assets into a single backup file.
            </p>
          </div>

          <div class="flex flex-col gap-2 shrink-0 w-full md:w-48">
            <button
              @click="handleProjectExport"
              :disabled="isProcessing"
              class="w-full h-9 px-3 text-xs font-bold rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {{ isOpfsLoading ? 'Saving Archive...' : 'Export (.lupisproject)' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Bottom Footer Status Info -->
    <div class="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
      <span class="flex items-center gap-2">
        Project: <strong class="text-foreground" data-testid="target-project-name">{{ currentProjectName || 'None Selected' }}</strong>
      </span>
      <span>Lupis Engine v0.1.0</span>
    </div>

    <!-- Export App Blocking Modal with Loading Bar & Percentage -->
    <ExportAppModal
      :is-open="showExportModal"
      :is-exporting="isExporting"
      :is-complete="isExportComplete"
      :progress="exportProgress"
      :status="exportStatus"
      :error="exportError"
      :export-type="exportType"
      :export-mode="exportMode"
      :project-name="currentProjectName"
      :can-download-exe="canDownloadExeInModal"
      @close="handleCloseModal"
      @download="handleModalDownload"
    />

  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useOPFSActions } from '@opfs/opfs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { useExportApp, usePopAlert } from '@composables/composables.js';
import ExportAppModal from './ExportAppModal.vue';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const workspaceStore = useWorkspaceStore();
const projectStore = useProjectStore();
const { showPop } = usePopAlert();

const exportAppComposable = useExportApp();
const isExporting = exportAppComposable.isExporting;
const exportType = exportAppComposable.exportType;
const exportMode = exportAppComposable.exportMode;
const exeDownloadUrl = exportAppComposable.exeDownloadUrl;
const exportApp = exportAppComposable.exportApp;
const downloadExeFile = exportAppComposable.downloadExeFile;

const exportProgress = exportAppComposable.exportProgress ?? ref(0);
const exportStatus = exportAppComposable.exportStatus ?? ref('');
const exportError = exportAppComposable.exportError ?? ref(null);
const isExportComplete = exportAppComposable.isExportComplete ?? ref(false);
const showExportModal = exportAppComposable.showExportModal ?? ref(false);
const closeExportModal = exportAppComposable.closeExportModal ?? (() => { showExportModal.value = false; });

const { exportToLupisProject, isLoading: isOpfsLoading } = useOPFSActions();

const currentProjectId = computed(() => {
  return projectStore.project?.id || workspaceStore.activeProjectId || props.info?.id || props.info?.project?.id || props.info?.projectId || null;
});

const currentProjectName = computed(() => {
  return projectStore.projectName || projectStore.project?.name || workspaceStore.project?.name || props.info?.name || props.info?.project?.name || currentProjectId.value || 'Project';
});

const isProcessing = computed(() => isExporting.value || isOpfsLoading.value);

const canDownloadExeInModal = computed(() => {
  return exportType.value === 'exe' && isExportComplete.value && Boolean(exeDownloadUrl.value);
});

const handleCloseModal = () => {
  closeExportModal(currentProjectId.value);
};

const handleModalDownload = () => {
  downloadExeFile(currentProjectId.value, exportMode.value, currentProjectName.value);
};

const handleAppExport = async (format, mode = 'release') => {
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

  await exportApp(pid, format, mode);
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

  await exportToLupisProject(pid, currentProjectName.value);
};
</script>

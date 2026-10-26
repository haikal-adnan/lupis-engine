<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 select-none"
        @click.stop
        @mousedown.stop
        @wheel.prevent
        @touchmove.prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        data-testid="export-app-modal-overlay"
      >
        <div
          class="w-full max-w-md max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] bg-card border border-border rounded-xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 text-foreground transform transition-all overflow-y-auto custom-scroll"
          data-testid="export-app-modal"
        >
          <!-- Modal Header -->
          <div class="space-y-1.5 pb-3 border-b border-border">
            <div class="flex items-center justify-between">
              <span
                class="text-[10px] font-bold uppercase tracking-wider py-0.5 rounded"
                :class="statusBadgeClass"
              >
                {{ statusBadgeText }}
              </span>
              <span class="text-xs font-mono text-muted-foreground">
                {{ exportFormatLabel }} • {{ exportModeLabel }}
              </span>
            </div>

            <h3
              id="export-modal-title"
              class="text-base font-bold text-foreground"
              data-testid="export-modal-title"
            >
              {{ modalTitle }}
            </h3>

            <p class="text-xs text-muted-foreground truncate">
              Project: <strong class="text-foreground">{{ projectName || 'Unnamed Project' }}</strong>
            </p>
          </div>

          <!-- Progress Section -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-foreground truncate max-w-[280px]" data-testid="export-modal-status-text">
                {{ status || 'Preparing export...' }}
              </span>
              <span class="font-mono font-bold text-sm text-foreground ml-2" data-testid="export-modal-percent-text">
                {{ progress }}%
              </span>
            </div>

            <!-- Progress Bar -->
            <div
              class="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border"
              role="progressbar"
              :aria-valuenow="progress"
              aria-valuemin="0"
              aria-valuemax="100"
              data-testid="export-modal-progress-bar"
            >
              <div
                class="h-full rounded-full transition-all duration-200 ease-out"
                :class="progressBarClass"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>

          <!-- Workspace Locked Notice (during export) -->
          <div
            v-if="isExporting"
            class="text-[11px] text-muted-foreground text-center bg-muted/40 py-2 px-3 rounded-lg border border-border"
            data-testid="export-modal-locked-notice"
          >
            Workspace is locked during packaging and upload to prevent data changes.
          </div>

          <!-- Error Message Banner -->
          <div
            v-if="error"
            class="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg leading-relaxed"
            data-testid="export-modal-error"
          >
            {{ error }}
          </div>

          <!-- Modal Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-border shrink-0">
            <template v-if="isExporting">
              <button
                disabled
                class="w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border"
              >
                Processing...
              </button>
            </template>

            <template v-else-if="isComplete">
              <button
                v-if="canDownloadExe"
                @click="$emit('download')"
                data-testid="export-modal-download-exe-btn"
                class="w-full sm:w-auto h-9 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm"
              >
                Download (.EXE)
              </button>
              <button
                @click="$emit('close')"
                data-testid="export-modal-done-btn"
                class="w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer border border-border"
              >
                Done
              </button>
            </template>

            <template v-else-if="error">
              <button
                @click="$emit('close')"
                data-testid="export-modal-close-btn"
                class="w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer border border-border"
              >
                Close
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isExporting: {
    type: Boolean,
    default: false
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: null
  },
  exportType: {
    type: String,
    default: 'zip'
  },
  exportMode: {
    type: String,
    default: 'release'
  },
  projectName: {
    type: String,
    default: ''
  },
  canDownloadExe: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close', 'download']);

const exportFormatLabel = computed(() => {
  return props.exportType === 'exe' ? 'Desktop App (.EXE)' : 'Web Standalone (.ZIP)';
});

const exportModeLabel = computed(() => {
  return props.exportMode === 'development' ? 'Development' : 'Release';
});

const modalTitle = computed(() => {
  if (props.error) return 'Export Failed';
  if (props.isComplete) return 'Export Completed';
  return props.exportType === 'exe' ? 'Building Desktop App' : 'Exporting Web Standalone';
});

const statusBadgeText = computed(() => {
  if (props.error) return 'Failed';
  if (props.isComplete) return 'Completed';
  return 'Exporting';
});

const statusBadgeClass = computed(() => {
  if (props.error) {
    return 'bg-destructive/15 text-destructive border-destructive/30';
  }
  if (props.isComplete) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  }
  return 'bg-primary/15 text-primary border-primary/30';
});

const progressBarClass = computed(() => {
  if (props.error) return 'bg-destructive';
  if (props.isComplete) return 'bg-emerald-500';
  return 'bg-primary';
});
</script>

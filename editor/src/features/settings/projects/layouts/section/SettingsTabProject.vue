<template>
  <div class="space-y-8 relative" data-testid="settings-tab-project-content">
    
    <!-- Section 1: Project Identity -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Project Identity</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Manage project name, description, and versioning.</p>
      </div>

      <div class="space-y-4">
        <!-- Project Name -->
        <PropertyRow label="Project Name">
          <div class="space-y-1 w-full">
            <BaseInput 
              data-testid="project-name-input"
              v-model="projectName"
              placeholder="Enter project name..."
              height="2.5rem"
              text-size="text-sm"
              class="w-full"
            />
            <p v-if="nameError" class="text-[11px] text-destructive font-medium pl-1">
              {{ nameError }}
            </p>
          </div>
        </PropertyRow>

        <!-- Project Description -->
        <PropertyRow label="Description">
          <BaseTextArea 
            data-testid="project-desc-input"
            v-model="projectDescription"
            placeholder="Brief summary or description of the project..."
            rows="2"
            class="w-full"
          />
        </PropertyRow>

        <!-- Project Version -->
        <PropertyRow label="Version">
          <BaseInput 
            data-testid="project-version-input"
            v-model="projectVersion"
            prefix="v"
            placeholder="1.0.0"
            height="2.5rem"
            text-size="text-sm"
            class="w-full"
          />
        </PropertyRow>
      </div>
    </section>

    <!-- Section 2: Game Cover Thumbnail & Scene Snapshot -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2 flex justify-between items-end">
        <div>
          <h4 class="text-sm font-bold text-foreground">Game Thumbnail</h4>
          <p class="text-xs text-muted-foreground mt-0.5">Custom cover image for your game on the dashboard, or automatic scene snapshot.</p>
        </div>
      </div>

      <div class="space-y-4">
        <PropertyRow label="Cover Preview">
          <div class="space-y-3 w-full">
            <div class="aspect-[16/10] max-w-[340px] relative rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center group shadow-sm">
              <img 
                v-if="effectiveThumbnail" 
                :src="effectiveThumbnail" 
                alt="Game Thumbnail Preview"
                data-testid="project-thumbnail-preview"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div v-else class="flex flex-col items-center justify-center text-muted-foreground/40 gap-2 p-4">
                <Gamepad2 class="w-10 h-10" :stroke-width="1.5" />
                <span class="text-xs font-medium">No Thumbnail Selected</span>
              </div>

              <!-- Badge indicating Custom vs Auto Snapshot -->
              <div class="absolute top-2.5 left-2.5">
                <span 
                  v-if="hasCustomThumbnail"
                  data-testid="thumbnail-badge-custom" 
                  class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-600 text-white shadow-sm uppercase tracking-wider"
                >
                  Custom Thumbnail
                </span>
                <span 
                  v-else-if="hasSnapshotThumbnail"
                  data-testid="thumbnail-badge-snapshot" 
                  class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-600 text-white shadow-sm uppercase tracking-wider"
                >
                  Scene Snapshot
                </span>
                <span 
                  v-else
                  data-testid="thumbnail-badge-default" 
                  class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border uppercase tracking-wider"
                >
                  Default Icon
                </span>
              </div>
            </div>

            <!-- Upload, Delete, and Capture Controls -->
            <div class="flex flex-wrap items-center gap-2">
              <input 
                ref="thumbnailFileInput"
                type="file" 
                accept="image/*" 
                class="hidden" 
                data-testid="thumbnail-file-input"
                @change="onThumbnailFileSelected" 
              />

              <BaseButton 
                data-testid="upload-thumbnail-btn"
                height-class="h-8"
                text-size="text-xs"
                @click="triggerThumbnailUpload"
              >
                <UploadCloud class="w-3.5 h-3.5 mr-1.5" />
                Upload Thumbnail
              </BaseButton>

              <BaseButton 
                v-if="hasCustomThumbnail"
                data-testid="delete-thumbnail-btn"
                ghost
                height-class="h-8"
                text-size="text-xs"
                @click="deleteCustomThumbnail"
                class="text-destructive hover:text-destructive"
              >
                <Trash2 class="w-3.5 h-3.5 mr-1.5" />
                Remove Custom (Use Snapshot)
              </BaseButton>

              <BaseButton 
                data-testid="capture-snapshot-btn"
                ghost
                height-class="h-8"
                text-size="text-xs"
                @click="captureSceneSnapshotNow"
                title="Capture instant snapshot from scene viewport"
              >
                <Camera class="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                Capture Scene Now
              </BaseButton>
            </div>
            <p class="text-[11px] text-muted-foreground">
              Whenever you save the project, Lupis Engine automatically captures a scene snapshot. Uploading a custom thumbnail overrides the snapshot on the dashboard.
            </p>
          </div>
        </PropertyRow>
      </div>
    </section>

    <!-- Section 3: Data Management & Auto-Save -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Data Management & Auto-Save</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Configure storage synchronization, automatic background saving, and persistence.</p>
      </div>

      <div class="space-y-6">
        <!-- Auto Save Toggle -->
        <div class="flex items-center gap-8 py-1">
          <BaseCheckbox 
            data-testid="project-autosave-checkbox"
            v-model="autoSaveEnabled" 
            label="Enable Auto Save" 
            box-size="w-4 h-4" 
            icon-size="w-3 h-3" 
            text-size="text-sm" 
          />
        </div>

        <!-- Auto Save Interval -->
        <div :class="{ 'opacity-40 pointer-events-none filter grayscale': !autoSaveEnabled }" class="transition-all duration-300">
          <PropertyRow label="Auto Save Interval">
            <div class="flex flex-col gap-2 w-full">
              <div class="flex items-center gap-3">
                <BaseNumber 
                  data-testid="project-autosave-interval-input"
                  v-model="autoSaveInterval" 
                  prefix="Min" 
                  height="2.5rem" 
                  text-size="text-sm" 
                  label-size="text-sm" 
                  class="font-mono flex-1" 
                  :min="1" 
                  :max="120"
                  :step="1" 
                  :disabled="!autoSaveEnabled"
                />
                <div class="text-sm font-mono text-muted-foreground bg-muted px-4 h-10 flex items-center rounded-md border border-border shrink-0 select-none">
                  Minutes
                </div>
              </div>
              <div class="flex items-start gap-2 mt-1 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p class="text-[11px] text-blue-600 dark:text-blue-400 leading-tight">
                  When auto-save is enabled, Lupis Engine writes changes directly to storage every {{ autoSaveInterval }} minute{{ autoSaveInterval > 1 ? 's' : '' }} whenever unsaved modifications are detected.
                </p>
              </div>
            </div>
          </PropertyRow>
        </div>

        <!-- Current Sync Status & Manual Save Actions (QOL) -->
        <div class="p-4 rounded-xl border border-border bg-muted/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div 
              class="w-3 h-3 rounded-full transition-all duration-300 shrink-0"
              :class="projectStore.syncStatus === 'dirty' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'"
            ></div>
            <div>
              <div class="text-xs font-semibold text-foreground flex items-center gap-2">
                <span>Storage Sync State:</span>
                <span 
                  data-testid="project-sync-indicator-text"
                  class="font-mono font-bold"
                  :class="projectStore.syncStatus === 'dirty' ? 'text-red-500' : 'text-emerald-500'"
                >
                  {{ projectStore.syncStatus === 'dirty' ? 'Unsaved Changes' : 'Synced with Storage' }}
                </span>
              </div>
              <p class="text-[11px] text-muted-foreground mt-0.5">
                {{ projectStore.syncStatus === 'dirty' ? 'You have changes waiting to be saved to storage.' : 'All local editor changes are committed to storage.' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <!-- Revert Changes Button (Revert only can on setting project) -->
            <BaseButton 
              data-testid="project-revert-button"
              data-test-alias="project-sync-now-button"
              ghost
              height-class="h-9"
              :disabled="workspaceStore.isLoading || workspaceStore.isSaving || projectStore.syncStatus !== 'dirty'"
              @click="handleRevertChanges"
              title="Revert all unsaved changes to the last saved state"
            >
              <RotateCcw class="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Revert Changes
            </BaseButton>

            <!-- Save Project Button -->
            <BaseButton 
              data-testid="project-save-now-button"
              height-class="h-9"
              :disabled="workspaceStore.isLoading || workspaceStore.isSaving || projectStore.syncStatus !== 'dirty'"
              @click="handleSaveNow"
            >
              <CloudUpload class="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              <span>{{ workspaceStore.isSaving ? 'Saving...' : 'Save Project' }}</span>
            </BaseButton>
          </div>
        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  Info, CloudUpload, RotateCcw, UploadCloud, Trash2, Camera, Gamepad2 
} from 'lucide-vue-next';

import {
  PropertyRow,
  BaseInput,
  BaseTextArea,
  BaseNumber,
  BaseCheckbox,
  BaseButton,
} from '@components/components.js';

import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';

defineProps({ info: Object });

const projectStore = useProjectStore();
const workspaceStore = useWorkspaceStore();
const { confirm } = useConfirm();
const { showPop } = usePopAlert();

const nameError = ref('');
const thumbnailFileInput = ref(null);

// Two-way bindings for Project Identity
const projectName = computed({
  get: () => projectStore.project?.name || '',
  set: (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      nameError.value = 'Project name cannot be empty';
      return;
    }
    nameError.value = '';
    projectStore.updateProjectName(trimmed);
  }
});

const projectDescription = computed({
  get: () => projectStore.project?.description || '',
  set: (val) => {
    projectStore.updateProjectDescription(val ?? '');
  }
});

const projectVersion = computed({
  get: () => projectStore.project?.version || '1.0.0',
  set: (val) => {
    projectStore.updateProjectVersion(val);
  }
});

// Thumbnail and Scene Snapshot handlers
const hasCustomThumbnail = computed(() => {
  return !!projectStore.project?.thumbnailUrl;
});

const hasSnapshotThumbnail = computed(() => {
  return !!projectStore.project?.snapshotUrl;
});

const effectiveThumbnail = computed(() => {
  return projectStore.project?.thumbnailUrl || projectStore.project?.snapshotUrl || null;
});

function triggerThumbnailUpload() {
  thumbnailFileInput.value?.click();
}

function onThumbnailFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target?.result;
    if (dataUrl) {
      projectStore.updateProjectThumbnail(dataUrl);
      showPop({
        title: 'Thumbnail Updated',
        message: 'Custom game thumbnail updated successfully.',
        type: 'success'
      });
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function deleteCustomThumbnail() {
  projectStore.updateProjectThumbnail(null);
  showPop({
    title: 'Thumbnail Removed',
    message: 'Custom thumbnail removed. Latest scene snapshot will be used.',
    type: 'info'
  });
}

function captureSceneSnapshotNow() {
  try {
    const canvas = typeof document !== 'undefined' ? document.querySelector('canvas') : null;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      const thumbCanvas = document.createElement('canvas');
      const targetW = 480;
      const targetH = Math.round((canvas.height / canvas.width) * targetW) || 300;
      thumbCanvas.width = targetW;
      thumbCanvas.height = targetH;
      const ctx = thumbCanvas.getContext('2d');
      const dataUrl = ctx 
        ? (ctx.drawImage(canvas, 0, 0, targetW, targetH), thumbCanvas.toDataURL('image/jpeg', 0.85)) 
        : canvas.toDataURL('image/jpeg', 0.85);
      
      projectStore.updateProjectSnapshot(dataUrl);
      showPop({
        title: 'Snapshot Captured',
        message: 'Captured latest scene viewport snapshot.',
        type: 'success'
      });
      return;
    }
  } catch (err) {
    console.warn('Snapshot capture failed:', err);
  }
  showPop({
    title: 'Snapshot',
    message: 'Scene viewport snapshot is not currently available.',
    type: 'warning'
  });
}

// Two-way bindings for Auto-Save
const autoSaveEnabled = computed({
  get: () => !!projectStore.project?.settings?.autoSave?.enabled,
  set: (val) => {
    projectStore.updateAutoSaveSettings({ enabled: !!val });
  }
});

const autoSaveInterval = computed({
  get: () => projectStore.project?.settings?.autoSave?.interval ?? 10,
  set: (val) => {
    const num = Math.max(1, Number(val) || 10);
    projectStore.updateAutoSaveSettings({ interval: num });
  }
});

// Manual save and revert handlers
async function handleSaveNow() {
  if (workspaceStore.isSaving || !workspaceStore.activeProjectId) return;
  await projectStore.saveProjectToServer();
}

async function handleRevertChanges() {
  if (!workspaceStore.activeProjectId) return;

  const isConfirmed = await confirm({
    title: 'Revert Changes?',
    message: 'Are you sure? All unsaved changes will be lost and the editor will reload the last saved state from storage.',
    type: 'warning',
    confirmText: 'Revert'
  });

  if (isConfirmed) {
    await projectStore.syncFromServer();
  }
}
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>
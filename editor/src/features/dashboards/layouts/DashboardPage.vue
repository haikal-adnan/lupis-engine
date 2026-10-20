<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectActions, useProjectMenu } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useOPFSActions } from '@opfs/opfs.js';
import { usePopAlert } from '@composables/composables.js';

import { CreateNewProjectPop } from '@dashboards/dashboards.js';
import { BaseContextMenu } from '@components/components.js';
import { Plus, Gamepad2, FolderOpen, Upload, AlertCircle, FileCode2 } from 'lucide-vue-next';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:searchQuery']);

const router = useRouter();
const { getProjects, createProject } = useProjectActions();
const { importFromLupisProject } = useOPFSActions();
const workspaceStore = useWorkspaceStore();
const { showPop } = usePopAlert();

const projects = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isCreatePopupOpen = ref(false);

const fileInputRef = ref(null);
const isDraggingOver = ref(false);
const isInvalidFileDragged = ref(false);
let dragCounter = 0;

const fetchProjects = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const data = await getProjects();
    projects.value = data;
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const openProject = async (projectId, inNewTab = false) => {
  if (inNewTab) {
    const routeData = router.resolve({
      name: 'Editor',
      params: { idProject: projectId }
    });
    window.open(routeData.href || `/editor/${projectId}`, '_blank');
    return;
  }

  workspaceStore.isLoading = true;
  try {
    await router.push(`/editor/${projectId}`);
  } catch (error) {
    console.error(error);
    workspaceStore.isLoading = false;
  }
};

const { menu, handleContextMenu, closeMenu, contextMenuItems } = useProjectMenu(fetchProjects, openProject);

onMounted(() => {
  fetchProjects();
});

const filteredProjects = computed(() => {
  if (!props.searchQuery) return projects.value;
  return projects.value.filter(p => 
    p.name.toLowerCase().includes(props.searchQuery.toLowerCase())
  );
});

const handleCreateProject = async (projectData) => {
  isCreatePopupOpen.value = false;
  workspaceStore.isLoading = true;

  try {
    const newProject = await createProject({
      projectName: projectData.name,
      description: projectData.description
    });

    await router.push(`/editor/${newProject.id}`);

  } catch (error) {
    console.error(error);
    showPop({
      title: 'Error Creating Project',
      message: error.message,
      type: 'error'
    });
    workspaceStore.isLoading = false;
  }
};

const isLupisProjectFile = (file) => {
  if (!file) return false;
  return file.name.toLowerCase().endsWith('.lupisproject');
};

const handleDragEnter = (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter++;

  if (dragCounter === 1) {
    isDraggingOver.value = true;
    const items = Array.from(e.dataTransfer?.items || []);
    if (items.length > 0) {
      const fileItem = items.find(item => item.kind === 'file');
      if (fileItem) isInvalidFileDragged.value = false;
    }
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
};

const handleDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter--;

  if (dragCounter <= 0) {
    dragCounter = 0;
    isDraggingOver.value = false;
    isInvalidFileDragged.value = false;
  }
};

const handleDrop = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  dragCounter = 0;
  isDraggingOver.value = false;
  isInvalidFileDragged.value = false;

  const files = Array.from(e.dataTransfer.files || []);
  if (files.length === 0) return;

  const lupisProjectFile = files.find(file => isLupisProjectFile(file));

  if (!lupisProjectFile) {
    showPop({
      title: 'Invalid File Format',
      message: 'Only .lupisproject files are allowed.',
      type: 'error'
    });
    return;
  }

  await processImport(lupisProjectFile);
};

const triggerFileInput = () => {
  if (fileInputRef.value) fileInputRef.value.click();
};

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!isLupisProjectFile(file)) {
    showPop({
      title: 'Invalid File Format',
      message: 'Please select a file with the .lupisproject extension.',
      type: 'error'
    });
    e.target.value = '';
    return;
  }

  await processImport(file);
  e.target.value = '';
};

const processImport = async (file) => {
  const res = await importFromLupisProject(file);
  if (res.success) {
    await fetchProjects();
  }
};
</script>

<template>
  <div 
    class="relative min-h-[calc(100vh-80px)] w-full transition-all duration-200"
    data-testid="dashboard-container"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="closeMenu"
  >
    <!-- Teleport Overlay Drag & Drop Zone -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div 
          v-if="isDraggingOver" 
          role="region"
          aria-label="File Drop Zone"
          data-testid="drop-zone-overlay"
          :data-invalid="isInvalidFileDragged"
          class="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6 pointer-events-none select-none"
        >
          <div 
            class="max-w-md w-full bg-card/90 border-2 border-dashed rounded-3xl p-8 md:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl transition-colors duration-300 relative overflow-hidden"
            :class="isInvalidFileDragged ? 'border-destructive/80 bg-destructive/5' : 'border-cyan-500/80 bg-cyan-500/5'"
          >
            <div 
              class="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              :class="isInvalidFileDragged ? 'bg-destructive/20' : 'bg-cyan-500/20'"
            ></div>
            <div 
              class="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              :class="isInvalidFileDragged ? 'bg-destructive/20' : 'bg-cyan-500/20'"
            ></div>

            <div 
              class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-bounce border transition-colors shadow-lg"
              :class="isInvalidFileDragged 
                ? 'bg-destructive/10 border-destructive/30 text-destructive shadow-destructive/10' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/10'"
            >
              <AlertCircle v-if="isInvalidFileDragged" class="w-10 h-10" :stroke-width="2" />
              <FileCode2 v-else class="w-10 h-10" :stroke-width="2" />
            </div>

            <h2 class="text-2xl font-black tracking-tight text-white mb-2.5" data-testid="drop-zone-title">
              {{ isInvalidFileDragged ? 'Unsupported File Format' : 'Drop .lupisproject File' }}
            </h2>

            <p class="text-sm font-medium text-slate-300 leading-relaxed max-w-xs">
              {{ isInvalidFileDragged 
                ? 'Only .lupisproject files can be loaded into the workspace.' 
                : 'Release the .lupisproject file to extract and load the project into storage.' 
              }}
            </p>

            <div class="mt-6 pt-5 border-t border-border/50 w-full flex justify-center">
              <span 
                class="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1.5"
                :class="isInvalidFileDragged 
                  ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                  : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'"
              >
                <span class="w-1.5 h-1.5 rounded-full animate-ping" :class="isInvalidFileDragged ? 'bg-red-400' : 'bg-cyan-400'"></span>
                {{ isInvalidFileDragged ? '.lupisproject Only' : 'Ready to Import' }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <input 
      ref="fileInputRef"
      type="file" 
      accept=".lupisproject" 
      class="hidden" 
      data-testid="file-import-input"
      @change="handleFileSelect" 
    />

    <div class="max-w-[1400px] w-full mx-auto p-6 md:p-10 lg:p-12">
      <div class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h2 class="text-3xl font-extrabold tracking-tight text-foreground">My Projects</h2>
            
            <div class="hidden sm:flex items-center gap-2 mt-1">
              <button 
                type="button"
                data-testid="create-project-btn"
                @click="isCreatePopupOpen = true"
                class="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm shadow-cyan-500/20"
              >
                <Plus class="w-3.5 h-3.5" :stroke-width="3" />
                New
              </button>

              <button 
                type="button"
                data-testid="load-project-btn"
                @click="triggerFileInput"
                class="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                title="Load project from .lupisproject file"
              >
                <Upload class="w-3.5 h-3.5" :stroke-width="2.5" />
                Load Project
              </button>
            </div>
          </div>
          
          <p class="text-muted-foreground text-sm font-medium" data-testid="project-summary-text">
            <span v-if="props.searchQuery">
              Showing {{ filteredProjects.length }} result(s) for "{{ props.searchQuery }}"
            </span>
            <span v-else>
              You have {{ filteredProjects.length }} active project(s). Drag & drop a <code>.lupisproject</code> file anywhere to load a project.
            </span>
          </p>
        </div>

        <div class="flex sm:hidden items-center gap-2 w-full">
          <button 
            type="button"
            data-testid="create-project-btn-mobile"
            @click="isCreatePopupOpen = true"
            class="flex-1 flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-cyan-500/20"
          >
            <Plus class="w-4 h-4" :stroke-width="3" />
            New Project
          </button>

          <button 
            type="button"
            data-testid="load-project-btn-mobile"
            @click="triggerFileInput"
            class="flex items-center justify-center gap-2 bg-secondary text-foreground border border-border px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          >
            <Upload class="w-4 h-4" :stroke-width="2.5" />
            Load Project
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div 
        v-if="isLoading" 
        data-testid="projects-loading-state"
        class="h-64 flex flex-col items-center justify-center"
      >
        <div class="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p class="text-muted-foreground font-medium animate-pulse text-sm">Loading your projects...</p>
      </div>

      <!-- Error State -->
      <div 
        v-else-if="errorMessage" 
        data-testid="projects-error-state"
        class="h-64 flex flex-col items-center justify-center bg-destructive/5 border border-destructive/20 rounded-2xl"
      >
        <p class="text-destructive font-semibold mb-4" data-testid="error-message">{{ errorMessage }}</p>
        <button 
          type="button"
          data-testid="retry-fetch-btn"
          @click="fetchProjects" 
          class="px-5 py-2 bg-background border border-border rounded-lg text-sm hover:bg-secondary transition-colors font-medium"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div 
        v-else-if="projects.length === 0" 
        data-testid="projects-empty-state"
        class="h-80 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-muted/10 p-6"
      >
        <div class="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-5">
          <FolderOpen class="w-8 h-8 text-muted-foreground/50" :stroke-width="1.5" />
        </div>
        <h3 class="text-xl font-bold mb-2">No Projects Found</h3>
        <p class="text-muted-foreground text-sm mb-6 text-center max-w-xs">
          You haven't created any game projects yet. Create a new project or drop a <code>.lupisproject</code> file here.
        </p>
        
        <div class="flex items-center gap-3">
          <button 
            type="button"
            data-testid="empty-create-project-btn"
            @click="isCreatePopupOpen = true"
            class="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Plus class="w-4 h-4" :stroke-width="3" /> Create First Project
          </button>

          <button 
            type="button"
            data-testid="empty-load-project-btn"
            @click="triggerFileInput"
            class="bg-background hover:bg-secondary text-foreground border border-border px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <Upload class="w-4 h-4" :stroke-width="2" /> Load Project
          </button>
        </div>
      </div>

      <!-- Filter Empty State -->
      <div 
        v-else-if="filteredProjects.length === 0" 
        data-testid="filter-empty-state"
        class="h-64 flex flex-col items-center justify-center border border-border rounded-3xl bg-card"
      >
        <p class="text-muted-foreground mb-2">No projects matching "{{ props.searchQuery }}"</p>
        <button 
          type="button"
          data-testid="clear-search-btn"
          @click="$emit('update:searchQuery', '')" 
          class="text-sm text-cyan-500 hover:underline"
        >
          Clear search
        </button>
      </div>

      <!-- Projects Grid -->
      <div 
        v-else 
        data-testid="projects-grid"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div 
          v-for="project in filteredProjects" 
          :key="project.id"
          data-testid="project-card"
          :data-project-id="project.id"
          :data-project-name="project.name"
          class="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col"
          @click="openProject(project.id)"
          @contextmenu.prevent="handleContextMenu($event, project)"
        >
          <div class="aspect-[16/10] relative bg-muted/50 overflow-hidden border-b border-border">
            <img 
              v-if="project.thumbnailUrl || project.snapshotUrl" 
              :src="project.thumbnailUrl || project.snapshotUrl" 
              :alt="project.name"
              data-testid="project-thumbnail-img"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/20 group-hover:text-cyan-500/20 transition-colors">
              <Gamepad2 class="w-12 h-12" :stroke-width="1.5" />
            </div>
            
            <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
              <span class="text-xs font-bold uppercase tracking-wider text-cyan-500 flex items-center gap-1">
                Open Editor <span class="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </div>

          <div class="p-5 flex-1 flex flex-col">
            <h3 class="font-bold text-lg group-hover:text-cyan-500 transition-colors line-clamp-1" data-testid="project-title">
              {{ project.name }}
            </h3>
            <p class="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed flex-1" data-testid="project-description">
              {{ project.description || 'A 2D game project created with Lupis Engine.' }}
            </p>
            
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider" data-testid="project-updated-at">
                Updated {{ new Date(project.updatedAt || Date.now()).toLocaleDateString('en-US') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popup Create Project -->
    <CreateNewProjectPop 
      :is-open="isCreatePopupOpen"
      @close="isCreatePopupOpen = false"
      @create="handleCreateProject"
    />

    <!-- Context Menu -->
    <BaseContextMenu 
      v-if="menu.visible"
      :position="{ x: menu.x, y: menu.y }"
      :items="contextMenuItems"
      @close="closeMenu"
    />
  </div>
</template>
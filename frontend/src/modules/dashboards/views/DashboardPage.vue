<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js';
import { useProjectStore } from '@/stores/useProjectStore';
import { useProjectMenu } from '@dashboards/composables/useProjectMenu.js';
import { useAuthActions } from '@/stores/scene/useAuthActions.js'; 

import CreateNewProjectPop from '@dashboards/components/CreateNewProjectPop.vue';
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue';
import { Plus, Gamepad2, FolderOpen } from 'lucide-vue-next';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const router = useRouter();
const { getProjectsByOwnerId, createProject } = useProjectBackend();
const projectStore = useProjectStore();
const { getCurrentUser } = useAuthActions(); 

const projects = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isCreatePopupOpen = ref(false);

const currentUser = ref(getCurrentUser());

const fetchProjects = async () => {
  if (!currentUser.value || !currentUser.value.id) {
    errorMessage.value = "Sesi pengguna tidak ditemukan. Silakan login kembali.";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const data = await getProjectsByOwnerId(currentUser.value.id);
    projects.value = data;
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const openProject = async (projectId) => {
  projectStore.isLoading = true;
  try {
    await router.push(`/editor/${projectId}`);
  } catch (error) {
    console.error(error);
    projectStore.isLoading = false;
  }
};

const { menu, handleContextMenu, closeMenu, contextMenuItems } = useProjectMenu(fetchProjects, openProject);

onMounted(() => {
  if (!currentUser.value) {
    router.push({ name: 'Landing', query: { action: 'login' } });
    return;
  }
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
  
  if (!currentUser.value || !currentUser.value.id) {
    alert("Anda harus login untuk membuat proyek baru.");
    return;
  }

  if (projectData.template !== 'Empty Project') {
    alert("Maaf, saat ini backend baru mendukung pembuatan 'Empty Project'.");
    return;
  }

  projectStore.isLoading = true;

  try {
    const newProject = await createProject({
      userId: currentUser.value.id,
      projectName: projectData.name,
      description: projectData.description,
      type: "empty"
    });

    await router.push(`/editor/${newProject.projectId}`);

  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
    projectStore.isLoading = false;
  }
};

// Fungsi baru untuk menentukan warna badge status
const getStatusStyle = (status) => {
  switch(status) {
    case 'PUBLISHED': 
      return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    case 'IN_PROGRESS': 
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'DRAFT':
    default: 
      return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  }
};
</script>

<template>
  <div class="max-w-[1400px] w-full mx-auto p-6 md:p-10 lg:p-12" @click="closeMenu">
    
    <div class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-4 mb-1">
          <h2 class="text-3xl font-extrabold tracking-tight text-foreground">My Projects</h2>
          
          <button 
            @click="isCreatePopupOpen = true"
            class="hidden sm:flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm shadow-cyan-500/20 mt-1"
          >
            <Plus class="w-3.5 h-3.5" :stroke-width="3" />
            New
          </button>
        </div>
        
        <p class="text-muted-foreground text-sm font-medium">
          <span v-if="props.searchQuery">
            Found {{ filteredProjects.length }} results for "{{ props.searchQuery }}"
          </span>
          <span v-else>
            You have {{ filteredProjects.length }} active projects.
          </span>
        </p>
      </div>

      <button 
        @click="isCreatePopupOpen = true"
        class="sm:hidden w-full flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-cyan-500/20"
      >
        <Plus class="w-4 h-4" :stroke-width="3" />
        New Project
      </button>
    </div>

    <div v-if="isLoading" class="h-64 flex flex-col items-center justify-center">
      <div class="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground font-medium animate-pulse text-sm">Loading your universe...</p>
    </div>

    <div v-else-if="errorMessage" class="h-64 flex flex-col items-center justify-center bg-destructive/5 border border-destructive/20 rounded-2xl">
      <p class="text-destructive font-semibold mb-4">{{ errorMessage }}</p>
      <button @click="fetchProjects" class="px-5 py-2 bg-background border border-border rounded-lg text-sm hover:bg-secondary transition-colors font-medium">
        Try Again
      </button>
    </div>

    <div v-else-if="projects.length === 0" class="h-80 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
      <div class="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-5">
        <FolderOpen class="w-8 h-8 text-muted-foreground/50" :stroke-width="1.5" />
      </div>
      <h3 class="text-xl font-bold mb-2">No Projects Found</h3>
      <p class="text-muted-foreground text-sm mb-6 text-center max-w-xs">You haven't created any game projects yet. Start building your dream game today.</p>
      
      <button 
        @click="isCreatePopupOpen = true"
        class="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
      >
        <Plus class="w-4 h-4" :stroke-width="3" /> Create First Project
      </button>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="h-64 flex flex-col items-center justify-center border border-border rounded-3xl bg-card">
      <p class="text-muted-foreground mb-2">No projects matching "{{ props.searchQuery }}"</p>
      <button @click="$emit('update:searchQuery', '')" class="text-sm text-cyan-500 hover:underline">Clear search</button>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="project in filteredProjects" 
        :key="project._id"
        class="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col"
        @click="openProject(project._id)"
        @contextmenu.prevent="handleContextMenu($event, project)"
      >
        <div class="aspect-[16/10] relative bg-muted/50 overflow-hidden border-b border-border">
          <img 
            v-if="project.thumbnailUrl" 
            :src="project.thumbnailUrl" 
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
          <h3 class="font-bold text-lg group-hover:text-cyan-500 transition-colors line-clamp-1">
            {{ project.name }}
          </h3>
          <p class="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed flex-1">
            {{ project.description || 'A 2D game project built with Lupis Engine.' }}
          </p>
          
          <div class="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Updated {{ new Date(project.updatedAt || Date.now()).toLocaleDateString() }}
            </span>
            <span 
              class="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border"
              :class="getStatusStyle(project.status)"
            >
              {{ (project.status || 'DRAFT').replace('_', ' ') }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
  </div>

  <CreateNewProjectPop 
    :is-open="isCreatePopupOpen"
    @close="isCreatePopupOpen = false"
    @create="handleCreateProject"
  />

  <Teleport to="body">
    <BaseContextMenu 
      v-if="menu.visible"
      :position="{ x: menu.x, y: menu.y }"
      :items="contextMenuItems"
      @close="closeMenu"
    />
  </Teleport>

</template>
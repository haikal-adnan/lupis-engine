<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from "@commons/composables/useTheme.js";
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js';
import { useProjectStore } from '@/stores/useProjectStore';
import { useProjectMenu } from '@dashboards/composables/useProjectMenu.js';

import CreateNewProjectPop from '@dashboards/components/CreateNewProjectPop.vue';
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue';
import BaseDropdown from "@ui/overlay/BaseDropdown.vue";
import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue';
import IconButton from "@ui/buttons/IconButton.vue";

import { 
  Plus, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  Gamepad2, 
  FolderOpen,
  User
} from 'lucide-vue-next';

const router = useRouter();
const { getProjectsByOwnerId, createProject } = useProjectBackend();
const { initTheme } = useTheme();

const projectStore = useProjectStore();

const projects = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const searchQuery = ref('');
const profileDropdown = ref(null);

const isCreatePopupOpen = ref(false);
const OWNER_ID = 'dev_2026';

const fetchProjects = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const data = await getProjectsByOwnerId(OWNER_ID);
    projects.value = data;
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const openProject = async (projectId, newTab = false) => {
  if (newTab) {
    const routeData = router.resolve(`/editor/${projectId}`);
    window.open(routeData.href, '_blank');
    return;
  }

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
  initTheme();
  fetchProjects();
});

const filteredProjects = computed(() => {
  if (!searchQuery.value) return projects.value;
  return projects.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const closeProfileMenu = () => {
  profileDropdown.value?.close();
};

const handleCreateProject = async (projectData) => {
  isCreatePopupOpen.value = false;
  
  if (projectData.template !== 'Empty Project') {
    alert("Maaf, saat ini backend baru mendukung pembuatan 'Empty Project'.");
    return;
  }

  projectStore.isLoading = true;

  try {
    const newProject = await createProject({
      userId: OWNER_ID, 
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
</script>

<template>
  <div 
    class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-emerald-500/30"
    @click="closeMenu"
  >
    
    <header class="h-16 border-b border-border flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-md z-50">
      
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2.5">
          <span class="font-bold tracking-tight text-lg">Lupis Engine</span>
        </div>
        
        <button 
          @click="isCreatePopupOpen = true"
          class="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-500/10"
        >
          <Plus class="w-4 h-4" :stroke-width="3" />
          New Project
        </button>
      </div>

      <div class="flex-1 max-w-xl px-10">
        <BaseSearchInput 
          v-model="searchQuery" 
          placeholder="Search projects... (Cmd + K)" 
          class="w-full"
        />
      </div>

      <div class="flex items-center gap-2">
        <IconButton tooltip="Marketplace" ghost>
          <ShoppingCart class="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </IconButton>

        <div class="h-6 w-px bg-border mx-2"></div>

        <BaseDropdown ref="profileDropdown" class="shrink-0 z-20">
          <template #trigger="{ isOpen }">
            <button 
              class="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center hover:ring-2 ring-emerald-500/50 transition-all outline-none"
              :class="{ 'ring-2 ring-emerald-500/50': isOpen }"
            >
              <User class="w-4 h-4 text-muted-foreground" />
            </button>
          </template>

          <template #default>
            <div class="px-3 py-2 border-b border-border mb-1">
              <p class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Signed in as</p>
              <p class="text-sm font-medium truncate max-w-[150px]">{{ OWNER_ID }}</p>
            </div>
            
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors outline-none flex items-center gap-2" @click="closeProfileMenu">
              <Settings class="w-4 h-4 text-muted-foreground" /> 
              Profile Settings
            </button>
            
            <div class="h-px bg-border my-1"></div>
            
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive text-destructive transition-colors outline-none flex items-center gap-2" @click="closeProfileMenu">
              <LogOut class="w-4 h-4" /> 
              Sign Out
            </button>
          </template>
        </BaseDropdown>
      </div>
    </header>

    <main class="flex-1 max-w-[1600px] w-full mx-auto p-10">
      
      <div class="mb-10 flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight">My Projects</h2>
          <p class="text-muted-foreground mt-2 text-sm">
            You have {{ filteredProjects.length }} active projects.
          </p>
        </div>
      </div>

      <div v-if="isLoading" class="h-64 flex flex-col items-center justify-center">
        <svg class="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-muted-foreground font-medium animate-pulse">Loading your universe...</p>
      </div>

      <div v-else-if="errorMessage" class="h-64 flex flex-col items-center justify-center bg-destructive/10 border border-destructive/20 rounded-xl">
        <p class="text-destructive font-semibold mb-4">{{ errorMessage }}</p>
        <button @click="fetchProjects" class="px-4 py-2 bg-background border border-border rounded-md text-sm hover:bg-secondary transition-colors">
          Try Again
        </button>
      </div>

      <div v-else-if="projects.length === 0" class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
        <FolderOpen class="w-12 h-12 text-muted-foreground/50 mb-4" :stroke-width="1.5" />
        <h3 class="text-lg font-bold mb-1">No Projects Found</h3>
        <p class="text-muted-foreground text-sm mb-6">You haven't created any game projects yet.</p>
        
        <button 
          @click="isCreatePopupOpen = true"
          class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2"
        >
          <Plus class="w-4 h-4" /> Create First Project
        </button>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="project in filteredProjects" 
          :key="project._id"
          class="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-md"
          @click="openProject(project._id)"
          @contextmenu.prevent="handleContextMenu($event, project)"
        >
          <div class="aspect-video relative bg-muted overflow-hidden">
            <img 
              v-if="project.thumbnailUrl" 
              :src="project.thumbnailUrl" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <Gamepad2 class="w-10 h-10" :stroke-width="1" />
            </div>
            
            <div class="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Open Editor →</span>
            </div>
          </div>

          <div class="p-5">
            <h3 class="font-bold text-lg group-hover:text-emerald-500 transition-colors line-clamp-1">
              {{ project.name }}
            </h3>
            <p class="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {{ project.description || 'A 2D game project built with Pixel Engine.' }}
            </p>
            
            <div class="flex items-center mt-5 pt-4 border-t border-border">
              <span class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                {{ new Date(project.updatedAt || Date.now()).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
    </main>

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

  </div>
</template>
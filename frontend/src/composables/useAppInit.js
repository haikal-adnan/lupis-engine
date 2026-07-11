import { onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'; 
import { useProjectStore } from '@/stores/useProjectStore'
import { useProjectWatcher } from '@/composables/useProjectWatcher'
import { useEditorStore } from '@/stores/useEditorStore';

import { useAuthStore } from '@/stores/useAuthStore.js'; 
import { usePopAlert } from '@/composables/usePopAlert';

export function useAppInit() {
  const projectStore = useProjectStore()
  const editorStore = useEditorStore()
  
  const { initWatchers, destroyWatchers } = useProjectWatcher() 
  const route = useRoute()
  const router = useRouter() 
  
  const authStore = useAuthStore() 
  const { showPop } = usePopAlert()

  const initApplication = async () => {
    if (route.name !== 'Editor') return;

    const projectId = route.params.idProject;

    if (projectId) {
      editorStore.setProjectId(projectId);

      try {
        if (!projectStore.project || projectStore.project._id !== projectId) {
          await projectStore.loadProject(projectId);
        } else {
          projectStore.isLoading = false; 
        }

        if (!projectStore.project) {
          throw new Error("Data project gagal dimuat dari database.");
        }

        let currentUser = authStore.currentUser;
        if (!currentUser) {
          const localData = localStorage.getItem('lupis_user_data');
          if (localData && localData !== 'undefined') {
            currentUser = JSON.parse(localData);
          }
        }
        
        const projectOwnerId = projectStore.project?.ownerId || projectStore.project?.userId;

        if (!currentUser || projectOwnerId !== currentUser.id) {
          showPop({
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki izin untuk mengedit proyek ini.',
            type: 'error'
          });
          
          cleanupApplication(); 
          return router.push('/dashboard'); 
        }
        
        initWatchers();

      } catch (error) {
        console.error("Failed load project:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Project tidak ditemukan atau terjadi kesalahan server.',
          type: 'error'
        });
        
        cleanupApplication(); 
        return router.push('/dashboard');
      }
    }
  };

  const cleanupApplication = () => {
    editorStore.setProjectId(null);
    projectStore.clearProjectData(); 
    
    if (typeof destroyWatchers === 'function') {
      destroyWatchers();
    }
  };

  watch(
    () => route.params.idProject,
    (newId) => {
      if (newId && route.name === 'Editor') {
        initApplication();
      } else if (route.name !== 'Editor') {
        cleanupApplication();
      }
    },
    { immediate: true } 
  );

  onUnmounted(() => {
    cleanupApplication();
  });

  return {
    isLoading: computed(() => projectStore.isLoading),
    project: computed(() => projectStore.project)
  }
}
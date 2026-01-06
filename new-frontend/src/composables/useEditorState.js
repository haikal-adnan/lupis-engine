// composables/useEditorState.js
import { computed } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';

export function useEditorState() {
    const projectStore = useProjectStore();

    // Ambil dari env
    const CDN_URL = import.meta.env.VITE_STORAGE_URL;
    
    // Atau ambil ID dari URL params / router jika user refresh halaman
    const activeProjectId = computed(() => {
        // Logika untuk mendapatkan project ID, misal dari route:
        // return route.params.id;
        
        // Atau hardcoded dev mode sesuai context anda:
        return import.meta.env.VITE_DEV_PROJECT_ID; 
    });

    return {
        CDN_URL,
        activeProjectId
    };
}
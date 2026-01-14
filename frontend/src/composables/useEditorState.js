// composables/useEditorState.js
import { computed } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';

export function useEditorState() {
    const projectStore = useProjectStore();

    const CDN_URL = import.meta.env.VITE_STORAGE_URL;
    
    const activeProjectId = computed(() => {

        return import.meta.env.VITE_DEV_PROJECT_ID; 
    });

    return {
        CDN_URL,
        activeProjectId
    };
}
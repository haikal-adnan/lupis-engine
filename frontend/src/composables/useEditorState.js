import { computed } from 'vue';
import { useEditorStore } from '@/stores/useEditorStore';

export function useEditorState() {
    const editorStore = useEditorStore();
    const CDN_URL = import.meta.env.VITE_STORAGE_URL;
    
    const activeProjectId = computed(() => editorStore.activeProjectId);

    return {
        CDN_URL,
        activeProjectId
    };
}
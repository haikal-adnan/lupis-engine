import { ref, computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js'; // Butuh Project ID
import { useAlert } from '@/composables/useAlert'; // Atau gunakan window.confirm/prompt standar

export function useScriptPanel() {
  const scriptStore = useScriptStore();
  const editorStore = useEditorStore();
  // Jika Anda punya custom hook prompt, gunakan di sini. 
  // Saya gunakan window.prompt/confirm untuk standar.

  // --- STATE ---
  const searchQuery = ref('');
  const viewMode = ref('grid');
  const selectedId = ref(null);

  // --- GETTERS ---
  const scripts = computed(() => scriptStore.scripts);

  const filteredScripts = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return scripts.value;
    
    return scripts.value.filter(script => 
      script.name.toLowerCase().includes(query)
    );
  });

  // --- ACTIONS ---

  const toggleView = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  };

  const selectScript = (script) => {
    selectedId.value = script._id;
  };

  /**
   * Create New Script
   * @param {string} type - 'component' | 'scene_logic'
   */
  const handleCreate = async (type = 'component') => {
    const projectId = editorStore.activeProjectId;
    if (!projectId) {
      console.error("No Active Project ID found.");
      return;
    }

    const defaultName = type === 'component' ? 'NewComponent' : 'NewSceneLogic';
    const name = window.prompt("Enter script name:", defaultName);

    if (name && name.trim()) {
      try {
        await scriptStore.createScript({
          projectId,
          name: name.trim(),
          type: type
        });
      } catch (err) {
        alert(`Failed to create script: ${err.message}`);
      }
    }
  };

  const handleRename = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    const newName = window.prompt("Rename script:", script.name);
    
    if (newName && newName.trim() && newName !== script.name) {
      try {
        await scriptStore.updateScript(scriptId, { name: newName.trim() });
      } catch (err) {
        alert(`Failed to rename: ${err.message}`);
      }
    }
  };

  const handleDuplicate = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    if (confirm(`Duplicate "${script.name}"?`)) {
      try {
         // Asumsi store punya action duplicateScript
         // Jika tidak, kita buat payload create baru based on existing
         await scriptStore.createScript({
           projectId: script.projectId,
           name: `${script.name}_Copy`,
           type: script.type,
           exposedVariables: script.exposedVariables,
           nodes: script.nodes,
           edges: script.edges
         });
      } catch (err) {
        alert(`Failed to duplicate: ${err.message}`);
      }
    }
  };

  const handleDelete = async (scriptId) => {
    const script = scriptStore.getScriptById(scriptId);
    if (!script) return;

    if (confirm(`Are you sure you want to delete "${script.name}"?\nThis action cannot be undone.`)) {
      try {
        await scriptStore.deleteScript(scriptId);
        if (selectedId.value === scriptId) selectedId.value = null;
      } catch (err) {
        alert(`Failed to delete: ${err.message}`);
      }
    }
  };

  const handleRefresh = async () => {
    const projectId = editorStore.activeProjectId;
    if (projectId) {
      await scriptStore.fetchScripts(projectId); // Asumsi nama action fetchScripts
    }
  };

  return {
    // State
    searchQuery,
    viewMode,
    selectedId,
    
    // Data
    filteredScripts,
    
    // Actions
    toggleView,
    selectScript,
    handleCreate,
    handleRename,
    handleDuplicate,
    handleDelete,
    handleRefresh
  };
}
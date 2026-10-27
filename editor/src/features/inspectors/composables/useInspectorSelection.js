import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

export function useInspectorSelection() {
  const sceneStore = useSceneStore();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();

  const isEditingMasterPrefab = computed(() => workspaceStore.activeTab?.type === 'prefab');

  const selectedLayerId = computed(() => {
    if (isEditingMasterPrefab.value) return null;
    if (sceneStore.selectedEntityIds.length !== 1) return null;
    
    const id = sceneStore.selectedEntityIds[0];
    const isLayer = sceneStore.activeLayers?.some(l => l.id === id);
    return isLayer ? id : null;
  });

  const topLevelSelection = computed(() => {
    if (!sceneStore.activeScene || sceneStore.selectedEntityIds.length === 0) return [];
    const hasSelectedAncestor = (entityId) => {
      let current = sceneStore.activeScene.entities.find(e => e.id === entityId);
      while (current && current.parentId) {
        if (sceneStore.selectedEntityIds.includes(current.parentId)) return true;
        current = sceneStore.activeScene.entities.find(e => e.id === current.parentId);
      }
      return false;
    };
    return sceneStore.selectedEntityIds.filter(id => !hasSelectedAncestor(id));
  });

  const selectedEntity = computed(() => {
    if (isEditingMasterPrefab.value) {
      const prefabId = workspaceStore.activeTab.id;
      const prefab = prefabStore.getPrefabById(prefabId);
      return prefab ? prefab.data : null;
    }
    if (selectedLayerId.value) return null; 
    if (topLevelSelection.value.length === 1) {
      const id = topLevelSelection.value[0];
      return sceneStore.activeScene.entities.find(e => e.id === id);
    }
    return null;
  });

  const isMultiSelection = computed(() => !isEditingMasterPrefab.value && topLevelSelection.value.length > 1);
  const hasSelection = computed(() => !!selectedEntity.value || !!selectedLayerId.value);
  const locked = computed(() => selectedEntity.value?._editor?.locked || false);

  const handleKeydown = (e) => {
    if (e.key === "Escape" && hasSelection.value && !isEditingMasterPrefab.value) {
      sceneStore.clearSelection();
    }
  };

  onMounted(() => window.addEventListener("keydown", handleKeydown));
  onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));

  return {
    isEditingMasterPrefab,
    selectedLayerId,
    topLevelSelection,
    selectedEntity,
    isMultiSelection,
    hasSelection,
    locked
  };
}
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Import actions dari file terpisah
// Pastikan path './layerActions', dll sesuai dengan struktur folder Anda
import { useLayerActions } from './layerActions';
import { useEntityActions } from './entityActions';
import { useSceneActions } from './sceneActions';

export const useSceneStore = defineStore('scene', () => {

  // --- STATE ---
  const scenes = ref([]);
  const activeSceneId = ref(null);
  const selectedEntityIds = ref([]);

  // --- GETTERS ---
  const activeScene = computed(() => scenes.value.find(s => s._id === activeSceneId.value));
  
  const getSceneById = computed(() => (id) => scenes.value.find(s => s._id === id));
  
  const activeEntities = computed(() => activeScene.value ? activeScene.value.entities : []);
  
  const activeLayers = computed(() => activeScene.value ? activeScene.value.layers : []);

  // --- BASIC ACTIONS ---
  const initScenes = (sceneList) => {
    scenes.value = Array.isArray(sceneList) ? sceneList : [];
    if (scenes.value.length > 0 && !activeSceneId.value) {
      activeSceneId.value = scenes.value[0]._id;
    }
  };

  const setActiveScene = (sceneId) => {
    const scene = scenes.value.find(s => s._id === sceneId);
    if (scene) {
      activeSceneId.value = scene._id;
      selectedEntityIds.value = [];
    }
  };

  // --- COMPOSING ACTIONS ---
  // Kita inject state ke dalam composables
  const sceneActions = useSceneActions(scenes, activeSceneId, selectedEntityIds);
  const layerActions = useLayerActions(activeScene);
  const entityActions = useEntityActions(activeScene, selectedEntityIds);

  return {
    // State
    scenes,
    activeSceneId,
    selectedEntityIds,
    
    // Getters
    activeScene,
    getSceneById,
    activeEntities,
    activeLayers,

    // Actions
    initScenes,
    setActiveScene,

    // Spread actions agar menjadi top-level actions di store
    // Ini memungkinkan $onAction mendeteksi: sceneStore.createEntity(...)
    ...sceneActions,
    ...layerActions,
    ...entityActions
  };
});
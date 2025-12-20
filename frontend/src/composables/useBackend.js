// composables/useBackend.js

import { ref } from "vue";

const API_URL = "https://api-lupis.calk.cloud";
const CDN_URL = "https://cdn-lupis.calk.cloud";

export function useBackend() {
  // --- STATE ---
  const projectData = ref(null); // Menyimpan detail project (width, height, layers)
  const folders = ref([]);
  const assets = ref([]);
  const scenes = ref([]);   
  const prefabs = ref([]);
  const currentScene = ref(null); 

  const loading = ref(false);
  const error = ref(null);

  // --- ACTIONS ---

  // 1. Fetch Detail Project (PENTING untuk inisialisasi Canvas)
  async function fetchProjectDetails(projectId) {
    loading.value = true;
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`);
      if (!res.ok) throw new Error("Project not found");
      projectData.value = await res.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  // 2. Fetch Resources (Assets, Scenes, etc)
  async function fetchAllProjectResources(projectId) {
    loading.value = true;
    error.value = null;
    try {
      const [fRes, aRes, sRes, pRes] = await Promise.all([
        fetch(`${API_URL}/folders/${projectId}`),
        fetch(`${API_URL}/assets/${projectId}`),
        fetch(`${API_URL}/scenes/project/${projectId}`),
        fetch(`${API_URL}/prefabs/${projectId}`)
      ]);

      folders.value = await fRes.json();
      assets.value = await aRes.json();
      scenes.value = await sRes.json();
      prefabs.value = await pRes.json();
    } catch (err) {
      console.error("❌ Error loading project resources:", err);
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  // 3. Fetch Detail Scene
  async function fetchScene(sceneId) {
    loading.value = true;
    try {
      const res = await fetch(`${API_URL}/scenes/${sceneId}`);
      if (!res.ok) throw new Error("Gagal mengambil data scene");
      currentScene.value = await res.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  return {
    projectData,
    folders,
    assets,
    scenes,
    prefabs,
    currentScene,
    loading,
    error,

    fetchProjectDetails,
    fetchAllProjectResources,
    fetchScene,
    
    API_URL,
    CDN_URL
  };
}
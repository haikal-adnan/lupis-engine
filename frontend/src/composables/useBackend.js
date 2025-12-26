import { ref } from "vue";

const API_URL = "https://api-lupis.calk.cloud";
const CDN_URL = "https://cdn-lupis.calk.cloud";

// State Global
const projectData = ref(null);
const folders = ref([]);
const assets = ref([]);
const scenes = ref([]);   
const prefabs = ref([]); // <--- Container Prefab
const currentScene = ref(null);

const loading = ref(false);
const error = ref(null);

export function useBackend() {

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

  async function fetchAllProjectResources(projectId) {
    loading.value = true;
    error.value = null;
    try {
      // Fetch Paralel: Folders, Assets, Scenes, DAN PREFABS
      const [fRes, aRes, sRes, pRes] = await Promise.all([
        fetch(`${API_URL}/folders/${projectId}`),
        fetch(`${API_URL}/assets/${projectId}`),
        fetch(`${API_URL}/scenes/project/${projectId}`),
        fetch(`${API_URL}/prefabs/${projectId}`) // Endpoint Prefab
      ]);

      folders.value = await fRes.json();
      assets.value = await aRes.json();
      scenes.value = await sRes.json();
      prefabs.value = await pRes.json(); // Simpan List Prefab
    } catch (err) {
      console.error("❌ Error loading project resources:", err);
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

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

  function resetState() {
      projectData.value = null;
      assets.value = [];
      scenes.value = [];
      prefabs.value = [];
      currentScene.value = null;
  }

  return {
    projectData, folders, assets, scenes, prefabs, currentScene,
    loading, error,
    fetchProjectDetails, fetchAllProjectResources, fetchScene, resetState,
    API_URL, CDN_URL
  };
}
import { ref } from "vue";

const API_URL = "http://api.lupis.calk.cloud"; // pakai https agar aman

export function useBackend() {
  const projects = ref([]);
  const assets = ref([]);
  const projectFiles = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchProjects() {
    try {
      loading.value = true;
      const res = await fetch(`${API_URL}/projects`);
      projects.value = await res.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAssets(projectId) {
    try {
      loading.value = true;
      const res = await fetch(`${API_URL}/assets/${projectId}`);
      assets.value = await res.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProjectFiles(projectId) {
    try {
      loading.value = true;
      const res = await fetch(`${API_URL}/projects/${projectId}/tree`);
      if (!res.ok) throw new Error("Gagal memuat struktur project");
      const json = await res.json();
      projectFiles.value = json;
    } catch (err) {
      console.error("❌ fetchProjectFiles error:", err);
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  return {
    API_URL,
    projects,
    assets,
    projectFiles,
    fetchProjects,
    fetchAssets,
    fetchProjectFiles,
    loading,
    error
  };
}
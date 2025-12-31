import { ref } from "vue";
import { getLocalAssetsByProject } from "@/services/assetService.js"; 
import { bus } from "@engine/Util/EventBus.js"; 

const API_URL = "https://api-lupis.calk.cloud";
const CDN_URL = "https://cdn-lupis.calk.cloud";

const projectData = ref(null);
const folders = ref([]);
const assets = ref([]); 
const scenes = ref([]);   
const prefabs = ref([]);
const currentScene = ref(null);

const loading = ref(false);
const error = ref(null);

// Helper untuk membuat Blob URL dari data IndexedDB
const hydrateLocalAsset = (asset) => {
  // Jika asset punya Blob tapi belum punya URL untuk ditampilkan/dirender
  if (asset.localBlob && !asset.fileUrl) {
    // KITA BUAT URL SEMENTARA DISINI
    asset.fileUrl = URL.createObjectURL(asset.localBlob);
  }
  return asset;
};

// Listener saat upload baru berhasil
bus.on("engine:load_asset", (newAsset) => {
  const exists = assets.value.find(a => a._id === newAsset._id);
  if (!exists) {
    // Hydrate dulu sebelum dimasukkan ke state
    const hydratedAsset = hydrateLocalAsset(newAsset);
    assets.value.push(hydratedAsset);
    
    console.log("UseBackend: New local asset added (Blob URL created)", hydratedAsset.name);
  }
});

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
      const [fRes, aResServer, sRes, pRes, localAssetsRaw] = await Promise.all([
        fetch(`${API_URL}/folders/${projectId}`),
        fetch(`${API_URL}/assets/${projectId}`),
        fetch(`${API_URL}/scenes/project/${projectId}`),
        fetch(`${API_URL}/prefabs/${projectId}`),
        getLocalAssetsByProject(projectId)
      ]);

      folders.value = await fRes.json();
      const serverAssets = await aResServer.json();
      scenes.value = await sRes.json();
      prefabs.value = await pRes.json();

      // --- PROSES HYDRATION (PENTING UNTUK RENDERER) ---
      // Loop semua asset lokal, ubah Blob menjadi Blob URL string
      const localAssetsHydrated = localAssetsRaw.map(hydrateLocalAsset);

      // Gabungkan
      assets.value = [...serverAssets, ...localAssetsHydrated];
      
      console.log(`Resources Loaded: ${serverAssets.length} server, ${localAssetsHydrated.length} local assets.`);

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
      // (Optional) Revoke URL untuk mencegah memory leak saat reset
      assets.value.forEach(a => {
          if (a.localBlob && a.fileUrl && a.fileUrl.startsWith('blob:')) {
              URL.revokeObjectURL(a.fileUrl);
          }
      });

      projectData.value = null;
      assets.value = [];
      scenes.value = [];
      prefabs.value = [];
      currentScene.value = null;
  }

  function refreshAssetsState(newAssets) {
     assets.value = newAssets;
  }

  return {
    projectData, folders, assets, scenes, prefabs, currentScene,
    loading, error,
    fetchProjectDetails, fetchAllProjectResources, fetchScene, resetState, refreshAssetsState,
    API_URL, CDN_URL
  };
}
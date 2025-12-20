import { ref, onUnmounted } from "vue";
import { useEditorState } from "@/composables/useEditorState.js";
import { useBackend } from "@/composables/useBackend.js";

export function usePreview() {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let pollInterval = null;
  let readyListener = null;
  let fallbackTimer = null;

  const { activeProjectId } = useEditorState();
  const { 
    CDN_URL, 
    projectData, 
    assets, 
    scenes, 
    currentScene, 
    fetchProjectDetails, 
    fetchAllProjectResources, 
    fetchScene 
  } = useBackend();

  async function getFreshRuntimeData() {
    if (!activeProjectId.value) {
      throw new Error("Project ID tidak ditemukan (activeProjectId null).");
    }

    // 1. Fetch Data Terbaru
    console.log("🔄 [usePreview] Fetching fresh data...");
    await Promise.all([
      fetchProjectDetails(activeProjectId.value),
      fetchAllProjectResources(activeProjectId.value)
    ]);

    // 2. Tentukan Scene
    let entrySceneId = null;
    const tempProject = projectData.value; 
    
    if (tempProject?.entryScene) {
      entrySceneId = tempProject.entryScene;
    } else if (tempProject?.meta?.entryScene) {
      entrySceneId = tempProject.meta.entryScene;
    } else if (scenes.value.length > 0) {
      entrySceneId = scenes.value[0]._id;
    }

    if (entrySceneId) {
      await fetchScene(entrySceneId);
    }

    if (!projectData.value || !currentScene.value) {
      throw new Error("Data Project/Scene dari backend tidak lengkap.");
    }

    const projectBaseUrl = `${CDN_URL}/projects/${activeProjectId.value}/`;

    // 3. Sanitasi Data (Hapus Reactivity Vue)
    // PENTING: Struktur ini harus lengkap!
    const cleanProject = JSON.parse(JSON.stringify(projectData.value));
    const cleanAssets = JSON.parse(JSON.stringify(assets.value || [])); // Default array kosong
    const cleanScene = JSON.parse(JSON.stringify(currentScene.value));

    // 4. SUSUN OBJECT UTAMA
    // Ini adalah object yang dibaca oleh preview.html
    const finalPayload = {
      mode: "runtime",
      baseURL: projectBaseUrl,
      // Properti ini WAJIB ada bernama 'initialData'
      initialData: {
        project: cleanProject,
        assets: cleanAssets,
        scene: cleanScene
      }
    };

    console.log("📦 [usePreview] Data Prepared:", finalPayload); // <--- Cek Console Editor saat klik preview
    return finalPayload;
  }

  async function openOrUpdatePreview() {
    try {
      const payload = await getFreshRuntimeData();

      // --- Window Management ---
      if (previewWindow.value && !previewWindow.value.closed) {
        previewWindow.value.postMessage({ type: "projectData", payload }, "*");
        previewWindow.value.focus();
        isPreviewing.value = true;
        startMonitoring();
        return previewWindow.value;
      }

      // Buka Window Baru
      previewWindow.value = window.open("/preview/preview.html", "LupisPreview", "width=1280,height=720,resizable=yes");
      isPreviewing.value = true;

      if (readyListener) window.removeEventListener("message", readyListener);
      
      readyListener = (ev) => {
        if (!ev.data || ev.data.type !== "previewReady") return;
        if (!previewWindow.value || previewWindow.value.closed) return;
        
        console.log("✅ [usePreview] Window Ready. Sending Payload...");
        // KIRIM PAYLOAD DI SINI
        previewWindow.value.postMessage({ type: "projectData", payload }, "*");
        
        window.removeEventListener("message", readyListener);
        readyListener = null;
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      };
      
      window.addEventListener("message", readyListener);

      // Fallback timer
      fallbackTimer = setTimeout(() => {
        if (!previewWindow.value || previewWindow.value.closed) return;
        console.warn("⚠️ [usePreview] Timeout. Sending payload forcibly.");
        previewWindow.value.postMessage({ type: "projectData", payload }, "*");
        if (readyListener) { window.removeEventListener("message", readyListener); readyListener = null; }
        fallbackTimer = null;
      }, 3000);

      startMonitoring();
      return previewWindow.value;

    } catch (error) {
      console.error("❌ [usePreview] Error:", error);
      alert("Gagal membuka preview: " + error.message);
      isPreviewing.value = false;
    }
  }

  function startMonitoring() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
      if (!previewWindow.value || previewWindow.value.closed) {
        previewWindow.value = null;
        isPreviewing.value = false;
        clearInterval(pollInterval);
        pollInterval = null;
        if (readyListener) { window.removeEventListener("message", readyListener); readyListener = null; }
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      }
    }, 1000);
  }

  function closePreview() {
    if (previewWindow.value && !previewWindow.value.closed) previewWindow.value.close();
    previewWindow.value = null;
    isPreviewing.value = false;
    if (pollInterval) clearInterval(pollInterval);
    if (readyListener) { window.removeEventListener("message", readyListener); readyListener = null; }
    if (fallbackTimer) clearTimeout(fallbackTimer);
  }

  onUnmounted(() => {
    closePreview();
  });

  return { isPreviewing, openOrUpdatePreview, closePreview };
}
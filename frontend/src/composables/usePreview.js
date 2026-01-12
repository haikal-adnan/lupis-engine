import { ref, onUnmounted } from "vue";
import { db } from "@/db/index.js"; // Akses langsung ke Dexie
import { useEditorState } from "@/composables/useEditorState.js";
import { useBackend } from "@/composables/useBackend.js";
import { useSyncManager } from "@/composables/useSyncManager.js"; // Untuk flush changes

export function usePreview() {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let pollInterval = null;
  let readyListener = null;
  let fallbackTimer = null;

  const { activeProjectId } = useEditorState();
  const { CDN_URL, currentScene } = useBackend();
  const { saveLocal, syncStatus } = useSyncManager();

  // Fungsi untuk mengambil data MENTAH dari IndexedDB
  async function getFreshRuntimeData() {
    if (!activeProjectId.value) {
      throw new Error("Project ID tidak ditemukan.");
    }

    console.log("💾 [usePreview] Preparing Local Data...");

    // 1. FLUSH RAM TO DISK (PENTING!)
    // Jika status masih RED (Unsaved in RAM), simpan dulu ke IndexedDB
    // agar preview menampilkan perubahan terakhir user.
    if (syncStatus.value === 'RED' && currentScene.value) {
        console.log("⚠️ [usePreview] Unsaved changes detected. Auto-saving to Local DB...");
        await saveLocal(currentScene.value._id);
    }

    const [localProject, localAssets] = await Promise.all([
        db.projects.get(activeProjectId.value),
        db.assets.where('projectId').equals(activeProjectId.value).toArray()
    ]);

    if (!localProject) throw new Error("Project data not found in Local DB");

    // 3. Tentukan Scene mana yang akan dimainkan
    // Prioritas: Scene yang sedang dibuka di editor -> Entry Scene di Project -> Scene pertama di DB
    let targetSceneId = null;

    if (currentScene.value) {
        targetSceneId = currentScene.value._id; // Preview scene yang sedang diedit
    } else if (localProject.meta?.entryScene) {
        targetSceneId = localProject.meta.entryScene;
    } else {
        // Fallback: ambil scene pertama yang ketemu
        const firstScene = await db.scenes.where('projectId').equals(activeProjectId.value).first();
        if (firstScene) targetSceneId = firstScene._id;
    }

    if (!targetSceneId) throw new Error("No Scene found to preview.");

    // 4. Ambil Scene Data dari IndexedDB
    const localScene = await db.scenes.get(targetSceneId);
    if (!localScene) throw new Error(`Scene ${targetSceneId} not found in Local DB`);

    // 5. Construct Payload
    // Data dari Dexie sudah berupa Plain JS Object (Raw), tidak perlu toRaw() atau JSON hack.
    const projectBaseUrl = `${CDN_URL}/projects/${activeProjectId.value}/`;

    const finalPayload = {
      mode: "runtime",
      baseURL: projectBaseUrl,
      initialData: {
        project: localProject,
        assets: localAssets || [],
        scene: localScene
      }
    };

    console.log("📦 [usePreview] Payload Ready (From Dexie):", finalPayload);
    return finalPayload;
  }

  async function openOrUpdatePreview() {
    try {
      const payload = await getFreshRuntimeData();

      if (previewWindow.value && !previewWindow.value.closed) {
        previewWindow.value.postMessage({ type: "projectData", payload }, "*");
        previewWindow.value.focus();
        isPreviewing.value = true;
        startMonitoring();
        return previewWindow.value;
      }

      previewWindow.value = window.open("/preview/preview.html", "LupisPreview", "width=1280,height=720,resizable=yes");
      isPreviewing.value = true;

      if (readyListener) window.removeEventListener("message", readyListener);
      
      readyListener = (ev) => {
        if (!ev.data || ev.data.type !== "previewReady") return;
        if (!previewWindow.value || previewWindow.value.closed) return;
        
        console.log("✅ [usePreview] Window Ready. Sending Payload...");
        previewWindow.value.postMessage({ type: "projectData", payload }, "*");
        
        cleanupListeners();
      };
      
      window.addEventListener("message", readyListener);

      fallbackTimer = setTimeout(() => {
        if (!previewWindow.value || previewWindow.value.closed) return;
        console.warn("⚠️ [usePreview] Timeout waiting for ready signal. Sending payload forcibly.");
        previewWindow.value.postMessage({ type: "projectData", payload }, "*");
        cleanupListeners();
      }, 3000);

      startMonitoring();
      return previewWindow.value;

    } catch (error) {
      console.error("❌ [usePreview] Error:", error);
      alert("Gagal membuka preview: " + error.message);
      isPreviewing.value = false;
    }
  }

  function cleanupListeners() {
    if (readyListener) { window.removeEventListener("message", readyListener); readyListener = null; }
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
  }

  function startMonitoring() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
      if (!previewWindow.value || previewWindow.value.closed) {
        previewWindow.value = null;
        isPreviewing.value = false;
        clearInterval(pollInterval);
        pollInterval = null;
        cleanupListeners();
      }
    }, 1000);
  }

  function closePreview() {
    if (previewWindow.value && !previewWindow.value.closed) previewWindow.value.close();
    previewWindow.value = null;
    isPreviewing.value = false;
    if (pollInterval) clearInterval(pollInterval);
    cleanupListeners();
  }

  onUnmounted(() => {
    closePreview();
  });

  return { isPreviewing, openOrUpdatePreview, closePreview };
}
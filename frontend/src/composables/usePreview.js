import { ref, onUnmounted } from "vue";

export function usePreview(defaultBasePath = "/projects/template/") {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let pollInterval = null;
  let readyListener = null;
  let fallbackTimer = null;

  function normalizeBasePath(input) {
    let basePath = typeof input === "string" ? input : defaultBasePath;
    return basePath.endsWith("/") ? basePath : basePath + "/";
  }

  async function loadProject(basePathInput) {
    const basePath = normalizeBasePath(basePathInput);
    const project = await fetch(basePath + "project.config.json").then(r => r.json());
    const assetsMap = await fetch(basePath + "assets.map.json").then(r => r.json());
    const sceneName = project.meta?.entryScene || project.entryScene || "level_1";
    const scene = await fetch(`${basePath}scenes/${sceneName}.json`).then(r => r.json());
    return { basePath, project, assetsMap, scene, sceneName };
  }

  async function openOrUpdatePreview(basePathInput) {
    const payload = await loadProject(basePathInput);

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
      previewWindow.value.postMessage({ type: "projectData", payload }, "*");
      window.removeEventListener("message", readyListener);
      readyListener = null;
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    };
    window.addEventListener("message", readyListener);

    fallbackTimer = setTimeout(() => {
      if (!previewWindow.value || previewWindow.value.closed) return;
      previewWindow.value.postMessage({ type: "projectData", payload }, "*");
      if (readyListener) { window.removeEventListener("message", readyListener); readyListener = null; }
      fallbackTimer = null;
    }, 2000);

    startMonitoring();
    return previewWindow.value;
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
    }, 500);
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
    if (pollInterval) clearInterval(pollInterval);
    if (readyListener) window.removeEventListener("message", readyListener);
    if (fallbackTimer) clearTimeout(fallbackTimer);
  });

  return { isPreviewing, openOrUpdatePreview, closePreview };
}

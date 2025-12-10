import { ref, onUnmounted } from "vue";

export function usePreview() {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let pollInterval = null;

  async function loadProject() {
    const project = await fetch("/projects/ProjectTemplate/project.json").then(r => r.json());
    const scene = await fetch(`/projects/ProjectTemplate/scenes/${project.startScene}.json`).then(r => r.json());
    return { project, scene };
  }

  async function openOrUpdatePreview() {
    const payload = await loadProject();

    if (previewWindow.value && !previewWindow.value.closed) {
      previewWindow.value.postMessage({ type: "projectData", payload }, "*");
      previewWindow.value.focus();
      return;
    }

    previewWindow.value = window.open(
      "/preview/preview.html",
      "LupisPreview",
      "width=960,height=540,resizable=yes"
    );
    isPreviewing.value = true;

    const sendCheck = setInterval(() => {
      if (!previewWindow.value || previewWindow.value.closed) {
        clearInterval(sendCheck);
        return;
      }
      previewWindow.value.postMessage({ type: "projectData", payload }, "*");
      clearInterval(sendCheck);
    }, 500);

    startMonitoring();
  }

  function startMonitoring() {
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(() => {
      if (previewWindow.value && previewWindow.value.closed) {
        previewWindow.value = null;
        isPreviewing.value = false;
        clearInterval(pollInterval);
      }
    }, 500);
  }

  onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
  });

  return {
    isPreviewing,
    openOrUpdatePreview
  };
}
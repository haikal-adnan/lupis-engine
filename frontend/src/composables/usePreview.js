import { ref, onMounted, onUnmounted } from "vue";
import { prepareEngineData } from "@/services/engine/EngineBootstrapper.js";
import { useProjectStore } from '@/stores/useProjectStore.js';
import { useEditorStore } from "@/stores/useEditorStore.js";
import { CDN_URL } from "@/services/api/useFetchProjectById.js";

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

export function usePreview() {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let channel = null;
  let checkWindowInterval = null;
  
  const projectStore = useProjectStore();
  const editorStore = useEditorStore();
  const initChannel = () => {
    if (channel) return;

    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channel.onmessage = async (event) => {
      const { type } = event.data;
      if (type === "REQUEST_LATEST_DATA") {
        await sendDataToPreview();
      }
    };
  };

  const sendDataToPreview = async () => {
    try {
      const rawData = await prepareEngineData();
      
      const currentProjectId = editorStore.activeProjectId;
      
      const fullBaseUrl = `${CDN_URL}/projects/${currentProjectId}/`

      channel.postMessage({
        type: "SCENE_UPDATE",
        payload: rawData,
        cdnUrl: fullBaseUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const openOrUpdatePreview = async () => {
    initChannel();

    if (previewWindow.value && !previewWindow.value.closed) {
      await sendDataToPreview();
      previewWindow.value.focus();
    } else {
      const uiSettings = projectStore.project?.settings?.ui || {};
      const width = uiSettings.width || 1280;   
      const height = uiSettings.height || 720; 

      previewWindow.value = window.open(
        "/preview/index.html", 
        "LupisPreview",
        `width=${width},height=${height},resizable=yes`
      );
      
      isPreviewing.value = true;
      startWindowMonitoring();
    }
  };

  const startWindowMonitoring = () => {
    if (checkWindowInterval) clearInterval(checkWindowInterval);
    
    checkWindowInterval = setInterval(() => {
      if (previewWindow.value && previewWindow.value.closed) {
        isPreviewing.value = false;
        clearInterval(checkWindowInterval);
        previewWindow.value = null;
      }
    }, 1000);
  };

  onMounted(() => {
    initChannel();
  });

  onUnmounted(() => {
    if (channel) {
      channel.close();
      channel = null;
    }
    if (checkWindowInterval) clearInterval(checkWindowInterval);
  });

  return {
    isPreviewing,
    openOrUpdatePreview,
  };
}
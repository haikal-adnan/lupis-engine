import { ref, onMounted, onUnmounted } from "vue";
import { prepareEngineData } from "@/services/engine/EngineBootstrapper.js";

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

export function usePreview() {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let channel = null;
  let checkWindowInterval = null;

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
      const payload = JSON.parse(JSON.stringify(rawData));

      channel.postMessage({
        type: "SCENE_UPDATE",
        payload: payload,
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
      previewWindow.value = window.open(
        "/preview/index.html", 
        "LupisPreview",
        "width=1280,height=720,resizable=yes"
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
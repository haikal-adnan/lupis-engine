import { ref, watch, onMounted, onUnmounted, getCurrentInstance } from "vue";
import { prepareEngineData } from "@engines/engines.js";
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

export function usePreview() {
  const isPreviewing = ref(false);
  const previewWindow = ref(null);
  let channel = null;
  let checkWindowInterval = null;

  const projectStore = useProjectStore();
  const workspaceStore = useWorkspaceStore();

  const getChannelName = (id) => {
    const projId = id ?? workspaceStore.activeProjectId ?? projectStore.project?.id;
    return projId ? `${BROADCAST_CHANNEL_NAME}_${projId}` : BROADCAST_CHANNEL_NAME;
  };

  const getWindowName = (id) => {
    const projId = id ?? workspaceStore.activeProjectId ?? projectStore.project?.id;
    const safeId = projId ? String(projId).replace(/[^a-zA-Z0-9_-]/g, "_") : "default";
    return `LupisPreview_${safeId}`;
  };

  const getPreviewUrl = (id) => {
    const projId = id ?? workspaceStore.activeProjectId ?? projectStore.project?.id;
    return projId ? `/preview/index.html?projectId=${encodeURIComponent(projId)}` : "/preview/index.html";
  };

  const initChannel = () => {
    const desiredChannelName = getChannelName();
    if (channel && channel.name === desiredChannelName) return;

    if (channel) {
      channel.close();
      channel = null;
    }

    channel = new BroadcastChannel(desiredChannelName);

    channel.onmessage = async (event) => {
      const { type, projectId } = event.data || {};
      const currentId = workspaceStore.activeProjectId ?? projectStore.project?.id;

      if (projectId && currentId && String(projectId) !== String(currentId)) {
        return;
      }

      if (type === "REQUEST_LATEST_DATA") {
        isPreviewing.value = true;
        await sendDataToPreview();
      } else if (type === "PREVIEW_READY" || type === "PREVIEW_PONG") {
        isPreviewing.value = true;
      } else if (type === "PREVIEW_CLOSED") {
        isPreviewing.value = false;
        previewWindow.value = null;
        if (checkWindowInterval) {
          clearInterval(checkWindowInterval);
          checkWindowInterval = null;
        }
      }
    };

    channel.postMessage({
      type: "PREVIEW_PING",
      projectId: workspaceStore.activeProjectId ?? projectStore.project?.id,
    });
  };

  const sendDataToPreview = async () => {
    try {
      const rawData = await prepareEngineData();
      
      const currentProjectId = workspaceStore.activeProjectId ?? projectStore.project?.id;

      if (!currentProjectId) {
        throw new Error("[Preview] Invalid Project ID.");
      }

      const opfsContext = {
        projectId: String(currentProjectId)
      };

      if (!channel) {
        initChannel();
      }

      channel.postMessage({
        type: "SCENE_UPDATE",
        payload: rawData,
        opfsContext: opfsContext,
        projectId: String(currentProjectId),
      });
    } catch (error) {
      console.error("[usePreview] Failed to send preview data:", error);
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

      const currentProjectId = workspaceStore.activeProjectId ?? projectStore.project?.id;
      const windowName = getWindowName(currentProjectId);
      const previewUrl = getPreviewUrl(currentProjectId);

      previewWindow.value = window.open(
        previewUrl, 
        windowName,
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
        checkWindowInterval = null;
        previewWindow.value = null;
      }
    }, 1000);
  };

  watch(
    () => workspaceStore.activeProjectId,
    (newId, oldId) => {
      if (newId !== oldId) {
        if (checkWindowInterval) {
          clearInterval(checkWindowInterval);
          checkWindowInterval = null;
        }
        isPreviewing.value = false;
        previewWindow.value = null;
        initChannel();
      }
    }
  );

  if (getCurrentInstance()) {
    onMounted(() => {
      initChannel();
    });

    onUnmounted(() => {
      if (channel) {
        channel.close();
        channel = null;
      }
      if (checkWindowInterval) {
        clearInterval(checkWindowInterval);
        checkWindowInterval = null;
      }
    });
  }

  return {
    isPreviewing,
    openOrUpdatePreview,
    sendDataToPreview,
    initChannel,
    getChannelName,
    getWindowName,
    getPreviewUrl,
  };
}
import { ref, onUnmounted, nextTick } from 'vue';
import { startEngine } from "@core/RuntimePreview.js";
import { prepareEngineData } from "@engines/engines.js";
import { useProjectActions } from '@projects/projects.js';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useUserStore } from '@users/users.js';

export function usePlayLogic() {
  const gameCanvas = ref(null);
  const isLoading = ref(false);
  const isPlaying = ref(false);
  const error = ref(null);
  
  const loadingMessage = ref('');
  const loadingProgress = ref(0);

  let engineInstance = null;
  let resizeListener = null;

  const { getProjectById } = useProjectActions();
  const projectStore = useProjectStore();
  const workspaceStore = useWorkspaceStore();
  const userStore = useUserStore();

  const setCheckpoint = (message, progress) => {
    loadingMessage.value = message;
    loadingProgress.value = progress;
    console.log(`[Lupis Engine Local] ${message} (${progress}%)`);
  };

  const setupCanvasResponsiveness = (refWidth = 1920, refHeight = 1080) => {
    if (!gameCanvas.value) return;

    const canvas = gameCanvas.value;
    canvas.width = refWidth;
    canvas.height = refHeight;

    const onResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const parentW = parent.clientWidth;
      const parentH = parent.clientHeight;
      const targetRatio = refWidth / refHeight;
      const parentRatio = parentW / parentH;

      let finalW, finalH;

      if (parentRatio > targetRatio) {
        finalH = parentH;
        finalW = finalH * targetRatio;
      } else {
        finalW = parentW;
        finalH = finalW / targetRatio;
      }

      canvas.style.width = `${finalW}px`;
      canvas.style.height = `${finalH}px`;
    };

    window.addEventListener('resize', onResize);
    resizeListener = onResize;
    onResize(); 
  };

  const startGame = async (targetProjectId) => {
    if (!gameCanvas.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    setCheckpoint("Initializing project loading...", 10);

    try {
      await nextTick();

      const projectId = targetProjectId || workspaceStore.activeProjectId;
      if (!projectId) {
        throw new Error("Project ID is invalid or not found.");
      }

      let payload = null;

      if (projectStore.isProjectLoaded && projectStore.project?.id === projectId) {
        setCheckpoint("Preparing payload...", 30);
        payload = await prepareEngineData();
      } else {
        setCheckpoint("Loading project...", 30);
        await projectStore.loadProject(projectId);
        payload = await prepareEngineData();
      }

      if (!payload || !payload.project) {
        throw new Error("OPFS project data not found or corrupt.");
      }

      const userId = userStore.currentUser?.id;
      const opfsContext = {
        userId: userId ? String(userId) : '',
        projectId: String(projectId)
      };

      const uiSettings = payload.project?.settings?.ui || payload.scene?.settings?.ui || {};
      const refW = uiSettings.width || 1280;
      const refH = uiSettings.height || 720;
      
      setupCanvasResponsiveness(refW, refH);

      setCheckpoint("Starting Lupis Engine...", 80);

      engineInstance = await startEngine(
        gameCanvas.value, 
        opfsContext, 
        "runtime", 
        payload
      );

      if (!engineInstance) throw new Error("Failed to initialize Lupis Engine.");

      setTimeout(() => {
        isPlaying.value = true;
        isLoading.value = false;
        if (gameCanvas.value) gameCanvas.value.focus(); 
      }, 300);

    } catch (err) {
      console.error("[usePlayLogic] Error starting game:", err);
      error.value = err.message || "Failed to load game from OPFS.";
      isLoading.value = false;
    }
  };

  const stopGame = () => {
    if (engineInstance) {
      const game = engineInstance.game || engineInstance;

      const audioCtx = game.audioSystem?.context;
      if (audioCtx && typeof audioCtx.close === 'function' && audioCtx.state !== 'closed') {
        audioCtx.close().catch(err => {
          console.error("[Lupis Engine] Failed to close AudioContext:", err);
        });
      }

      if (typeof game.destroy === 'function') {
        game.destroy();
      } else if (game.loop && typeof game.loop.stop === 'function') {
        game.loop.stop();
      }

      engineInstance = null;
    }
    
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener);
      resizeListener = null;
    }
    
    isPlaying.value = false;
    loadingProgress.value = 0;
  };

  onUnmounted(() => {
    stopGame();
  });

  return {
    gameCanvas,
    isLoading,
    isPlaying,
    error,
    loadingMessage,
    loadingProgress,
    startGame,
    stopGame
  };
}
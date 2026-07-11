import { ref, onUnmounted, nextTick } from 'vue';
import { startEngine } from "@engines/main.js";
import { useGameBrowserBackend } from '@/services/api/backend/useGameBrowserBackend.js';
import { CDN_URL } from "@/services/api/useFetchProjectById.js";

export function usePlayLogic() {
  const gameCanvas = ref(null);
  const isLoading = ref(false);
  const isPlaying = ref(false);
  const error = ref(null);
  
  const loadingMessage = ref('');
  const loadingProgress = ref(0);

  let engineInstance = null;
  let resizeListener = null;

  const { getGameResources } = useGameBrowserBackend();

  const setCheckpoint = (message, progress) => {
    loadingMessage.value = message;
    loadingProgress.value = progress;
    console.log(`[Lupis Engine] ${message} (${progress}%)`);
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

  const startGame = async (publishedId) => {
    if (!gameCanvas.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    setCheckpoint("Menginisialisasi pemuatan...", 10);

    try {
      await nextTick();

      setCheckpoint("Mengunduh metadata proyek...", 20);
      
      const resources = await getGameResources(publishedId);
      const projectId = resources.project?._id || resources.projectId || resources.scenes?.[0]?.projectId;

      if (!projectId) {
        throw new Error("Data project tidak valid atau kosong.");
      }

      const runtimeData = {
        project: resources.project || {}, 
        scenes: resources.scenes || [],
        assets: resources.assets || [],
        prefabs: resources.prefabs || [],
        scripts: resources.scripts || [],
        editorConfig: {},
        onProgress: (message, progress) => {
          const actualProgress = 30 + Math.floor(progress * 0.7);
          setCheckpoint(message, actualProgress);
        }
      };

      const refW = resources.project?.settings?.ui?.width || 1920;
      const refH = resources.project?.settings?.ui?.height || 1080;
      
      setupCanvasResponsiveness(refW, refH);

      const cdnUrl = `${CDN_URL}/published/${projectId}/`;

      engineInstance = await startEngine(gameCanvas.value, cdnUrl, "runtime", runtimeData);

      if (!engineInstance) throw new Error("Gagal menginisialisasi Lupis Engine.");

      setTimeout(() => {
        isPlaying.value = true;
        isLoading.value = false;
        if (gameCanvas.value) gameCanvas.value.focus(); 
      }, 500);

    } catch (err) {
      console.error("PlayLogic Error:", err);
      error.value = err.message || "Gagal memuat game.";
      isLoading.value = false;
    }
  };

  const stopGame = () => {
    if (engineInstance) {
      const game = engineInstance.game || engineInstance;

      const audioCtx = game.audioSystem?.context;
      if (audioCtx && typeof audioCtx.close === 'function' && audioCtx.state !== 'closed') {
        audioCtx.close().then(() => {
          console.log("[Lupis Engine] AudioContext closed successfully.");
        }).catch(err => {
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
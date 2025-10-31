import Game from "./World/Game.js";
import GameLoader from "./Loader/GameLoader.js";

/**
 * Start Lupis Engine di 2 canvas.
 * @param {Object} opts
 * @param {HTMLCanvasElement} opts.glCanvas
 * @param {HTMLCanvasElement} opts.uiCanvas
 * @param {string} [opts.project='game-demo']
 * @param {string} [opts.level='level1']
 * @param {string} [opts.apiBase='https://api.lupis.calk.cloud/api']
 */
export async function startEngine({
  glCanvas,
  uiCanvas,
  project = "game-demo",
  level = "level1",
  apiBase = "https://api.lupis.calk.cloud/api",
} = {}) {
  if (!glCanvas || !uiCanvas) {
    throw new Error("startEngine: glCanvas & uiCanvas wajib ada");
  }

  // Hindari styling global: ukuran & resize dikelola host (CanvasStage)
  const loader = new GameLoader({ apiBase, project, level });
  const game = new Game();

  await loader.initializeGame(glCanvas, uiCanvas, { project, level, apiBase });
  loader.gameStart();

  // API minimal untuk host
  return {
    loader,
    game,
    destroy() {
      try { game.loop?.stop?.(); } catch {}
      try {
        // jika InputHandler/TouchHandler punya remover, panggil di sini
        game.input?.removeListeners?.();
        game.touch?.removeListeners?.();
      } catch {}
    },
  };
}

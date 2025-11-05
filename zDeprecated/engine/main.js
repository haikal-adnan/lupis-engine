// src/engine/embed.js
import Game from "./World/Game.js";
import GameLoader from "./Loader/GameLoader.js";

export const game = new Game();

export async function startEngine(glCanvas, uiCanvas) {
  // const glCanvas = document.getElementById("glCanvas");
  // const uiCanvas = document.getElementById("uiCanvas");
  if (!glCanvas || !uiCanvas)
    throw new Error("Canvas element(s) not found in DOM");

  const W = 1920, H = 1080;
  [glCanvas, uiCanvas].forEach(c => { c.width = W; c.height = H; });

  const resizeCanvas = () => {
    const r = window.innerWidth / window.innerHeight;
    const g = W / H;
    const useH = r > g;
    const dw = useH ? window.innerHeight * g : window.innerWidth;
    const dh = useH ? window.innerHeight : window.innerWidth / g;
    [glCanvas, uiCanvas].forEach(c => {
      Object.assign(c.style, {
        width: dw + "px",
        height: dh + "px",
        margin: "auto",
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0
      });
    });
  };
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const loader = new GameLoader();

  await loader.initializeGame();
  loader.gameStart();

  console.log("🎮 Engine berhasil dijalankan di", glId, uiId);
}

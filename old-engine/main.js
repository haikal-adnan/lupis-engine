// src/engine/main.js
import Game from "./Core/Game.js";
import GameLoader from "./Loader/GameLoader.js";

export const game = new Game();

export async function startEngine(glId, mode = "runtime") {
  const glCanvas = document.getElementById(glId);
  
  if (!glCanvas)
    throw new Error("Canvas element(s) not found in DOM");

  const W = 1920, H = 1080;
  [glCanvas].forEach(c => { c.width = W; c.height = H; });

  const resizeCanvas = () => {
    const r = window.innerWidth / window.innerHeight;
    const g = W / H;
    const useH = r > g;
    const dw = useH ? window.innerHeight * g : window.innerWidth;
    const dh = useH ? window.innerHeight : window.innerWidth / g;
    [glCanvas].forEach(c => {
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
  await loader.initializeGame(glCanvas, mode);
  loader.gameStart();

}

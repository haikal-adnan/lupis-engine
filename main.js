import Config from "./Config/Config.js";
import Game from "./World/Game.js";
import GameLoader from "./Loader/GameLoader.js";

const glCanvas = document.getElementById("glCanvas");
const uiCanvas = document.getElementById("uiCanvas");

document.addEventListener("wheel", e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
["gesturestart", "gesturechange", "gestureend"].forEach(ev =>
  document.addEventListener(ev, e => e.preventDefault())
);
window.addEventListener("touchmove", e => { if (e.scale !== 1) e.preventDefault(); }, { passive: false });

let meta = document.querySelector("meta[name=viewport]");
if (!meta) {
  meta = document.createElement("meta");
  meta.name = "viewport";
  document.head.appendChild(meta);
}
meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

const W = Config.VIRTUAL_WIDTH, H = Config.VIRTUAL_HEIGHT;
[glCanvas, uiCanvas].forEach(c => { c.width = W; c.height = H; });

function resizeCanvas() {
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
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

export const loader = new GameLoader();
export const game = new Game();

(async () => {
  await loader.initializeGame();
  loader.gameStart();
})();

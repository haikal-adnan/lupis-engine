import Config from "./Config/Config.js";
import Game from "./World/Game.js";
import GameLoader from "./Loader/GameLoader.js";

const glCanvas = document.getElementById("glCanvas");
const uiCanvas = document.getElementById("uiCanvas");

// 🔒 NONAKTIFKAN ZOOM DAN SCROLL
document.addEventListener("wheel", (e) => {
  if (e.ctrlKey) e.preventDefault(); // Ctrl + scroll
}, { passive: false });

document.addEventListener("gesturestart", (e) => e.preventDefault()); // Safari pinch zoom
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());

// 🔒 Nonaktifkan pinch zoom (mobile)
window.addEventListener("touchmove", (e) => {
  if (e.scale !== 1) e.preventDefault();
}, { passive: false });

// 🔒 Set viewport meta ke fixed scale
const viewportMeta = document.querySelector("meta[name=viewport]");
if (viewportMeta) {
  viewportMeta.setAttribute(
    "content",
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  );
} else {
    // jika belum ada, buat elemen baru
  const meta = document.createElement("meta");
  meta.name = "viewport";
  meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
  document.head.appendChild(meta);
}

// ===============================
//  CONFIGURASI CANVAS FIXED SIZE
// ===============================
const FIXED_WIDTH = Config.VIRTUAL_WIDTH;
const FIXED_HEIGHT = Config.VIRTUAL_HEIGHT;

// set resolusi internal tetap
glCanvas.width = FIXED_WIDTH;
glCanvas.height = FIXED_HEIGHT;
uiCanvas.width = FIXED_WIDTH;
uiCanvas.height = FIXED_HEIGHT;

// ===============================
//  FUNGSI RESIZE LETTERBOX
// ===============================
function resizeCanvas() {
  const windowRatio = window.innerWidth / window.innerHeight;
  const gameRatio = FIXED_WIDTH / FIXED_HEIGHT;

  let displayWidth, displayHeight;

  if (windowRatio > gameRatio) {
    // layar lebih lebar → tinggi jadi patokan
    displayHeight = window.innerHeight;
    displayWidth = window.innerHeight * gameRatio;
  } else {
    // layar lebih tinggi → lebar jadi patokan
    displayWidth = window.innerWidth;
    displayHeight = window.innerWidth / gameRatio;
  }

  // terapkan ke style (bukan internal size)
  glCanvas.style.width = displayWidth + "px";
  glCanvas.style.height = displayHeight + "px";
  uiCanvas.style.width = displayWidth + "px";
  uiCanvas.style.height = displayHeight + "px";

  // center (letterbox)
  [glCanvas, uiCanvas].forEach((canvas) => {
    canvas.style.margin = "auto";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.right = "0";
    canvas.style.bottom = "0";
  });
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===============================
//  INISIALISASI GAME
// ===============================
export const loader = new GameLoader();
export const game = new Game();

(async () => {
  await loader.initializeGame();
  loader.gameStart();
})();

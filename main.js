import Config from "./Config/Config.js";
import Game from "./Entity/Game.js";
import GameLoader from "./Loader/GameLoader.js";

const glCanvas = document.getElementById("glCanvas");
const uiCanvas = document.getElementById("uiCanvas");

// const FIXED_WIDTH = 1920;
// const FIXED_HEIGHT = 1080;

const FIXED_WIDTH = Config.VIRTUAL_WIDTH;
const FIXED_HEIGHT = Config.VIRTUAL_HEIGHT;

// set resolusi internal fixed
glCanvas.width = FIXED_WIDTH;
glCanvas.height = FIXED_HEIGHT;
uiCanvas.width = FIXED_WIDTH;
uiCanvas.height = FIXED_HEIGHT;

// fungsi resize agar canvas scale sesuai layar
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

  // terapkan ke style (bukan width/height internal)
  glCanvas.style.width = displayWidth + "px";
  glCanvas.style.height = displayHeight + "px";
  uiCanvas.style.width = displayWidth + "px";
  uiCanvas.style.height = displayHeight + "px";

  // center (letterbox effect)
  glCanvas.style.margin = "auto";
  uiCanvas.style.margin = "auto";
  glCanvas.style.position = "absolute";
  uiCanvas.style.position = "absolute";
  glCanvas.style.top = "0";
  uiCanvas.style.top = "0";
  glCanvas.style.left = "0";
  uiCanvas.style.left = "0";
  glCanvas.style.right = "0";
  uiCanvas.style.right = "0";
  glCanvas.style.bottom = "0";
  uiCanvas.style.bottom = "0";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// jalankan game
export const loader = new GameLoader();

export const game = new Game();

(async () => {
  await loader.initializeGame();
  loader.gameStart();
})();


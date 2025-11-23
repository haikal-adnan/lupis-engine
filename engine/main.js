// startEngine.js
import Game from "./Core/Game.js";
import GameLoader from "./Core/GameLoader.js";

export const game = new Game();

export async function startEngine(canvasId, mode = "editor", baseURL = "./") {
    const canvas = document.querySelector(`#${canvasId}`);

    const resizeEditor = () => {
        const dpr = window.devicePixelRatio || 1;

        // CSS size (layout)
        canvas.style.width  = "100vw";
        canvas.style.height = "100vh";

        // Force DOM update
        const rect = canvas.getBoundingClientRect();

        // Internal resolution
        canvas.width  = Math.floor(rect.width  * dpr);
        canvas.height = Math.floor(rect.height * dpr);

        canvas.style.position = "absolute";
        canvas.style.top = 0;
        canvas.style.left = 0;
        canvas.style.margin = 0;
        canvas.style.padding = 0;
        canvas.style.boxSizing = "border-box";
    };

    if (mode === "editor") {
        window.addEventListener("resize", resizeEditor);
        resizeEditor();
    }

    // RUNTIME MODE tetap sama seperti sebelumnya (16:9 letterbox)
    // … boleh tetap menggunakan kode lama kamu di sini

    const loader = new GameLoader();
    await loader.initializeGame(game, canvas, mode, baseURL);
    loader.start(game);
}

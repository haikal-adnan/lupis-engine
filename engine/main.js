// engine/startEngine.js
import Game from "./Core/Game.js";
import GameLoader from "./Core/GameLoader.js";

export const game = new Game();

export async function startEngine(canvasId, mode = "editor", baseURL = "./") {
    const canvas = document.querySelector(`#${canvasId}`);

    const resizeEditor = () => {
        const dpr = window.devicePixelRatio || 1;

        canvas.style.width  = "100%";
        canvas.style.height = "100%";

        const rect = canvas.getBoundingClientRect();

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

    const loader = new GameLoader();
    await loader.initializeGame(game, canvas, mode, baseURL);
    loader.start(game);
}

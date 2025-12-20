import Game from "./Core/Game.js";
import GameLoader from "./Core/GameLoader.js";

export const game = new Game();

export async function startEngine(canvasId, mode = "editor", baseURL = "./", initialData = {}) {
    const canvas = document.getElementById(canvasId) || document.querySelector(`#${canvasId}`);

    if (!canvas) {
        console.error(`❌ [Main] Canvas element with ID '${canvasId}' not found.`);
        return;
    }
    
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.margin = "0";
    canvas.style.padding = "0";
    canvas.style.boxSizing = "border-box";

    canvas.oncontextmenu = (e) => e.preventDefault();

    const loader = new GameLoader();

    try {
        console.log(`🚀 [Main] Starting Engine in '${mode}' mode...`);
        
        await loader.initializeGame(game, canvas, mode, baseURL, initialData);
        
        loader.start(game);
        
    } catch (error) {
        console.error("❌ [Main] Fatal Error: Failed to start engine.", error);
    }
}
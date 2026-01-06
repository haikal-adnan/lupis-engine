import Game from "./Core/Game.js";
import GameLoader from "./Core/GameLoader.js";
import { bus } from "./Util/EventBus.js";

export const game = new Game();

export async function startEngine(canvasSource, mode = "editor", baseURL = "./", initialData = {}) {
    let canvas;

    if (typeof canvasSource === 'string') {
        canvas = document.getElementById(canvasSource);
    } else {
        canvas = canvasSource;
    }

    if (!canvas) {
        console.error(`❌ [Main] Canvas element not found.`);
        return null;
    }
    
    Object.assign(canvas.style, {
        width: "100%", height: "100%", display: "block",
        position: "absolute", top: "0", left: "0",
        margin: "0", padding: "0", boxSizing: "border-box"
    });

    canvas.oncontextmenu = (e) => e.preventDefault();

    const loader = new GameLoader();

    try {
        console.log(`🚀 [Main] Starting Engine in '${mode}' mode...`);
        
        await loader.initializeGame(game, canvas, mode, baseURL, initialData);
        loader.start(game);
        
        return { game, bus };
        
    } catch (error) {
        console.error("❌ [Main] Fatal Error: Failed to start engine.", error);
        return null;
    }
}
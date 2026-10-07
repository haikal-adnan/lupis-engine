import Game from "./Core/Game.js";
import { bus } from "./Util/EventBus.js";
import EditorLoader from "./Loader/EditorLoader.js";

export async function startEngine(canvasSource, baseURL, mode = "editor", initialData = {}) {
    let canvas;

    if (typeof canvasSource === 'string') {
        canvas = document.getElementById(canvasSource);
    } else {
        canvas = canvasSource;
    }

    if (!canvas) {
        console.error(`[RuntimeEditor] Canvas element not found.`);
        return null;
    }
    
    Object.assign(canvas.style, {
        display: "block",      
        touchAction: "none",   
        userSelect: "none", 
        outline: "none"      
    });

    canvas.oncontextmenu = (e) => e.preventDefault();

    const game = new Game(); 
    
    if (process.env.NODE_ENV !== 'production') {
        window.$game = game; 
    }

    const loader = new EditorLoader();

    try {
        await loader.initializeGame(game, canvas, baseURL, mode, initialData);
        return { game, bus };
    } catch (error) {
        console.error("[RuntimeEditor] Fatal Error: Failed to start engine.", error);
        return null;
    }
}
import Game from "./Core/Game.js";
import RuntimeLoader from "./Loader/RuntimeLoader.js";
import { bus } from "./Util/EventBus.js";

export async function startEngine(canvasSource, baseURL, mode = "runtime", initialData = {}) {
    let canvas;

    if (typeof canvasSource === 'string') {
        canvas = document.getElementById(canvasSource);
    } else {
        canvas = canvasSource;
    }

    if (!canvas) {
        console.error(`[Runtime] Canvas element not found.`);
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
    game.isPreview = true;
    
    if (process.env.NODE_ENV !== 'production') {
        window.$game = game; 
    }

    const loader = new RuntimeLoader();

    try {
        const payload = {
            ...initialData,
            isPreview: true
        };
        await loader.initializeGame(game, canvas, baseURL, mode, payload);
        return { game, bus };
    } catch (error) {
        console.error("[Runtime] Fatal Error: Failed to start engine.", error);
        return null;
    }
}
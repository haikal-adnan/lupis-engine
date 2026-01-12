import Game from "./Core/Game.js";
import GameLoader from "./Core/GameLoader.js";
import { bus } from "./Util/EventBus.js";

// Hapus global export 'game' di sini agar tidak ada side-effect saat import.

export async function startEngine(canvasSource, mode = "editor", initialData = {}) {
    let canvas;

    // 1. Validasi Canvas
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

    const loader = new GameLoader();

    try {
        await loader.initializeGame(game, canvas, mode, initialData);
        
        loader.start(game);
        
        return { game, bus };
        
    } catch (error) {
        console.error("❌ [Main] Fatal Error: Failed to start engine.", error);
        // game.destroy(); 
        return null;
    }
}
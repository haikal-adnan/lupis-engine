// engine/main.js

import Game from "./Core/Game.js";
import GameLoader from "./Loader/GameLoader.js";

export const game = new Game();

export async function startEngine(canvasId, mode = "editor", baseURL = "./") {

    // 🛑 HARD VALIDATION
    if (!canvasId || typeof canvasId !== "string") {
        throw new Error(`startEngine() DIPANGGIL TANPA canvasId YANG VALID. 
            Diterima: ${canvasId}`);
    }

    // 🔐 Aman dari window.<id> binding
    const canvas = document.querySelector(`#${CSS.escape(canvasId)}`);

    if (!(canvas instanceof HTMLCanvasElement)) {
        console.error("❌ Canvas invalid:", canvasId, canvas);
        throw new Error(`Canvas "${canvasId}" tidak ditemukan atau bukan elemen <canvas>.`);
    }

    const dpr = window.devicePixelRatio || 1;

    // =======================
    // MODE RUNTIME (1920×1080)
    // =======================
    if (mode === "runtime") {
        const VIRTUAL_W = 1920;
        const VIRTUAL_H = 1080;

        canvas.width  = Math.floor(VIRTUAL_W * dpr);
        canvas.height = Math.floor(VIRTUAL_H * dpr);

        const updateCanvasStyle = () => {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            const targetRatio = VIRTUAL_W / VIRTUAL_H;
            const screenRatio = screenW / screenH;

            let drawW, drawH;

            if (screenRatio > targetRatio) {
                drawH = screenH;
                drawW = screenH * targetRatio;
            } else {
                drawW = screenW;
                drawH = screenW / targetRatio;
            }

            Object.assign(canvas.style, {
                width:  drawW + "px",
                height: drawH + "px",
                position: "absolute",
                left: "0",
                right: "0",
                top: "0",
                bottom: "0",
                margin: "auto",
                backgroundColor: "#000"
            });
        };

        window.addEventListener("resize", updateCanvasStyle);
        updateCanvasStyle();
    }

    // =======================
    // MODE EDITOR
    // =======================
    else if (mode === "editor") {

        const resizeEditorCanvas = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);

            Object.assign(canvas.style, {
                width: w + "px",
                height: h + "px",
                position: "absolute",
                left: "0",
                right: "0",
                top: "0",
                bottom: "0",
                margin: "0",
                background: "#1a1a1a"
            });
        };

        window.addEventListener("resize", resizeEditorCanvas);
        resizeEditorCanvas();
    }

    // =======================
    // LOAD ENGINE
    // =======================
    const loader = new GameLoader();
    await loader.initializeGame(game, canvas, mode, baseURL);
    loader.start(game);
}

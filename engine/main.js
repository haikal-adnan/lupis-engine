import Game from "./Core/Game.js";
import GameLoader from "./Core/GameLoader.js";

export const game = new Game();

export async function startEngine(canvasId, mode = "editor", baseURL = "./") {
    const canvas = document.querySelector(`#${canvasId}`);

    const dpr = window.devicePixelRatio || 1;

    const setStyle = (style) => Object.assign(canvas.style, style);

    if (mode === "runtime") {
        const W = 1920, H = 1080;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);

        const resize = () => {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const target = W / H;
            const ratio = sw / sh;

            const drawW = ratio > target ? sh * target : sw;
            const drawH = ratio > target ? sh : sw / target;

            setStyle({
                width: drawW + "px",
                height: drawH + "px",
                position: "absolute",
                left: 0, right: 0, top: 0, bottom: 0,
                margin: "auto",
                backgroundColor: "#000"
            });
        };

        window.addEventListener("resize", resize);
        resize();
    }

    if (mode === "editor") {
        const resize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);

            setStyle({
                width: w + "px",
                height: h + "px",
                position: "absolute",
                left: 0, right: 0, top: 0, bottom: 0,
                margin: 0,
                background: "#1a1a1a"
            });
        };

        window.addEventListener("resize", resize);
        resize();
    }

    const loader = new GameLoader();
    await loader.initializeGame(game, canvas, mode, baseURL);
    loader.start(game);
}

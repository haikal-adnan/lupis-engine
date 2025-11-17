export default class PointerCoordinates {
    constructor(game, renderer) {
        this.game = game;          // akses camera
        this.renderer = renderer;  // akses UI renderer

        this.mouseX = 0;
        this.mouseY = 0;

        window.addEventListener("mousemove", e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    renderUI() {
        const cam = this.game.camera;

        const canvas = this.renderer.canvas;
        const rect = canvas.getBoundingClientRect();

        // — CSS pixel mouse —
        const cssX = this.mouseX - rect.left;
        const cssY = this.mouseY - rect.top;

        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;

        // — convert ke world —
        const worldX = cam.x + (cssX - cw * 0.5) / cam.scale;
        const worldY = cam.y + (cssY - ch * 0.5) / cam.scale;

        // — tampilkan di UI renderer —
        this.renderer.uiRenderer.drawText(
            `X: ${worldX.toFixed(2)}   Y: ${worldY.toFixed(2)}`,
            cw - 230,      // 230px dari kanan
            20,            // 20px dari atas
            20,            // font size
            [1,1,1,1]      // warna putih
        );
    }
}

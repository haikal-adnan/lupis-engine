export default class PointerCoordinates {
    constructor(game, renderer) {
        this.game = game;        
        this.renderer = renderer; 

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

        const cssX = this.mouseX - rect.left;
        const cssY = this.mouseY - rect.top;

        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;

        const worldX = cam.x + (cssX - cw * 0.5) / cam.scale;
        const worldY = cam.y + (cssY - ch * 0.5) / cam.scale;

        this.renderer.uiRenderer.drawText(
            `X: ${worldX.toFixed(2)}   Y: ${worldY.toFixed(2)}`,
            cw - 230,  
            20,   
            20,          
            [1,1,1,1]    
        );
    }
}

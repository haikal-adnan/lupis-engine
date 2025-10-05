export default class InputHandler {
    constructor() {
        // status tombol
        this.keys = {
            arrowleft: false,
            arrowright: false,
            arrowup: false,
            arrowdown: false,
        };

        // mapping tombol alternatif
        this.keyMap = {
            a: "arrowleft",
            d: "arrowright",
            w: "arrowup",
            s: "arrowdown",
            arrowleft: "arrowleft",
            arrowright: "arrowright",
            arrowup: "arrowup",
            arrowdown: "arrowdown",
        };

        this.initListeners();
    }

    initListeners() {
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
        document.addEventListener("keyup", this.handleKeyUp.bind(this));
    }

    handleKeyDown(event) {
        const gameKey = event.key.toLowerCase();
        if (this.keyMap.hasOwnProperty(gameKey)) {
            const mappedKey = this.keyMap[gameKey];
            this.keys[mappedKey] = true;
        }
    }

    handleKeyUp(event) {
        const gameKey = event.key.toLowerCase();
        if (this.keyMap.hasOwnProperty(gameKey)) {
            const mappedKey = this.keyMap[gameKey];
            this.keys[mappedKey] = false;
        }
    }
}

// import InputHandler from "./InputHandler.js";

const input = new InputHandler();

// contoh cek input di update loop
function update() {
    if (input.keys.arrowleft) {
        console.log("← ditekan");
    }
    if (input.keys.arrowright) {
        console.log("→ ditekan");
    }
    requestAnimationFrame(update);
}

update();

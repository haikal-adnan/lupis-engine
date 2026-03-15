import { HexToVec4 } from "../Util/HexToVec4.js";

export default class TransitionSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.alpha = 0.0;     
        this.state = 'none';  
        this.duration = 1.0;
        this.timer = 0.0;
        this.color = [0, 0, 0, 1]; 
        this.onComplete = null;
    }

    fadeOut(duration = 1.0, colorHex = "#000000", callback = null) {
        this.active = true;
        this.state = 'fade_out'; 
        this.duration = duration || 1.0;
        this.timer = 0.0;
        this.alpha = 0.0;
        this.color = HexToVec4(colorHex);
        this.onComplete = callback;
    }

    fadeIn(duration = 1.0, colorHex = "#000000", callback = null) {
        this.active = true;
        this.state = 'fade_in'; 
        this.duration = duration || 1.0;
        this.timer = 0.0;
        this.alpha = 1.0;
        this.color = HexToVec4(colorHex);
        this.onComplete = callback;
    }

    update(dt) {
        if (this.state === 'none') return;

        let safeDt = Math.min(dt, 0.1); 
        this.timer += safeDt;
        
        let progress = Math.min(this.timer / this.duration, 1.0);
        
        let smoothProgress = progress * progress * (3 - 2 * progress);

        if (this.state === 'fade_out') {
            this.alpha = smoothProgress;
        } else if (this.state === 'fade_in') {
            this.alpha = 1.0 - smoothProgress;
        }

        if (progress >= 1.0) {
            this.state = 'none';
            
            if (this.alpha <= 0) {
                this.active = false; 
            } else {
                this.active = true;
            }

            if (this.onComplete) {
                const cb = this.onComplete;
                this.onComplete = null; 
                cb();
            }
        }
    }
}
import Config from "../Core/Config.js";

export default class AnimatorSystem {
    constructor(game) {
        this.game = game;
    }

    update(dt) {
        if (Config.ENGINE_MODE !== "runtime") return;

        const world = this.game.world;
        const layers = [...(world.layersWorld || []), ...(world.layersUI || [])];

        for (const layer of layers) {
            if (layer.active === false || layer.visible === false || !layer.entities) continue;
            
            for (const entity of layer.entities) {
                this._processAnimator(entity, dt);
            }
        }
    }

    _processAnimator(entity, dt) {
        if (entity.active === false || entity.visible === false) return;
        
        const animator = entity.components?.SpriteAnimator;
        
        if (!animator || !animator.active || !animator.isPlaying || !animator.currentClip || !Array.isArray(animator.clips)) {
            if (animator) animator._runtimeData = null; 
            return;
        }
        const clip = animator.clips.find(c => c.id === animator.currentClip && c.type === 'clip');
        
        if (!clip || !clip.frames || clip.frames.length === 0 || !clip.assetId) {
            animator._runtimeData = null; 
            return;
        }

        if (animator._activeClipId !== clip.id) {
            animator._activeClipId = clip.id;
            animator._elapsedTime = 0;
        }

        const fps = clip.fps || 12;
        const frameDuration = 1 / fps;
        
        animator._elapsedTime += dt;

        if (typeof clip.frameIndex !== 'number' || isNaN(clip.frameIndex)) {
            clip.frameIndex = 0;
        }

        while (animator._elapsedTime >= frameDuration) {
            animator._elapsedTime -= frameDuration;
            clip.frameIndex++; 

            if (clip.frameIndex >= clip.frames.length) {
                if (clip.isLooping) {
                    clip.frameIndex = 0;
                } else {
                    clip.frameIndex = clip.frames.length - 1; 
                    animator.isPlaying = false; 
                    
                    if (animator._onCompleteCallback) animator._onCompleteCallback();
                    animator._onCompleteCallback = null;

                    break; 
                }
            }
        }

        if (animator.isPlaying) {
            const safeIndex = Math.max(0, Math.min(clip.frameIndex, clip.frames.length - 1));
            const sourceId = clip.frames[safeIndex];
            const sourceRect = clip.sources?.[sourceId];

            if (sourceRect) {
                animator._runtimeData = {
                    assetId: clip.assetId,
                    x: sourceRect.x,
                    y: sourceRect.y,
                    w: sourceRect.w,
                    h: sourceRect.h,
                    flipX: !!clip.flipX 
                };
            } else {
                animator._runtimeData = null;
            }
        } else {
            animator._runtimeData = null;
        }
    }
}
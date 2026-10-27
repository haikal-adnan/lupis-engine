export const NodeAnimator = {
    'play_animation': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const clipIdInput = runner.getInputValue(node, 'clip_id');
            const reset = runner.getInputValue(node, 'reset');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.SpriteAnimator || !clipIdInput) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const animator = entity.components.SpriteAnimator;
            const targetStr = String(clipIdInput);
            
            const targetClip = animator.clips?.find(c => 
                c.scriptId === targetStr || 
                c.name === targetStr || 
                c.id === targetStr
            );

            const resolvedInternalId = targetClip ? targetClip.id : targetStr;

            animator.currentClip = resolvedInternalId;
            animator.isPlaying = true;

            if (reset !== false) {
                animator._activeClipId = null;
                if (targetClip) {
                    targetClip.frameIndex = 0;
                }
            }

            animator._onCompleteCallback = () => {
                runner.executeFlow(node._id, 'on_complete');
            };

            runner.executeFlow(node._id, 'exec_out');
            runner.executeFlow(node._id, 'on_start');
        }
    },

    'pause_animation': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);

            if (entity?.components?.SpriteAnimator) {
                entity.components.SpriteAnimator.isPlaying = false;
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_animator': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity?.components?.SpriteAnimator) return null;
            const comp = entity.components.SpriteAnimator;

            if (outputKey === 'currentClip') return comp.currentClip || null;
            if (outputKey === 'isPlaying') return !!comp.isPlaying;
            if (outputKey === 'active') return !!comp.active;
            if (outputKey === 'flipX') {
                const clip = comp.clips?.find(c => c.id === comp.currentClip);
                return clip ? !!clip.flipX : false;
            }

            return null;
        }
    },

    'set_animator': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.SpriteAnimator) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const comp = entity.components.SpriteAnimator;

            const currentClipInput = runner.getInputValue(node, 'currentClip');
            if (currentClipInput !== undefined && currentClipInput !== null) {
                const targetStr = String(currentClipInput);
                
                const targetClip = comp.clips?.find(c => 
                    c.scriptId === targetStr || 
                    c.name === targetStr || 
                    c.id === targetStr
                );
                
                const resolvedInternalId = targetClip ? targetClip.id : targetStr;

                if (comp.currentClip !== resolvedInternalId) {
                    comp.currentClip = resolvedInternalId;
                    comp._elapsedTime = 0;
                    comp.isPlaying = true;
                    
                    if (targetClip) {
                        targetClip.frameIndex = 0;
                    }
                }
            }

            const active = runner.getInputValue(node, 'active');
            if (active !== undefined && active !== null) {
                comp.active = Boolean(active);
            }

            const flipX = runner.getInputValue(node, 'flipX');
            if (flipX !== undefined && flipX !== null) {
                const clip = comp.clips?.find(c => c.id === comp.currentClip);
                if (clip) clip.flipX = Boolean(flipX);
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_clip_prop': {
        getOutput: (runner, node, outputKey) => {
            const clipIdInput = runner.getInputValue(node, 'clip_id');
            if (!clipIdInput) return null;

            const entity = runner.owner; 
            if (!entity?.components?.SpriteAnimator?.clips) return null;

            const targetStr = String(clipIdInput);
            const clip = entity.components.SpriteAnimator.clips.find(c => 
                c.scriptId === targetStr || 
                c.name === targetStr || 
                c.id === targetStr
            );
            
            if (!clip) return null;

            if (outputKey === 'fps') return clip.fps || 12;
            if (outputKey === 'isLooping') return !!clip.isLooping;
            if (outputKey === 'frameCount') return clip.frames ? clip.frames.length : 0;

            return null;
        }
    },

    'set_clip_prop': {
        execute: (runner, node) => {
            const clipIdInput = runner.getInputValue(node, 'clip_id');
            const entity = runner.owner;

            if (!clipIdInput || !entity?.components?.SpriteAnimator?.clips) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const targetStr = String(clipIdInput);
            const clip = entity.components.SpriteAnimator.clips.find(c => 
                c.scriptId === targetStr || 
                c.name === targetStr || 
                c.id === targetStr
            );
            
            if (clip) {
                const fps = runner.getInputValue(node, 'fps');
                if (fps !== undefined && fps !== null) clip.fps = Number(fps);

                const isLooping = runner.getInputValue(node, 'isLooping');
                if (isLooping !== undefined && isLooping !== null) clip.isLooping = Boolean(isLooping);
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
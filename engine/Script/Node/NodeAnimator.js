// Path: src/System/Nodes/NodeAnimator.js

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
            
            // Resolve berdasarkan scriptId, name, atau id internal
            const targetClip = animator.clips?.find(c => 
                c.scriptId === targetStr || 
                c.name === targetStr || 
                c.id === targetStr
            );

            // Jika ketemu, pakai id internalnya. Jika tidak, fallback ke input string.
            const resolvedInternalId = targetClip ? targetClip.id : targetStr;

            animator.currentClip = resolvedInternalId;
            animator.isPlaying = true;

            // Reset frame ke 0 jika opsi reset diaktifkan (default: true)
            if (reset !== false) {
                animator._activeClipId = null; // Memaksa AnimatorSystem mereset _elapsedTime
                if (targetClip) {
                    targetClip.frameIndex = 0;
                }
            }

            // Daftarkan callback untuk memicu pin 'on_complete' saat animasi selesai
            animator._onCompleteCallback = () => {
                runner.executeFlow(node._id, 'on_complete');
            };

            // Lanjutkan eksekusi utama dan picu event 'on_start'
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
            if (outputKey === 'isActive') return !!comp.isActive;
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

            // --- Set Current Clip (Mendukung Input Hold) ---
            const currentClipInput = runner.getInputValue(node, 'currentClip');
            if (currentClipInput !== undefined && currentClipInput !== null) {
                const targetStr = String(currentClipInput);
                
                // Resolve berdasarkan scriptId, name, atau id internal
                const targetClip = comp.clips?.find(c => 
                    c.scriptId === targetStr || 
                    c.name === targetStr || 
                    c.id === targetStr
                );
                
                const resolvedInternalId = targetClip ? targetClip.id : targetStr;

                // FIX: HANYA reset jika clip yang direquest BERBEDA dengan yang sedang aktif.
                // Ini mencegah bug animasi stuck di frame 0 saat menggunakan event input (Hold).
                if (comp.currentClip !== resolvedInternalId) {
                    comp.currentClip = resolvedInternalId;
                    comp._elapsedTime = 0; // Reset timer agar transisi mulus
                    comp.isPlaying = true; // Pastikan animasi langsung diputar
                    
                    if (targetClip) {
                        targetClip.frameIndex = 0; // Mulai dari frame pertama
                    }
                }
            }

            // --- Set isActive ---
            const isActive = runner.getInputValue(node, 'isActive');
            if (isActive !== undefined && isActive !== null) {
                comp.isActive = Boolean(isActive);
            }

            // --- Set flipX ---
            const flipX = runner.getInputValue(node, 'flipX');
            if (flipX !== undefined && flipX !== null) {
                // Terapkan flipX ke clip yang saat ini sedang aktif
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
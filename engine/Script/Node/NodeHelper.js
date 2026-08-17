import PointerRaycast from '../../System/PointerRaycast.js';

export const NodeHelper = {
    'logic_flow_merge': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        }
    },
    
    'logic_delay': {
        execute: async (runner, node) => {
            const durationInput = runner.getInputValue(node, 'duration');
            const duration = durationInput !== undefined && durationInput !== null 
                ? Number(durationInput)
                : (node.data?.values?.duration || 500); 
            
            await new Promise(resolve => setTimeout(resolve, duration));
            
            runner.executeFlow(node._id, 'out');
        }
    },

    'logic_cooldown': {
        execute: (runner, node) => {
            const durationInput = runner.getInputValue(node, 'duration');
            const targetDuration = durationInput !== undefined && durationInput !== null 
                ? Number(durationInput) 
                : (node.data?.values?.duration || 500); 
            
            const currentTime = Date.now(); 

            if (node._lastExecuteTime === undefined) {
                node._lastExecuteTime = 0; 
            }

            if (currentTime - node._lastExecuteTime >= targetDuration) {
                node._lastExecuteTime = currentTime; 
                
                runner.executeFlow(node._id, 'ready');
            } else {
                runner.executeFlow(node._id, 'cooling');
            }
        }
    },

    'logic_tween_value': {
        execute: (runner, node) => {
            const start = parseFloat(runner.getInputValue(node, 'startValue') ?? node.data?.values?.startValue ?? 0);
            const end = parseFloat(runner.getInputValue(node, 'endValue') ?? node.data?.values?.endValue ?? 100);
            const duration = parseFloat(runner.getInputValue(node, 'duration') ?? node.data?.values?.duration ?? 1000);
            const easing = node.data?.values?.easing || 'smooth';

            let elapsed = 0;
            
            node._currentValue = start; 

            const updateTween = () => {
                const dt = runner.currentDt || 0.016; 
                elapsed += dt * 1000; 
                
                let progress = Math.min(elapsed / duration, 1.0);

                let t = progress;
                if (easing === 'smooth') t = progress * progress * (3 - 2 * progress);
                if (easing === 'ease_in') t = progress * progress;

                node._currentValue = start + (end - start) * t;
                
                runner.executeFlow(node._id, 'on_update');

                if (progress < 1.0) {
                    requestAnimationFrame(updateTween); 
                } else {
                    runner.executeFlow(node._id, 'on_complete');
                }
            };

            requestAnimationFrame(updateTween); 
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'value') {
                return node._currentValue !== undefined 
                    ? node._currentValue 
                    : (node.data?.values?.startValue ?? 0);
            }
            return null;
        }
    },

    'logic_typewriter': {
        execute: (runner, node, inputKey) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);
            const comp = entity?.components?.TextRenderer;

            // Fungsi pembantu untuk membersihkan timer
            const stopTimer = () => {
                if (node._typewriterTimer) {
                    clearTimeout(node._typewriterTimer);
                    node._typewriterTimer = null;
                }
            };

            if (!comp) {
                stopTimer();
                node._isTyping = false;
                if (inputKey !== 'skip_in') runner.executeFlow(node._id, 'on_complete');
                return;
            }

            const speed = Number(runner.getInputValue(node, 'speed') ?? node.data?.values?.speed ?? 50);

            // --- HANDLER SKIP ---
            if (inputKey === 'skip_in') {
                if (node._isTyping && node._currentTargetText !== undefined) {
                    stopTimer();
                    comp.value = node._currentTargetText; 
                    node._isTyping = false;
                    node._lastFinishedText = node._currentTargetText;
                    runner.executeFlow(node._id, 'on_complete');
                }
                return;
            }

            // --- PREPARASI TEKS ---
            const inputText = runner.getInputValue(node, 'text_in') ?? node.data?.values?.text_in;
            const targetText = (inputText !== undefined && inputText !== null && inputText !== '') 
                ? String(inputText) 
                : (comp.value || "");

            // Cek jika sedang mengetik teks yang sama atau sudah selesai
            if (node._isTyping && node._currentTargetText === targetText) return;
            if (!node._isTyping && node._lastFinishedText === targetText) return;

            // Reset state & hentikan timer lama
            stopTimer();
            node._isTyping = true;
            node._currentTargetText = targetText;
            node._lastFinishedText = null; 
            
            comp.value = ""; 
            let currentIndex = 0;

            // Re-check target text lokal untuk mencegah race condition
            const activeText = targetText;

            const typeChar = () => {
                // Validasi apakah entity/komponen masih ada
                const currentEntity = runner.resolveEntity(targetId);
                const currentComp = currentEntity?.components?.TextRenderer;

                if (!node._isTyping || !currentComp || node._currentTargetText !== activeText) {
                    stopTimer();
                    return;
                }

                if (currentIndex < activeText.length) {
                    currentIndex++;
                    currentComp.value = activeText.slice(0, currentIndex);
                    
                    runner.executeFlow(node._id, 'exec_out');
                    node._typewriterTimer = setTimeout(typeChar, speed);
                } else {
                    stopTimer();
                    node._isTyping = false;
                    node._lastFinishedText = activeText;
                    runner.executeFlow(node._id, 'on_complete');
                }
            };

            if (activeText.length > 0) {
                typeChar();
            } else {
                node._isTyping = false;
                node._lastFinishedText = "";
                runner.executeFlow(node._id, 'on_complete');
            }
        },

        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'is_typing') {
                return Boolean(node._isTyping);
            }
            return null;
        }
    },
    'ui_button_scale_effect': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);

            const hasTransform = entity?.components?.Transform;
            const hasUITransform = entity?.components?.UITransform;
            const t = hasUITransform ? entity.components.UITransform : entity?.components?.Transform;

            if (!entity || !t) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const entityId = entity.id || entity._id;

            const scaleNormal = Number(runner.getInputValue(node, 'scaleNormal') ?? node.data?.values?.scaleNormal ?? 1.0);
            const scaleHover = Number(runner.getInputValue(node, 'scaleHover') ?? node.data?.values?.scaleHover ?? 1.1);
            const scalePressed = Number(runner.getInputValue(node, 'scalePressed') ?? node.data?.values?.scalePressed ?? 0.9);
            const lerpSpeed = Number(runner.getInputValue(node, 'lerpSpeed') ?? node.data?.values?.lerpSpeed ?? 0.2);
            
            const useRaycast = runner.getInputValue(node, 'use_raycast') ?? true;

            const pointer = runner.game.input.getPointer();
            const isPointerDown = pointer.down;
            
            let isHovering = false;

            if (useRaycast) {
                const topEntity = PointerRaycast.getTopEntityUnderPointer(runner.game);
                
                if (topEntity) {
                    if (topEntity.id === entityId || topEntity._id === entityId) {
                        isHovering = true;
                    } else {
                        let currentParentId = topEntity.parentId;
                        while (currentParentId) {
                            if (currentParentId === entityId) {
                                isHovering = true;
                                break;
                            }
                            const pEntity = runner.game.world.entities.find(
                                e => e.id === currentParentId || e._id === currentParentId
                            );
                            currentParentId = pEntity ? pEntity.parentId : null;
                        }
                    }
                }
            } else {
                const canvas = runner.game.renderer?.canvas || { width: 1920, height: 1080 };
                const uiSettings = runner.game.world.settings?.ui || { width: 1920, height: 1080 };
                const camera = runner.game.camera;

                const uiPointer = {
                    x: (pointer.x / canvas.width) * uiSettings.width,
                    y: (pointer.y / canvas.height) * uiSettings.height
                };

                const halfW = canvas.width / 2;
                const halfH = canvas.height / 2;
                const worldPointer = {
                    x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
                    y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
                };

                const globalT = PointerRaycast._getGlobalTransform(entity, runner.game.world);
                let drawX = globalT.x || 0;
                let drawY = globalT.y || 0;
                let targetPointer = hasUITransform ? uiPointer : worldPointer;

                if (hasUITransform) {
                    const anchorX = t.anchorX ?? 0.5;
                    const anchorY = t.anchorY ?? 0.5;
                    drawX = (uiSettings.width * anchorX) + (globalT.x || 0);
                    drawY = (uiSettings.height * anchorY) + (globalT.y || 0);
                }

                isHovering = PointerRaycast._checkIntersection(entity, globalT, drawX, drawY, targetPointer.x, targetPointer.y);
            }

            if (!node._btnStates) {
                node._btnStates = {};
            }
            
            let state = node._btnStates[entityId];
            if (!state) {
                state = { 
                    wasDown: false, 
                    currentScale: t.scaleX ?? scaleNormal 
                };
                node._btnStates[entityId] = state;
            }

            let targetScale = scaleNormal;
            if (isHovering) {
                targetScale = isPointerDown ? scalePressed : scaleHover;
            }

            state.currentScale += (targetScale - state.currentScale) * lerpSpeed;
            
            t.scaleX = state.currentScale;
            t.scaleY = state.currentScale;

            let clicked = false;
            if (isHovering && !isPointerDown && state.wasDown) {
                clicked = true;
            }

            state.wasDown = isPointerDown;

            runner.executeFlow(node._id, 'exec_out');
            
            if (clicked) {
                node._clickedScriptId = entity.scriptId;
                runner.executeFlow(node._id, 'on_click');
            }
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'script_id_out') {
                return node._clickedScriptId || null;
            }
            return null;
        }
    }
};
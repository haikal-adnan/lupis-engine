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

            if (!comp) {
                if (inputKey !== 'skip_in') runner.executeFlow(node._id, 'on_complete');
                return;
            }

            const speed = Number(runner.getInputValue(node, 'speed') ?? node.data?.values?.speed ?? 50);

            // Fungsi untuk membersihkan timer
            const stopTimer = () => {
                if (node._typewriterTimer) {
                    clearTimeout(node._typewriterTimer);
                    node._typewriterTimer = null;
                }
            };

            // --- LOGIKA SKIP ---
            if (inputKey === 'skip_in') {
                // Hanya skip jika sedang dalam proses mengetik
                if (node._isTyping && node._currentTargetText) {
                    stopTimer();
                    comp.value = node._currentTargetText; // Langsung set ke teks penuh
                    node._isTyping = false;               // Tandai sudah selesai
                    node._lastFinishedText = node._currentTargetText; // Simpan cache selesai
                    runner.executeFlow(node._id, 'on_complete');
                }
                return;
            }

            // --- LOGIKA START (exec_in) ---
            // 1. Ambil input teks baru
            const inputText = runner.getInputValue(node, 'text_in') ?? node.data?.values?.text_in;
            const targetText = (inputText !== undefined && inputText !== null && inputText !== '') 
                ? String(inputText) 
                : (comp.value || "");

            // 2. GUARD: Jika sedang mengetik teks yang SAMA, jangan restart!
            if (node._isTyping && node._currentTargetText === targetText) {
                return;
            }

            // 3. GUARD: Jika teks sudah selesai diketik dan tidak ada perubahan teks, jangan restart!
            if (!node._isTyping && node._lastFinishedText === targetText) {
                return;
            }

            // 4. MULAI ANIMASI BARU
            stopTimer();
            node._isTyping = true;
            node._currentTargetText = targetText;
            node._lastFinishedText = null; 
            
            comp.value = ""; 
            let currentIndex = 0;

            const typeChar = () => {
                // Pastikan state masih mengetik (tidak di-skip di tengah jalan)
                if (!node._isTyping) return;

                if (currentIndex < node._currentTargetText.length) {
                    currentIndex++;
                    comp.value = node._currentTargetText.slice(0, currentIndex);
                    
                    runner.executeFlow(node._id, 'exec_out');
                    node._typewriterTimer = setTimeout(typeChar, speed);
                } else {
                    // Selesai secara normal
                    node._isTyping = false;
                    node._lastFinishedText = node._currentTargetText;
                    node._typewriterTimer = null;
                    runner.executeFlow(node._id, 'on_complete');
                }
            };

            if (node._currentTargetText.length > 0) {
                typeChar();
            } else {
                node._isTyping = false;
                runner.executeFlow(node._id, 'on_complete');
            }
        }
    },
    'ui_button_scale_effect': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);

            // Deteksi komponen Transform (Prioritaskan UI Transform jika ada)
            const t = entity?.components?.UITransform || entity?.components?.Transform;
            if (!entity || !t) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // Ambil ID Unik untuk membedakan state antar entity
            const entityId = entity.id || entity._id;

            // Ambil parameter nilai
            const scaleNormal = Number(runner.getInputValue(node, 'scaleNormal') ?? node.data?.values?.scaleNormal ?? 1.0);
            const scaleHover = Number(runner.getInputValue(node, 'scaleHover') ?? node.data?.values?.scaleHover ?? 1.1);
            const scalePressed = Number(runner.getInputValue(node, 'scalePressed') ?? node.data?.values?.scalePressed ?? 0.9);
            const lerpSpeed = Number(runner.getInputValue(node, 'lerpSpeed') ?? node.data?.values?.lerpSpeed ?? 0.2);

            // 1. DETEKSI POSISI MOUSE 
            const pointer = runner.game.input.getPointer();
            const isPointerDown = pointer.down;
            const canvas = runner.game.renderer.canvas;
            
            let isHovering = false;
            
            // Logika bounding box untuk UI
            const uiSettings = runner.game.world.settings?.ui || { width: 1920, height: 1080 };
            const targetPointerX = (pointer.x / canvas.width) * uiSettings.width;
            const targetPointerY = (pointer.y / canvas.height) * uiSettings.height;

            const anchorX = t.anchorX ?? 0.5;
            const anchorY = t.anchorY ?? 0.5;
            const drawX = (uiSettings.width * anchorX) + (t.x || 0);
            const drawY = (uiSettings.height * anchorY) + (t.y || 0);

            const boxW = t.width;
            const boxH = t.height;
            const pivotOffsetX = boxW * (t.pivotX ?? 0.5);
            const pivotOffsetY = boxH * (t.pivotY ?? 0.5);

            const centerX = drawX - pivotOffsetX + (boxW / 2);
            const centerY = drawY - pivotOffsetY + (boxH / 2);

            const relX = targetPointerX - centerX;
            const relY = targetPointerY - centerY;
            
            const tRotRad = (t.rotation || 0) * (Math.PI / 180);
            const rotMouseX = relX * Math.cos(-tRotRad) - relY * Math.sin(-tRotRad);
            const rotMouseY = relX * Math.sin(-tRotRad) + relY * Math.cos(-tRotRad);

            // Pengecekan overlap kursor dan bounding box tombol
            const currentScaleX = t.scaleX ?? 1.0;
            const currentScaleY = t.scaleY ?? 1.0;
            
            if (Math.abs(rotMouseX) <= (boxW * Math.abs(currentScaleX)) / 2 && 
                Math.abs(rotMouseY) <= (boxH * Math.abs(currentScaleY)) / 2) {
                isHovering = true;
            }

            // 2. STATE MANAGER & LERP
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

            // 3. DETEKSI "ON CLICK"
            let clicked = false;
            if (isHovering && !isPointerDown && state.wasDown) {
                clicked = true;
            }

            state.wasDown = isPointerDown;

            // 4. EKSEKUSI ALUR SELANJUTNYA
            runner.executeFlow(node._id, 'exec_out');
            
            if (clicked) {
                // Simpan scriptId saat tombol ini diklik agar bisa ditarik oleh getOutput
                node._clickedScriptId = entity.scriptId;
                runner.executeFlow(node._id, 'on_click');
            }
        },
        // Tambahkan fungsi getOutput untuk mereturn nilai data string-nya
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'script_id_out') {
                return node._clickedScriptId || null;
            }
            return null;
        }
    }
};
export const NodeMouse = {
    'mouse_entity_interact': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const basedCollider = runner.getInputValue(node, 'based_collider') || false;
            const entity = runner.resolveEntity(targetId);

            const hasTransform = entity && entity.components && entity.components.Transform;
            const hasUITransform = entity && entity.components && entity.components.UITransform;

            if (!entity || (!hasTransform && !hasUITransform)) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const isUI = !!hasUITransform;
            const t = isUI ? entity.components.UITransform : entity.components.Transform;

            const pointer = runner.game.input.getPointer();
            const isPointerDown = pointer.down; 
            
            const camera = runner.game.camera;
            const canvas = runner.game.renderer.canvas;
            
            let targetPointerX = 0;
            let targetPointerY = 0;
            let drawX = t.x || 0;
            let drawY = t.y || 0;

            // 1. Hitung Posisi Mouse dan Titik Gambar (World/UI Space)
            if (isUI) {
                const uiSettings = runner.game.world.settings?.ui || { width: 1920, height: 1080 };
                
                targetPointerX = (pointer.x / canvas.width) * uiSettings.width;
                targetPointerY = (pointer.y / canvas.height) * uiSettings.height;

                const anchorX = t.anchorX ?? 0.5;
                const anchorY = t.anchorY ?? 0.5;
                drawX = (uiSettings.width * anchorX) + (t.x || 0);
                drawY = (uiSettings.height * anchorY) + (t.y || 0);
            } else {
                const halfW = canvas.width / 2;
                const halfH = canvas.height / 2;
                
                targetPointerX = camera.x + (pointer.x - halfW) / camera.scale;
                targetPointerY = camera.y + (pointer.y - halfH) / camera.scale;
                
                drawX = t.x || 0;
                drawY = t.y || 0;
            }

            let isHovering = false;
            const tRotRad = (t.rotation || 0) * (Math.PI / 180);

            // 2. Deteksi Hover dengan Multi-Collider & Rotasi (OBB Inverse Rotation)
            // 2. Deteksi Hover dengan Multi-Collider & Rotasi (OBB Inverse Rotation)
            if (!isUI && basedCollider && entity.components.Collider && Array.isArray(entity.components.Collider.data)) {
                const colData = entity.components.Collider.data;
                const tRotRad = (t.rotation || 0) * (Math.PI / 180);
                const cosT = Math.cos(tRotRad);
                const sinT = Math.sin(tRotRad);

                for (let i = 0; i < colData.length; i++) {
                    const c = colData[i];
                    if (!c.enabled) continue;

                    const cW = (c.autoFit ? t.width : c.width) * Math.abs(t.scaleX ?? 1);
                    const cH = (c.autoFit ? t.height : c.height) * Math.abs(t.scaleY ?? 1);
                    const pX = c.pivotX ?? 0.5;
                    const pY = c.pivotY ?? 0.5;

                    const localTlX = -t.width * Math.abs(t.scaleX ?? 1) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(t.scaleX ?? 1);
                    const localTlY = -t.height * Math.abs(t.scaleY ?? 1) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(t.scaleY ?? 1);

                    const localPx = localTlX + cW * pX;
                    const localPy = localTlY + cH * pY;

                    const worldPx = drawX + localPx * cosT - localPy * sinT;
                    const worldPy = drawY + localPx * sinT + localPy * cosT;

                    const totalRot = c.autoFit ? tRotRad : tRotRad + ((c.rotation || 0) * (Math.PI / 180));

                    // Inverse Rotation: Putar koordinat mouse melawan arah rotasi kotak
                    const relX = targetPointerX - worldPx;
                    const relY = targetPointerY - worldPy;
                    const rotMouseX = relX * Math.cos(-totalRot) - relY * Math.sin(-totalRot);
                    const rotMouseY = relX * Math.sin(-totalRot) + relY * Math.cos(-totalRot);

                    const left = -cW * pX;
                    const right = cW * (1 - pX);
                    const top = -cH * pY;
                    const bottom = cH * (1 - pY);

                    if (rotMouseX >= left && rotMouseX <= right && rotMouseY >= top && rotMouseY <= bottom) {
                        isHovering = true;
                        break;
                    }
                }
            } else {
                // Fallback default: Gunakan Transform Base (juga mendeteksi rotasi)
                const boxW = t.width * Math.abs(t.scaleX ?? 1);
                const boxH = t.height * Math.abs(t.scaleY ?? 1);
                const pivotOffsetX = boxW * (t.pivotX ?? 0.5);
                const pivotOffsetY = boxH * (t.pivotY ?? 0.5);
                
                const centerX = drawX - pivotOffsetX + (boxW / 2);
                const centerY = drawY - pivotOffsetY + (boxH / 2);

                const relX = targetPointerX - centerX;
                const relY = targetPointerY - centerY;
                
                const rotMouseX = relX * Math.cos(-tRotRad) - relY * Math.sin(-tRotRad);
                const rotMouseY = relX * Math.sin(-tRotRad) + relY * Math.cos(-tRotRad);

                if (Math.abs(rotMouseX) <= boxW / 2 && Math.abs(rotMouseY) <= boxH / 2) {
                    isHovering = true;
                }
            }

            // 3. Manajemen State Interaksi (Hover, Down, Hold, Up)
            if (!node._interactStates) node._interactStates = {};
            const entityId = entity.id || entity._id;
            
            let state = node._interactStates[entityId];
            if (!state) {
                state = { wasHovering: false, wasDown: false };
                node._interactStates[entityId] = state;
            }

            node._tempData = {
                is_hovering: isHovering,
                is_holding: isHovering && isPointerDown
            };

            runner.executeFlow(node._id, 'exec_out');

            if (isHovering) {
                runner.executeFlow(node._id, 'on_hover');

                if (isPointerDown && !state.wasDown) {
                    runner.executeFlow(node._id, 'on_down');
                }
                
                if (isPointerDown && state.wasDown) {
                    runner.executeFlow(node._id, 'on_hold');
                }

                if (!isPointerDown && state.wasDown) {
                    runner.executeFlow(node._id, 'on_up');
                }
            }

            state.wasHovering = isHovering;
            state.wasDown = isPointerDown;
        },
        
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'is_hovering') return node._tempData?.is_hovering || false;
            if (outputKey === 'is_holding') return node._tempData?.is_holding || false;
            return null;
        }
    }
};
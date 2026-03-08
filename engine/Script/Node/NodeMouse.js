export const NodeMouse = {
    'mouse_entity_interact': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const basedCollider = runner.getInputValue(node, 'based_collider') || false;
            const entity = runner.resolveEntity(targetId);

            // Periksa apakah entity memiliki Transform biasa ATAU UITransform
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

            // Kalkulasi Posisi Mouse & Posisi Entity berdasarkan Space
            if (isUI) {
                // Kalkulasi UI Space (Screen Space)
                const uiSettings = runner.game.world.settings?.ui || { width: 1920, height: 1080 };
                
                // Konversi pointer dari resolusi Canvas aktual ke resolusi patokan UI (misal 1920x1080)
                targetPointerX = (pointer.x / canvas.width) * uiSettings.width;
                targetPointerY = (pointer.y / canvas.height) * uiSettings.height;

                // Kalkulasi jangkar UI seperti di UIRenderer
                const anchorX = t.anchorX ?? 0.5;
                const anchorY = t.anchorY ?? 0.5;
                drawX = (uiSettings.width * anchorX) + (t.x || 0);
                drawY = (uiSettings.height * anchorY) + (t.y || 0);
            } else {
                // Kalkulasi World Space
                const halfW = canvas.width / 2;
                const halfH = canvas.height / 2;
                
                targetPointerX = camera.x + (pointer.x - halfW) / camera.scale;
                targetPointerY = camera.y + (pointer.y - halfH) / camera.scale;
                
                drawX = t.x || 0;
                drawY = t.y || 0;
            }

            let bounds = { x: 0, y: 0, w: 0, h: 0 };

            // Kalkulasi Bounding Box
            if (!isUI && basedCollider && entity.components.Collider) {
                const c = entity.components.Collider;
                const pivotOffsetX = (t.width * (t.scaleX ?? 1)) * (t.pivotX ?? 0.5);
                const pivotOffsetY = (t.height * (t.scaleY ?? 1)) * (t.pivotY ?? 0.5);

                bounds.x = drawX - pivotOffsetX + (c.offsetX || 0);
                bounds.y = drawY - pivotOffsetY + (c.offsetY || 0);
                bounds.w = c.width * Math.abs(t.scaleX ?? 1);
                bounds.h = c.height * Math.abs(t.scaleY ?? 1);
            } else {
                bounds.w = t.width * Math.abs(t.scaleX ?? 1);
                bounds.h = t.height * Math.abs(t.scaleY ?? 1);
                
                const pivotOffsetX = bounds.w * (t.pivotX ?? 0.5);
                const pivotOffsetY = bounds.h * (t.pivotY ?? 0.5);
                
                bounds.x = drawX - pivotOffsetX;
                bounds.y = drawY - pivotOffsetY;
            }

            const left = bounds.x;
            const right = left + bounds.w;
            const top = bounds.y;
            const bottom = top + bounds.h;

            const isHovering = targetPointerX >= left && targetPointerX <= right && 
                               targetPointerY >= top && targetPointerY <= bottom;

            // --- State Management ---
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
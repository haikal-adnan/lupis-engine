export const NodeMouse = {
    'mouse_entity_interact': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const basedCollider = runner.getInputValue(node, 'based_collider') || false;
            const entity = runner.resolveEntity(targetId);

            if (!entity || !entity.components || !entity.components.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const pointer = runner.game.input.getPointer();
            const isPointerDown = pointer.down; 
            
            const camera = runner.game.camera;
            const canvas = runner.game.renderer.canvas;
            
            const halfW = canvas.width / 2;
            const halfH = canvas.height / 2;
            
            const worldPointerX = camera.x + (pointer.x - halfW) / camera.scale;
            const worldPointerY = camera.y + (pointer.y - halfH) / camera.scale;

            let bounds = { x: 0, y: 0, w: 0, h: 0 };
            const t = entity.components.Transform;

            if (basedCollider && entity.components.Collider) {
                const c = entity.components.Collider;
                
                const pivotOffsetX = (t.width * (t.scaleX ?? 1)) * (t.pivotX ?? 0.5);
                const pivotOffsetY = (t.height * (t.scaleY ?? 1)) * (t.pivotY ?? 0.5);

                bounds.x = t.x - pivotOffsetX + (c.offsetX || 0);
                bounds.y = t.y - pivotOffsetY + (c.offsetY || 0);
                bounds.w = c.width * Math.abs(t.scaleX ?? 1);
                bounds.h = c.height * Math.abs(t.scaleY ?? 1);
            } else {
                bounds.w = t.width * Math.abs(t.scaleX ?? 1);
                bounds.h = t.height * Math.abs(t.scaleY ?? 1);
                
                const pivotOffsetX = bounds.w * (t.pivotX ?? 0.5);
                const pivotOffsetY = bounds.h * (t.pivotY ?? 0.5);
                
                bounds.x = t.x - pivotOffsetX;
                bounds.y = t.y - pivotOffsetY;
            }

            const left = bounds.x;
            const right = left + bounds.w;
            const top = bounds.y;
            const bottom = top + bounds.h;

            const isHovering = worldPointerX >= left && worldPointerX <= right && 
                               worldPointerY >= top && worldPointerY <= bottom;

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
export const NodeTransform = {
    'set_transform': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity?.components?.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const t = entity.components.Transform;
            const props = ['x', 'y', 'rotation', 'width', 'height', 'pivotX', 'pivotY', 'scaleX', 'scaleY'];
            
            props.forEach(prop => {
                const val = runner.getInputValue(node, prop);
                if (val !== undefined && val !== null && !isNaN(val)) {
                    t[prop] = Number(val);
                }
            });
            
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.Transform) return 0;
            
            const t = entity.components.Transform;
            if (outputKey === 'scaleX' || outputKey === 'scaleY') return t[outputKey] ?? 1;
            if (outputKey === 'pivotX' || outputKey === 'pivotY') return t[outputKey] ?? 0.5;
            
            return t[outputKey] || 0;
        }
    },

    'get_transform': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.Transform) return 0;
            
            const t = entity.components.Transform;
            if (outputKey === 'scaleX' || outputKey === 'scaleY') return t[outputKey] ?? 1;
            if (outputKey === 'pivotX' || outputKey === 'pivotY') return t[outputKey] ?? 0.5;
            
            return t[outputKey] || 0;
        }
    },

    'translate': {
        execute: (runner, node) => {
            const hasTargetConnection = runner.hasInputConnection(node._id, 'in_target');
            let entity = null;

            if (hasTargetConnection) {
                const targetId = runner.getInputValue(node, 'in_target');
                entity = runner.game.world.entities.find(e => (e.id || e._id || e.scriptId) === targetId) || null;
                
                if (!entity) {
                    runner.executeFlow(node._id, 'exec_out');
                    return; 
                }
            } else {
                entity = runner.resolveEntity(null); 
            }

            if (!entity?.components?.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const velX = runner.getInputValue(node, 'vel_x'); 
            const velY = runner.getInputValue(node, 'vel_y');
            const dt = runner.currentDt || 0.016;

            const phys = entity.components.Physics;
            const hasPhysics = phys && phys.enabled;

            if (hasPhysics) {
                // MODIFIKASI: Mengizinkan input nilai 0 untuk mendukung penghentian karakter (deselerasi)
                if (velX !== null && velX !== undefined) phys.velocityX = Number(velX); 
                if (velY !== null && velY !== undefined) phys.velocityY = Number(velY);

                // Tandai bahwa ini adalah pergerakan disengaja jika kecepatan input cukup tinggi
                phys._isIntentionalMove = Math.abs(Number(velX)) > 10 || Math.abs(Number(velY)) > 10;
            } else {
                const moveX = (Number(velX) || 0) * dt;
                const moveY = (Number(velY) || 0) * dt;

                if (runner.game.colliderSystem) {
                    runner.game.colliderSystem.moveAndSlide(entity, moveX, moveY);
                } else {
                    entity.components.Transform.x += moveX;
                    entity.components.Transform.y += moveY;
                }
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
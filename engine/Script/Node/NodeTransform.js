export const NodeTransform = {
    'set_transform': {
        execute: (runner, node) => {

            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            console.log(targetId)
            
            if (!entity?.components?.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const t = entity.components.Transform;
            const props = ['x', 'y', 'rotation', 'width', 'height', 'pivotX', 'pivotY'];
            props.forEach(prop => {
                const val = runner.getInputValue(node, prop);
                if (val !== undefined && val !== null) t[prop] = Number(val);
            });
            
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.Transform) return 0;
            return entity.components.Transform[outputKey] || 0;
        }
    },

    'get_transform': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.Transform) return 0;
            return entity.components.Transform[outputKey] || 0;
        }
    },

    'translate': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity?.components?.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const velX = Number(runner.getInputValue(node, 'vel_x')) || 0;
            const velY = Number(runner.getInputValue(node, 'vel_y')) || 0;

            const phys = entity.components.Physics;
            const hasPhysics = phys && phys.enabled;

            if (hasPhysics) {
                // LOGIC PENTING:
                // Velocity X biasanya override (jalan kiri/kanan langsung responsif)
                // Tapi kalau input 0, kita biarkan momentum drag bekerja (opsional)
                if (velX !== 0) phys.velocityX = velX; 
                
                // Velocity Y (Lompat/Terbang)
                // Hanya override jika ada input nilai (bukan 0). 
                // Ini membiarkan gravitasi bekerja saat user tidak menekan apa-apa.
                if (velY !== 0) {
                    phys.velocityY = velY;
                }
            } else {
                // Manual Movement (Ghost/Kinematic)
                const dt = runner.currentDt || 0.016;
                const moveX = velX * dt;
                const moveY = velY * dt;

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

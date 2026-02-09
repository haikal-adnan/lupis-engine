export const transformNode = {
    'set_transform': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            
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
    
    // --- LOGIC TRANSLATE YANG DIPERBARUI ---
    'translate': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity?.components?.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const dt = runner.currentDt || 0.016; 

            // 1. Ambil Speed (DX/DY)
            // getInputValue otomatis cek: Kabel -> Node Data -> Input Value
            const speedX = Number(runner.getInputValue(node, 'dx')) || 0;
            const speedY = Number(runner.getInputValue(node, 'dy')) || 0;
            
            // 2. Hitung jarak tempuh frame ini
            const moveX = speedX * dt;
            const moveY = speedY * dt;

            // 3. Cek Status Sweep (Solid Collision)
            let isSweep = runner.getInputValue(node, 'sweep');
            
            // Fallback manual jika undefined (untuk safety)
            if (isSweep === undefined || isSweep === null) {
                isSweep = true; 
            }

            // 4. Eksekusi Gerakan
            if (isSweep && runner.game.colliderSystem) {
                // Gunakan physics system (Move & Slide)
                runner.game.colliderSystem.moveAndSlide(entity, moveX, moveY);
            } else {
                // Gerakan raw (Tembus tembok / Ghost)
                entity.components.Transform.x += moveX;
                entity.components.Transform.y += moveY;
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
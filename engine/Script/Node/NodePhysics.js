export const NodePhysics = {
    'get_physics': {
        getOutput(runner, node, outputKey) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'in_target'));
            if (!target || !target.components.Physics) return null;

            const phys = target.components.Physics;

            if (outputKey === 'isGrounded') {
                const tag = runner.getInputValue(node, 'filter_tag');
                if (tag) runner.game.physicsSystem._checkGrounded(target, phys, tag);
                return phys.isGrounded;
            }

            return phys[outputKey];
        }
    },

    'set_physics': {
        execute(runner, node) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'in_target'));
            if (target && target.components.Physics) {
                const phys = target.components.Physics;
                
                // Ambil daftar properti dinamis (misal: ['velocityX'])
                const propsToUpdate = node.data?.dynamicInputs || []; 
                propsToUpdate.forEach(prop => {
                    // Ambil nilai. Jika kabel tidak colok, GraphRunner baru akan ambil value default (-200)
                    const val = runner.getInputValue(node, prop); 
                    if (val !== undefined && val !== null) {
                        phys[prop] = val;
                    }
                });
            }
            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'apply_impulse': {
        execute(runner, node) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'in_target'));
            if (target && target.components.Physics) {
                // Default ke 0 jika tidak ada input
                const fx = runner.getInputValue(node, 'forceX') || 0;
                const fy = runner.getInputValue(node, 'forceY') || 0;
                
                target.components.Physics.velocityX += fx;
                target.components.Physics.velocityY += fy;
            }
            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
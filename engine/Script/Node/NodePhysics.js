export const NodePhysics = {
    'get_physics': {
        getOutput(runner, node, outputKey) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'in_target'));
            if (!target || !target.components.Physics) return null;

            const phys = target.components.Physics;

            switch (outputKey) {
                case 'isGrounded':
                    return phys.isGrounded;
                case 'movementState':
                    return phys.movementState || 'idle';
                case 'facingDirection':
                    return phys.facingDirection || "right";
                default:
                    return phys[outputKey];
            }
        }
    },
    'set_physics': {
        execute(runner, node) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'in_target'));
            if (target && target.components.Physics) {
                const phys = target.components.Physics;
                
                const propsToUpdate = node.data?.dynamicInputs || []; 
                propsToUpdate.forEach(prop => {
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
                const fx = runner.getInputValue(node, 'forceX') || 0;
                const fy = runner.getInputValue(node, 'forceY') || 0;
                
                target.components.Physics.velocityX += fx;
                target.components.Physics.velocityY += fy;
            }
            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
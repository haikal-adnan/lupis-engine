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
                    return phys.facingDirection || 'right';
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
    'set_face_direction': {
        execute(runner, node) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'in_target'));
            if (target && target.components.Physics) {
                const phys = target.components.Physics;

                const axisX = runner.getInputValue(node, 'axisX') ?? node.data?.values?.axisX ?? 0;
                const axisY = runner.getInputValue(node, 'axisY') ?? node.data?.values?.axisY ?? 0;
                const mode = runner.getInputValue(node, 'mode') || node.data?.values?.mode || '4-way';

                phys.customFacing = true;

                if (mode === 'horizontal') {
                    if (axisX > 0) phys.facingDirection = 'right';
                    else if (axisX < 0) phys.facingDirection = 'left';
                }
                else if (mode === 'vertical') {
                    if (axisY > 0) phys.facingDirection = 'down';
                    else if (axisY < 0) phys.facingDirection = 'up';
                }
                else if (mode === '4-way') {
                    // Logika 4-Way: Prioritaskan sumbu dengan input terbesar agar tidak macet di diagonal
                    if (Math.abs(axisX) > Math.abs(axisY)) {
                        phys.facingDirection = axisX > 0 ? 'right' : 'left';
                    } else if (Math.abs(axisY) > 0) {
                        phys.facingDirection = axisY > 0 ? 'down' : 'up';
                    }
                }
                else if (mode === '8-way') {
                    // Logika 8-Way: Mendukung kombinasi diagonal
                    if (axisX > 0 && axisY < 0) phys.facingDirection = 'up-right';
                    else if (axisX > 0 && axisY > 0) phys.facingDirection = 'down-right';
                    else if (axisX < 0 && axisY < 0) phys.facingDirection = 'up-left';
                    else if (axisX < 0 && axisY > 0) phys.facingDirection = 'down-left';
                    else if (axisX > 0) phys.facingDirection = 'right';
                    else if (axisX < 0) phys.facingDirection = 'left';
                    else if (axisY < 0) phys.facingDirection = 'up';
                    else if (axisY > 0) phys.facingDirection = 'down';
                }
            }
            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
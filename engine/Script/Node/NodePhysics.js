
export const NodePhysics = {
    'get_physics': {
        getOutput(runner, node, outputKey) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'target_in'));
            if (!target || !target.components.Physics) return null;

            const phys = target.components.Physics;

            switch (outputKey) {
                case 'isGrounded':
                    return phys.isGrounded;
                case 'movementState':
                    return phys.movementState || 'idle';
                case 'facingDirection':
                    return phys.facingDirection || 'right';
                case 'isFrozen':
                    return phys.isFrozen || false;
                default:
                    return phys[outputKey];
            }
        }
    },
    'set_physics': {
        execute(runner, node) {
            let targetId = runner.getInputValue(node, 'target_in');
            if (targetId === undefined && node.data?.values?.target_in !== undefined) {
                targetId = node.data.values.target_in;
            }

            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.Physics) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const phys = entity.components.Physics;

            const props = {
                velocityX: v => Number(v),
                velocityY: v => Number(v),
                mass: v => Number(v),
                gravityScale: v => Number(v),
                drag: v => Number(v),
                enabled: v => Boolean(v === 'true' || v === true),
                isFrozen: v => Boolean(v === 'true' || v === true)
            };

            Object.keys(props).forEach(key => {
                let rawVal = runner.getInputValue(node, key);
                
                if (rawVal === undefined && node.data?.values?.[key] !== undefined) {
                    rawVal = node.data.values[key];
                }

                if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                    const finalVal = props[key](rawVal);
                    phys[key] = finalVal;
                    
                    if (key === 'velocityX' || key === 'velocityY') {
                        phys._isIntentionalMove = Math.abs(finalVal) > 10;
                    }
                    
                    if (key === 'isFrozen' && finalVal === true) {
                        phys.velocityX = 0;
                        phys.velocityY = 0;
                    }
                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },
    'set_face_direction': {
        execute(runner, node) {
            const target = runner.resolveEntity(runner.getInputValue(node, 'target_in'));
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
                    if (Math.abs(axisX) > Math.abs(axisY)) {
                        phys.facingDirection = axisX > 0 ? 'right' : 'left';
                    } else if (Math.abs(axisY) > 0) {
                        phys.facingDirection = axisY > 0 ? 'down' : 'up';
                    }
                }
                else if (mode === '8-way') {
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
    },
    'move_and_slide': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);

            const phys = entity?.components?.Physics;

            if (phys && phys.isFrozen) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }
            
            const t = entity?.components?.UITransform || entity?.components?.Transform;
            
            if (!t) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const velX = runner.getInputValue(node, 'vel_x') ?? node.data?.values?.vel_x ?? 0;
            const velY = runner.getInputValue(node, 'vel_y') ?? node.data?.values?.vel_y ?? 0;

            const dt = runner.currentDt || 0.016;
            const hasPhysics = phys && phys.enabled;

            if (hasPhysics) {
                phys.velocityX = Number(velX); 
                
                if (phys.gravityScale !== 0 && Number(velY) === 0) {

                } else {
                    phys.velocityY = Number(velY);
                }

                phys._isIntentionalMove = Math.abs(Number(velX)) > 10 || Math.abs(Number(velY)) > 10;
            } else {
                const moveX = Number(velX) * dt;
                const moveY = Number(velY) * dt;

                if (runner.game.colliderSystem) {
                    runner.game.colliderSystem.moveAndSlide(entity, moveX, moveY);
                } else {
                    t.x += moveX;
                    t.y += moveY;
                }
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    },
};
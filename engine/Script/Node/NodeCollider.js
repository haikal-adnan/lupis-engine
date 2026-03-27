export const NodeCollider = {
    'solid_collision': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const filterTag = runner.getInputValue(node, 'filter_tag');
            const entity = runner.resolveEntity(targetId);

            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const collider = entity.components.Collider;
            if (!collider || !collider.data || !collider.data.some(c => c.enabled && c.type === 'solid')) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            let hitObject = runner.game.colliderSystem.checkSolid(entity);

            if (hitObject && filterTag && filterTag.trim() !== "") {
                const objTag = hitObject.tag || hitObject.components?.Tags?.value;
                if (objTag !== filterTag) {
                    hitObject = null; 
                }
            }

            const isColliding = !!hitObject;

            node._tempData = {
                hit_id: hitObject ? (hitObject.id || hitObject._id) : null,
                is_colliding: isColliding
            };

            runner.executeFlow(node._id, 'exec_out');

            if (hitObject) {
                runner.executeFlow(node._id, 'on_hit');
            }
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'hit_id') return node._tempData?.hit_id || null;
            if (outputKey === 'is_colliding') return node._tempData?.is_colliding || false;
            return null;
        }
    },

    'trigger_zone': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const filterTag = runner.getInputValue(node, 'filter_tag');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            if (!node._triggerStates) {
                node._triggerStates = {}; 
            }

            const entityId = entity.id || entity._id;
            
            let myState = node._triggerStates[entityId];
            if (!myState) {
                myState = { isOverlapping: false, lastId: null };
                node._triggerStates[entityId] = myState;
            }

            const collider = entity.components.Collider;
            if (!collider || !collider.data || !collider.data.some(c => c.enabled && c.type === 'trigger')) {
                myState.isOverlapping = false;
                myState.lastId = null;
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            let overlapObject = runner.game.colliderSystem.checkOverlap(entity, filterTag);
            const currentId = overlapObject ? (overlapObject.id || overlapObject._id) : null;
            const previousId = myState.lastId;
            
            const isCurrentlyOverlapping = !!currentId;
            
            let newData = {
                other_id: currentId || previousId,
                is_inside: isCurrentlyOverlapping
            };

            node._tempData = newData;

            if (!previousId && currentId) {
                myState.lastId = currentId;
                runner.executeFlow(node._id, 'on_enter');
            }
            
            else if (previousId && currentId && previousId !== currentId) {
                myState.lastId = currentId;
                runner.executeFlow(node._id, 'on_enter');
            }

            else if (previousId && !currentId) {
                myState.lastId = null;
                
                node._tempData = {
                    other_id: previousId,
                    is_inside: false
                };

                runner.executeFlow(node._id, 'on_exit');
                
                node._tempData = newData;
            }
            
            myState.isOverlapping = isCurrentlyOverlapping;

            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'other_id') return node._tempData?.other_id || null;
            if (outputKey === 'is_inside') return node._tempData?.is_inside || false;
            return null;
        }
    }
};
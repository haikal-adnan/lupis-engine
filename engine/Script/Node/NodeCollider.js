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

            const selfScriptId = entity.scriptId || entity.script_id || entity.id || entity._id;
            const hitScriptId = hitObject ? (hitObject.scriptId || hitObject.script_id || hitObject.id || hitObject._id) : null;

            node._tempData = {
                self_id: selfScriptId,
                hit_id: hitScriptId,
                is_colliding: !!hitObject
            };

            runner.executeFlow(node._id, 'exec_out');

            if (hitObject) {
                runner.executeFlow(node._id, 'on_hit');
            }
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'self_id') return node._tempData?.self_id || null;
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

            // Script ID untuk Objek Pemicu (Milik Target Utama)
            const triggerScriptId = entity.scriptId || entity.script_id || entity.id || entity._id;

            // Script ID untuk Objek Yang Dipicu (Milik Objek Lain yang Overlap)
            const currentId = overlapObject 
                ? (overlapObject.scriptId || overlapObject.script_id || overlapObject.id || overlapObject._id) 
                : null;
                
            const previousId = myState.lastId;
            const isCurrentlyOverlapping = !!currentId;
            
            let newData = {
                trigger_id: triggerScriptId,
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
                    trigger_id: triggerScriptId,
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
            if (outputKey === 'trigger_id') return node._tempData?.trigger_id || null;
            if (outputKey === 'other_id') return node._tempData?.other_id || null;
            if (outputKey === 'is_inside') return node._tempData?.is_inside || false;
            return null;
        }
    }
};
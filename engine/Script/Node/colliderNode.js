export const colliderNode = {
    // ------------------------------------------------------------------
    // Logic: SOLID COLLISION
    // ------------------------------------------------------------------
    'solid_collision': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const filterTag = runner.getInputValue(node, 'filter_tag');
            const entity = runner.resolveEntity(targetId);

            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // [FIX] Validasi Tipe Collider
            // Node ini HANYA boleh jalan jika Collidernya tipe SOLID
            const collider = entity.components.Collider;
            if (!collider || !collider.enabled || collider.type !== 'solid') {
                // Jika bukan solid, skip logic tabrakan fisik, langsung lewat
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            let hitObject = runner.game.colliderSystem.checkSolid(entity);

            // LOGIKA FILTER TAG
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

    // ------------------------------------------------------------------
    // Logic: TRIGGER ZONE
    // ------------------------------------------------------------------
    'trigger_zone': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const filterTag = runner.getInputValue(node, 'filter_tag'); 
            const entity = runner.resolveEntity(targetId);
            
            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // [FIX] Validasi Tipe Collider
            // Node ini HANYA boleh jalan jika Collidernya tipe TRIGGER
            const collider = entity.components.Collider;
            if (!collider || !collider.enabled || collider.type !== 'trigger') {
                // Jika ini tembok SOLID, dia tidak boleh menjalankan logic Trigger Zone (Overlap)
                // Kita reset state agar bersih, lalu return
                if (node._triggerState) {
                     node._triggerState.isOverlapping = false;
                     node._triggerState.lastId = null;
                }
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            if (!node._triggerState) {
                node._triggerState = { isOverlapping: false, lastId: null };
            }

            let overlapObject = runner.game.colliderSystem.checkOverlap(entity, filterTag);

            const currentId = overlapObject ? (overlapObject.id || overlapObject._id) : null;
            const previousId = node._triggerState.lastId;
            const isCurrentlyOverlapping = !!currentId;

            let newData = {
                other_id: currentId || node._triggerState.lastId,
                is_inside: isCurrentlyOverlapping
            };

            // --- STATE MACHINE ---

            // KONDISI 1: ENTER
            if (!previousId && currentId) {
                node._triggerState.lastId = currentId; 
                node._tempData = newData; 
                runner.executeFlow(node._id, 'on_enter');
            }
            
            // KONDISI 2: SWITCH
            else if (previousId && currentId && previousId !== currentId) {
                node._triggerState.lastId = currentId;
                node._tempData = newData;
                runner.executeFlow(node._id, 'on_enter');
            }

            // KONDISI 3: EXIT
            else if (previousId && !currentId) {
                node._triggerState.lastId = null;
                newData.is_inside = false; 
                newData.other_id = previousId; 
                
                node._tempData = newData;
                runner.executeFlow(node._id, 'on_exit');
            }
            
            node._triggerState.isOverlapping = isCurrentlyOverlapping;
            node._tempData = newData;

            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'other_id') return node._tempData?.other_id || null;
            if (outputKey === 'is_inside') return node._tempData?.is_inside || false;
            return null;
        }
    }
};
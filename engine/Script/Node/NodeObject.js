export const NodeObject = {
    'get_object': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target')
            const entity = runner.resolveEntity(targetId)
            if (!entity) return null

            switch(outputKey) {
                case 'entityId': return entity.scriptId
                case 'tagName': return entity.tag || 'Untagged'
                case 'active' : return entity.active  
                case 'visible' : return entity.visible
                case 'name': return entity.name || 'Unknown'
                default: return null
            }
        }
    },

    'set_object': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const newName = runner.getInputValue(node, 'name');
            const newTag = runner.getInputValue(node, 'tag');
            const newActive = runner.getInputValue(node, 'active');
            const newVisible = runner.getInputValue(node, 'visible');

            if (newName !== undefined && newName !== null) {
                entity.name = String(newName);
            }

            if (newTag !== undefined && newTag !== null) {
                entity.tag = String(newTag);
            }

            if (newActive !== undefined && newActive !== null) {
                entity.active = Boolean(newActive);
            }

            if (newVisible !== undefined && newVisible !== null) {
                entity.visible = Boolean(newVisible);
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    },
    'find_closest_by_tag': {
        getOutput: (runner, node, outputKey) => {
            const targetTag = runner.getInputValue(node, 'tag');
            const fromX = Number(runner.getInputValue(node, 'from_x')) || 0;
            const fromY = Number(runner.getInputValue(node, 'from_y')) || 0;

            const entities = runner.game.world.entities;
            let closestId = null;
            let minDistanceSq = Infinity; 

            for (let i = 0; i < entities.length; i++) {
                const other = entities[i];
                if (other.active === false) continue;
                
                // Menyamakan logika pembacaan tag dengan sistem Collider kamu
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue;

                const t = other.components?.Transform;
                if (!t) continue;

                const dx = t.x - fromX;
                const dy = t.y - fromY;
                const distSq = (dx * dx) + (dy * dy);

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestId = other.id || other._id || other.scriptId;
                }
            }

            if (outputKey === 'target_id') return closestId;
            if (outputKey === 'found') return closestId !== null;
            
            return null;
        }
    },
}
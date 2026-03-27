export const NodeObject = {
    'get_object': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);
            if (!entity) return null;

            switch(outputKey) {
                case 'entityId': return entity.scriptId;
                case 'tagName': return entity.tag || 'Untagged';
                case 'active' : return entity.active;  
                case 'visible' : return entity.visible;
                case 'name': return entity.name || 'Unknown';
                default: return null;
            }
        }
    },

    'set_object': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);
            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const props = {
                name: v => String(v),
                tag: v => String(v),
                active: v => Boolean(v),
                visible: v => Boolean(v)
            };

            Object.keys(props).forEach(key => {
                let rawVal = runner.getInputValue(node, key);
                
                if (rawVal === undefined && node.data?.values?.[key] !== undefined) {
                    rawVal = node.data.values[key];
                }

                if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                    entity[key] = props[key](rawVal);
                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },
    
    'find_closest_by_tag': {
        getOutput: (runner, node, outputKey) => {
            let targetTag = runner.getInputValue(node, 'tag');
            if (targetTag === undefined && node.data?.values?.tag !== undefined) targetTag = node.data.values.tag;

            let fromX = runner.getInputValue(node, 'from_x');
            if (fromX === undefined && node.data?.values?.from_x !== undefined) fromX = node.data.values.from_x;
            fromX = Number(fromX) || 0;

            let fromY = runner.getInputValue(node, 'from_y');
            if (fromY === undefined && node.data?.values?.from_y !== undefined) fromY = node.data.values.from_y;
            fromY = Number(fromY) || 0;

            const entities = runner.game.world.entities;
            let closestId = null;
            let minDistanceSq = Infinity; 

            for (let i = 0; i < entities.length; i++) {
                const other = entities[i];
                if (other.active === false) continue;
                
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue;

                const t = other.components?.Transform;
                if (!t) continue;

                const dx = t.x - fromX;
                const dy = t.y - fromY;
                const distSq = (dx * dx) + (dy * dy);

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestId = other.scriptId || other.id || other._id;
                }
            }

            if (outputKey === 'target_id') return closestId;
            if (outputKey === 'found') return closestId !== null;
            
            return null;
        }
    },
};
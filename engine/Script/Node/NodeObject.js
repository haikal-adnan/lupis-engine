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
    }
}
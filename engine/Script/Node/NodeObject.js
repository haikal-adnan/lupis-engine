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

    // --- TAMBAHAN BARU ---
    'set_object': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            
            // Safety check: jika entity tidak ada, skip tapi flow tetap lanjut
            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // 1. Ambil nilai input
            const newName = runner.getInputValue(node, 'name');
            const newTag = runner.getInputValue(node, 'tag');
            const newActive = runner.getInputValue(node, 'active');
            const newVisible = runner.getInputValue(node, 'visible');

            // 2. Logic Update Parsial
            // Hanya update properti jika nilainya TIDAK undefined dan TIDAK null.
            
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

            // 3. Lanjut ke node berikutnya
            runner.executeFlow(node._id, 'exec_out');
        }
    }
}
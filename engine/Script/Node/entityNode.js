export const entityNode = {
    // --- ENTITY INFO (Get ID & Tag) ---
    'get_entity_info': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target')
            const entity = runner.resolveEntity(targetId)
            
            if (!entity) return null

            switch(outputKey) {
                case 'entityId': return entity.id || entity._id
                case 'tagName': return entity.tag || 'Untagged'
                case 'name': return entity.name || 'Unknown'
                default: return null
            }
        }
    }
    // HAPUS set_transform & get_transform dari sini
}
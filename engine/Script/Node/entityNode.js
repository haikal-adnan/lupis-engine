export const entityNode = {
    'get_entity_info': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target')
            const entity = runner.resolveEntity(targetId)
            if (!entity) return null


            switch(outputKey) {
                case 'entityId': return entity.id
                case 'tagName': return entity.tag || 'Untagged'
                case 'name': return entity.name || 'Unknown'
                default: return null
            }
        }
    }
}
export const transformNode = {
    'set_transform': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target')
            const entity = runner.resolveEntity(targetId)
            
            if (!entity?.components?.Transform) return

            const t = entity.components.Transform
            const props = ['x', 'y', 'rotation', 'width', 'height', 'pivotX', 'pivotY']
            
            props.forEach(prop => {
                const val = runner.getInputValue(node, prop)
                if (val !== undefined && val !== null) t[prop] = Number(val)
            })
            
            // Lanjut ke node berikutnya
            runner.executeFlow(node._id, 'out')
        },
        // TAMBAHAN: Agar node ini bisa memberikan output data ke String Format
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target')
            const entity = runner.resolveEntity(targetId)
            if (!entity?.components?.Transform) return 0
            
            return entity.components.Transform[outputKey] || 0
        }
    },
    'get_transform': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target')
            const entity = runner.resolveEntity(targetId)
            if (!entity?.components?.Transform) return 0
            
            return entity.components.Transform[outputKey] || 0
        }
    }
}
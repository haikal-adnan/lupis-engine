export const transformNode = {
    'set_transform': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity?.components?.Transform) return;
            const t = entity.components.Transform;

            // [HAPUS] t.prevX = t.x; -> Sudah dihandle oleh Game._captureState()
            
            const props = ['x', 'y', 'rotation', 'width', 'height', 'pivotX', 'pivotY'];
            props.forEach(prop => {
                const val = runner.getInputValue(node, prop);
                if (val !== undefined && val !== null) t[prop] = Number(val);
            });
            
            runner.executeFlow(node._id, 'out');
        },
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
    },
    'translate': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'in_target');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity?.components?.Transform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const t = entity.components.Transform;

            const dt = runner.currentDt || 0.016; 
            const speedX = Number(runner.getInputValue(node, 'dx')) || 0;
            const speedY = Number(runner.getInputValue(node, 'dy')) || 0;

            t.x += speedX * dt;
            t.y += speedY * dt;

            runner.executeFlow(node._id, 'exec_out');
        }
    },
}
export const NodeTransform = {
    'get_transform': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);
            const t = entity?.components?.UITransform || entity?.components?.Transform;
            if (!t) return 0;
            
            if (outputKey === 'scaleX' || outputKey === 'scaleY') return t[outputKey] ?? 1;
            if (outputKey === 'pivotX' || outputKey === 'pivotY') return t[outputKey] ?? 0.5;
            if (outputKey === 'anchorX' || outputKey === 'anchorY') return t[outputKey] ?? 0.5;
            
            return t[outputKey] || 0;
        }
    },
    'set_transform': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);
            const t = entity?.components?.UITransform || entity?.components?.Transform;

            console.log(targetId)
            
            if (!t) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const props = ['x', 'y', 'rotation', 'width', 'height', 'pivotX', 'pivotY', 'scaleX', 'scaleY', 'anchorX', 'anchorY'];
            
            props.forEach(prop => {
                let val = runner.getInputValue(node, prop);
                if (val === undefined && node.data?.values?.[prop] !== undefined) {
                    val = node.data.values[prop];
                }
                if (val !== undefined && val !== null && !isNaN(val)) {
                    t[prop] = Number(val);
                }
            });
            
            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
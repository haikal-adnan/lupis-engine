export const NodeRenderer = {

    'set_sprite': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.SpriteRenderer) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const comp = entity.components.SpriteRenderer;

            const props = {
                assetId: v => String(v),
                color: v => String(v),
                opacity: v => Number(v),
                sourceX: v => Number(v),
                sourceY: v => Number(v),
                sourceWidth: v => Number(v),
                sourceHeight: v => Number(v),
            };

            Object.keys(props).forEach(key => {
                const rawVal = runner.getInputValue(node, key);
                if (rawVal !== undefined && rawVal !== null) {
                    comp[key] = props[key](rawVal);
                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_sprite': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.SpriteRenderer) return null;
            const comp = entity.components.SpriteRenderer;
            return comp[outputKey] !== undefined ? comp[outputKey] : null;
        }
    },

    'set_text': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.TextRenderer) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const comp = entity.components.TextRenderer;

            const props = {
                value: v => String(v),
                fontSize: v => Number(v),
                color: v => String(v),
                align: v => String(v),
                assetId: v => String(v),
                opacity: v => Number(v),
            };

            Object.keys(props).forEach(key => {
                const rawVal = runner.getInputValue(node, key);
                if (rawVal !== undefined && rawVal !== null) {
                    comp[key] = props[key](rawVal);
                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_text': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.TextRenderer) return null;
            const comp = entity.components.TextRenderer;
            return comp[outputKey] !== undefined ? comp[outputKey] : null;
        }
    },

    'set_shape': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.ShapeRenderer) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const comp = entity.components.ShapeRenderer;

            const props = {
                type: v => String(v),
                color: v => String(v),
                width: v => Number(v),
                height: v => Number(v),
                thickness: v => Number(v),
                opacity: v => Number(v),
            };

            Object.keys(props).forEach(key => {
                const rawVal = runner.getInputValue(node, key);
                if (rawVal !== undefined && rawVal !== null) {
                    comp[key] = props[key](rawVal);
                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_shape': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.ShapeRenderer) return null;
            const comp = entity.components.ShapeRenderer;
            return comp[outputKey] !== undefined ? comp[outputKey] : null;
        }
    },

    'set_tilemap': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.Tilemap) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const comp = entity.components.Tilemap;

            const props = {
                assetId: v => String(v),
                width: v => Number(v),
                height: v => Number(v),
                tileWidth: v => Number(v),
                tileHeight: v => Number(v),
                isSolid: v => Boolean(v),
                opacity: v => Number(v),
            };

            Object.keys(props).forEach(key => {
                const rawVal = runner.getInputValue(node, key);
                if (rawVal !== undefined && rawVal !== null) {
                    comp[key] = props[key](rawVal);
                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_tilemap': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target');
            const entity = runner.resolveEntity(targetId);
            if (!entity?.components?.Tilemap) return null;
            const comp = entity.components.Tilemap;
            return comp[outputKey] !== undefined ? comp[outputKey] : null;
        }
    },
};

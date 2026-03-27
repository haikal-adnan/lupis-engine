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
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);

            if (!entity?.components?.TextRenderer) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const comp = entity.components.TextRenderer;

            const props = {
                value: v => String(v),
                mode: v => String(v),
                assetId: v => String(v),
                fontSize: v => Number(v),
                color: v => String(v),
                opacity: v => Number(v) / 100,
                align: v => String(v),
                maxWidth: v => Number(v),
                maxLine: v => Number(v),
                lineSpacing: v => Number(v),
                letterSpacing: v => Number(v),
                overflow: v => String(v),
                autoFit: v => Boolean(v),
                smoothing: v => Number(v),
                bias: v => Number(v),
                outlineWidth: v => Number(v),
                outlineColor: v => String(v),
                shadowEnabled: v => Boolean(v),
                shadowColor: v => String(v),
                shadowOpacity: v => Number(v) / 100,
                shadowOffsetX: v => Number(v),
                shadowOffsetY: v => Number(v),
                shadowBlur: v => Number(v)
            };

            Object.keys(props).forEach(key => {
                let rawVal = runner.getInputValue(node, key);
                if (rawVal === undefined && node.data?.values?.[key] !== undefined) {
                    rawVal = node.data.values[key];
                }
                if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
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

    'batch_set': {
        execute: (runner, node) => {
            const steps = node.data?.steps || [];

            steps.forEach((step, index) => {
                let targetId = runner.getInputValue(node, `target_${index}`);
                
                // Fallback jika input kosong string
                if (!targetId || targetId.trim() === '') {
                    targetId = 'Self';
                }
                
                const entity = runner.resolveEntity(targetId);
                if (!entity) return; // Skip jika entitas tidak ditemukan di world

                const rawVal = runner.getInputValue(node, `val_${index}`);
                
                if (rawVal !== undefined && rawVal !== null) {
                    
                    // 1. Jika target operasinya adalah Root Data (Entity)
                    if (step.component === 'Entity') {

                        const rootProps = {
                            name: v => String(v),
                            tag: v => String(v),
                            type: v => String(v),
                            zIndex: v => Number(v),
                            orderIndex: v => Number(v),
                            active: v => Boolean(v),
                            visible: v => Boolean(v),
                            locked: v => Boolean(v)
                        };

                        if (rootProps[step.property]) {

                            entity[step.property] = rootProps[step.property](rawVal);

                        }
                    } 
                    // 2. Jika target operasinya adalah Component (berada di dalam entity.components)
                    else if (entity.components && entity.components[step.component]) {
                        const comp = entity.components[step.component];
                        // Asumsi properti komponen sudah di-handle tipe datanya oleh UI/Visual Scripting input
                        comp[step.property] = rawVal; 
                    }

                }
            });

            runner.executeFlow(node._id, 'exec_out');
        }
    },
};
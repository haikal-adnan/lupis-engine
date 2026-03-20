export const NodeCollectionHelper = {
    'get_from_path': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;

            const collection = runner.getInputValue(node, 'collection');
            const pathInput = runner.getInputValue(node, 'path_in');
            
            const pathString = (pathInput != null && pathInput !== "") ? pathInput : node.data?.values?.path;

            if (!collection || !pathString) return collection;

            try {
                // Regex untuk memecah path seperti "players[0].stats.hp" menjadi ["players", "0", "stats", "hp"]
                const parts = pathString.split(/[.\[\]]+/).filter(p => p !== "");
                let current = collection;

                for (const part of parts) {
                    if (current === null || current === undefined) return null;

                    if (Array.isArray(current)) {
                        const idx = parseInt(part);
                        if (isNaN(idx) || idx < 0 || idx >= current.length) return null;
                        current = current[idx];
                    } else if (typeof current === 'object') {
                        if (!(part in current)) return null;
                        current = current[part];
                    } else {
                        return null;
                    }
                }
                return current !== undefined ? current : null;
            } catch (err) {
                console.warn(`[LupisEngine] GetPath error: ${err.message}`);
                return null;
            }
        }
    },

    'set_from_path': {
        execute: (runner, node) => {
            const collection = runner.getInputValue(node, 'collection');
            const pathInput = runner.getInputValue(node, 'path_in');
            const valInput = runner.getInputValue(node, 'value');
            
            const pathString = (pathInput != null && pathInput !== "") ? pathInput : node.data?.values?.path;
            const newValue = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (!collection || typeof collection !== 'object' || !pathString) {
                node._tempData = { collection_out: collection, value_out: null };
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            try {
                const parts = pathString.split(/[.\[\]]+/).filter(p => p !== "");
                
                if (parts.length > 0) {
                    let current = collection;

                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i];

                        // Jika path belum ada, buat Object/Array baru secara dinamis
                        if (current[part] === undefined || current[part] === null) {
                            const nextPart = parts[i + 1];
                            const isNextIndex = !isNaN(parseInt(nextPart));
                            current[part] = isNextIndex ? [] : {};
                        }

                        current = current[part];

                        if (typeof current !== 'object') {
                            throw new Error(`Cannot traverse through primitive value at '${part}'.`);
                        }
                    }

                    const lastPart = parts[parts.length - 1];

                    if (Array.isArray(current)) {
                        const idx = parseInt(lastPart);
                        if (!isNaN(idx) && idx >= 0) {
                            current[idx] = newValue;
                        }
                    } else {
                        current[lastPart] = newValue;
                    }
                }
            } catch (err) {
                console.warn(`[LupisEngine] SetPath Error: ${err.message}`);
            }

            node._tempData = { collection_out: collection, value_out: newValue };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'collection_out') return node._tempData?.collection_out;
            if (outputKey === 'value_out') return node._tempData?.value_out;
            return null;
        }
    },

    'clone_collection': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'cloned') return null;
            const collection = runner.getInputValue(node, 'collection');
            
            if (collection === undefined || collection === null) return collection;
            
            // Deep copy menggunakan JSON parse/stringify (cukup aman untuk struktur data standar visual scripting)
            try {
                return JSON.parse(JSON.stringify(collection));
            } catch (err) {
                console.warn(`[LupisEngine] Clone error: Data contains non-serializable objects.`);
                return collection;
            }
        }
    },

    'is_collection_empty': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return false;
            const collection = runner.getInputValue(node, 'collection');

            if (!collection) return true;
            
            if (Array.isArray(collection)) {
                return collection.length === 0;
            }
            if (typeof collection === 'object') {
                return Object.keys(collection).length === 0;
            }
            return false; // Jika tipe datanya primitif (string/number), dikembalikan false
        }
    }
};
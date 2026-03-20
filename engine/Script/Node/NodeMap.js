export const NodeMap = {
    'map_set': {
        execute: (runner, node) => {
            const mapData = runner.getInputValue(node, 'map');
            const keyInput = runner.getInputValue(node, 'key');
            const valInput = runner.getInputValue(node, 'value');

            const key = (keyInput !== undefined && keyInput !== null && keyInput !== "") ? keyInput : node.data?.values?.key;
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (mapData && typeof mapData === 'object' && key != null && key !== "") {
                mapData[key] = value;
            }
            
            node._tempData = { map_out: mapData };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'map_out' ? node._tempData?.map_out : null
    },

    'map_merge': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result_map') return null;
            const mapA = runner.getInputValue(node, 'map_a') || {};
            const mapB = runner.getInputValue(node, 'map_b') || {};

            if (typeof mapA === 'object' && typeof mapB === 'object') {
                return { ...mapA, ...mapB };
            }
            return null;
        }
    },

    'map_put_if_absent': {
        execute: (runner, node) => {
            const mapData = runner.getInputValue(node, 'map');
            const keyInput = runner.getInputValue(node, 'key');
            const valInput = runner.getInputValue(node, 'value');

            const key = (keyInput !== undefined && keyInput !== null && keyInput !== "") ? keyInput : node.data?.values?.key;
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            let wasAdded = false;

            if (mapData && typeof mapData === 'object' && key != null && key !== "") {
                if (!Object.prototype.hasOwnProperty.call(mapData, key)) {
                    mapData[key] = value;
                    wasAdded = true;
                }
            }
            
            node._tempData = { was_added: wasAdded, map_out: mapData };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'was_added') return node._tempData?.was_added || false;
            if (outputKey === 'map_out') return node._tempData?.map_out;
            return null;
        }
    },

    'map_get': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'value') return null;
            const mapData = runner.getInputValue(node, 'map');
            const keyInput = runner.getInputValue(node, 'key');
            
            const key = (keyInput !== undefined && keyInput !== null && keyInput !== "") ? keyInput : node.data?.values?.key;

            if (mapData && typeof mapData === 'object' && key != null && key !== "") {
                return mapData[key] !== undefined ? mapData[key] : null;
            }
            return null;
        }
    },

    'map_has': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return false;
            const mapData = runner.getInputValue(node, 'map');
            const keyInput = runner.getInputValue(node, 'key');
            
            const key = (keyInput !== undefined && keyInput !== null && keyInput !== "") ? keyInput : node.data?.values?.key;

            if (mapData && typeof mapData === 'object' && key != null && key !== "") {
                return Object.prototype.hasOwnProperty.call(mapData, key);
            }
            return false;
        }
    },

    'map_remove': {
        execute: (runner, node) => {
            const mapData = runner.getInputValue(node, 'map');
            const keyInput = runner.getInputValue(node, 'key');
            
            const key = (keyInput !== undefined && keyInput !== null && keyInput !== "") ? keyInput : node.data?.values?.key;

            if (mapData && typeof mapData === 'object' && key != null && key !== "") {
                delete mapData[key];
            }
            
            node._tempData = { map_out: mapData };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'map_out' ? node._tempData?.map_out : null
    },

    'map_clear': {
        execute: (runner, node) => {
            const mapData = runner.getInputValue(node, 'map');
            
            if (mapData && typeof mapData === 'object') {
                for (const key in mapData) {
                    if (Object.prototype.hasOwnProperty.call(mapData, key)) {
                        delete mapData[key];
                    }
                }
            }
            
            node._tempData = { map_out: mapData };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'map_out' ? node._tempData?.map_out : null
    },

    'map_keys': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'keys_list') return [];
            const mapData = runner.getInputValue(node, 'map');
            
            if (mapData && typeof mapData === 'object') {
                return Object.keys(mapData);
            }
            return [];
        }
    },

    'map_values': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'values_list') return [];
            const mapData = runner.getInputValue(node, 'map');
            
            if (mapData && typeof mapData === 'object') {
                return Object.values(mapData);
            }
            return [];
        }
    },

    'map_size': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'size') return 0;
            const mapData = runner.getInputValue(node, 'map');
            
            if (mapData && typeof mapData === 'object') {
                return Object.keys(mapData).length;
            }
            return 0;
        }
    },

    'map_get_or_default': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'value') return null;
            
            const mapData = runner.getInputValue(node, 'map');
            const keyInput = runner.getInputValue(node, 'key');
            const defInput = runner.getInputValue(node, 'defaultVal');

            const key = (keyInput !== undefined && keyInput !== null && keyInput !== "") ? keyInput : node.data?.values?.key;
            const defaultVal = (defInput !== undefined && defInput !== null) ? defInput : node.data?.values?.defaultVal;

            if (mapData && typeof mapData === 'object' && key != null && key !== "") {
                return mapData[key] !== undefined ? mapData[key] : defaultVal;
            }
            return defaultVal;
        }
    }
};
export const NodeList = {
    'list_push': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            const valInput = runner.getInputValue(node, 'value');
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (Array.isArray(list)) list.push(value);
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_insert': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            const idxInput = runner.getInputValue(node, 'index');
            const valInput = runner.getInputValue(node, 'value');

            const index = (idxInput !== undefined && idxInput !== null) ? idxInput : node.data?.values?.index;
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (Array.isArray(list) && index !== undefined && index >= 0 && index <= list.length) {
                list.splice(index, 0, value);
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_concat': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result_list') return null;
            const listA = runner.getInputValue(node, 'list_a') || [];
            const listB = runner.getInputValue(node, 'list_b') || [];

            if (Array.isArray(listA) && Array.isArray(listB)) {
                return listA.concat(listB);
            }
            return null;
        }
    },

    'list_get': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'item') return null;
            const list = runner.getInputValue(node, 'list');
            const idxInput = runner.getInputValue(node, 'index');
            const index = (idxInput !== undefined && idxInput !== null) ? idxInput : node.data?.values?.index;

            if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
                return list[index];
            }
            return null;
        }
    },

    'list_index_of': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'index') return -1;
            const list = runner.getInputValue(node, 'list');
            const valInput = runner.getInputValue(node, 'value');
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (Array.isArray(list)) {
                return list.indexOf(value);
            }
            return -1;
        }
    },

    'list_set': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            const idxInput = runner.getInputValue(node, 'index');
            const valInput = runner.getInputValue(node, 'value');

            const index = (idxInput !== undefined && idxInput !== null) ? idxInput : node.data?.values?.index;
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
                list[index] = value;
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_fill': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            const valInput = runner.getInputValue(node, 'value');
            const startInput = runner.getInputValue(node, 'start');
            const endInput = runner.getInputValue(node, 'end');

            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;
            const start = (startInput !== undefined && startInput !== null) ? startInput : node.data?.values?.start;
            let end = (endInput !== undefined && endInput !== null) ? endInput : node.data?.values?.end;

            if (Array.isArray(list)) {
                if (!end || end <= 0) end = list.length;
                list.fill(value, start || 0, end);
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_remove_at': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            const idxInput = runner.getInputValue(node, 'index');
            const index = (idxInput !== undefined && idxInput !== null) ? idxInput : node.data?.values?.index;

            if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
                list.splice(index, 1);
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_remove_value': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            const valInput = runner.getInputValue(node, 'value');
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (Array.isArray(list)) {
                const idx = list.indexOf(value);
                if (idx > -1) list.splice(idx, 1);
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_clear': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            if (Array.isArray(list)) {
                list.length = 0; 
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_sort': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            if (Array.isArray(list)) list.sort();
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_shuffle': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            if (Array.isArray(list)) {
                for (let i = list.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [list[i], list[j]] = [list[j], list[i]];
                }
            }
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_reverse': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');
            if (Array.isArray(list)) list.reverse();
            
            node._tempData = { list_out: list };
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => outputKey === 'list_out' ? node._tempData?.list_out : null
    },

    'list_length': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'length') return 0;
            const list = runner.getInputValue(node, 'list');
            return Array.isArray(list) ? list.length : 0;
        }
    },

    'list_contains': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return false;
            const list = runner.getInputValue(node, 'list');
            const valInput = runner.getInputValue(node, 'value');
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            return Array.isArray(list) ? list.includes(value) : false;
        }
    },

    'list_filter': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'filtered_list') return null;
            const list = runner.getInputValue(node, 'list');
            const propInput = runner.getInputValue(node, 'property');
            const valInput = runner.getInputValue(node, 'value');

            const property = (propInput !== undefined && propInput !== null) ? propInput : node.data?.values?.property;
            const value = (valInput !== undefined && valInput !== null) ? valInput : node.data?.values?.value;

            if (!Array.isArray(list)) return [];

            return list.filter(item => {
                if (property && typeof item === 'object' && item !== null) {
                    return item[property] == value; 
                }
                return item == value;
            });
        }
    },

    'list_get_random': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'item') return null;
            const list = runner.getInputValue(node, 'list');
            if (Array.isArray(list) && list.length > 0) {
                const randomIndex = Math.floor(Math.random() * list.length);
                return list[randomIndex];
            }
            return null;
        }
    }
};
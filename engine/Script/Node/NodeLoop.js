export const NodeLoop = {
    'logic_loop': { 
        execute: async (runner, node) => { 
            const startInput = runner.getInputValue(node, 'start');
            const endInput = runner.getInputValue(node, 'end');
            const stepInput = runner.getInputValue(node, 'step');

            const start = startInput !== undefined && startInput !== null ? Number(startInput) : (node.data?.values?.start || 0);
            const end = endInput !== undefined && endInput !== null ? Number(endInput) : (node.data?.values?.end || 0);
            let step = stepInput !== undefined && stepInput !== null ? Number(stepInput) : (node.data?.values?.step || 1);

            if (step === 0) step = 1;

            if (step > 0) {
                for (let i = start; i <= end; i += step) {
                    node._tempLoopIndex = i;
                    await runner.executeFlow(node._id, 'loop_body'); 
                }
            } else {
                for (let i = start; i >= end; i += step) {
                    node._tempLoopIndex = i;
                    await runner.executeFlow(node._id, 'loop_body'); 
                }
            }
            
            await runner.executeFlow(node._id, 'completed');
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'index' ? (node._tempLoopIndex || 0) : 0;
        }
    },

    'logic_for_each': {
        execute: (runner, node) => {
            const list = runner.getInputValue(node, 'list');

            if (Array.isArray(list)) {
                for (let i = 0; i < list.length; i++) {
                    node._tempIndex = i;
                    node._tempItem = list[i];
                    runner.executeFlow(node._id, 'loop_body'); 
                }
            }

            runner.executeFlow(node._id, 'completed');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'index') return node._tempIndex !== undefined ? node._tempIndex : -1;
            if (outputKey === 'item') return node._tempItem !== undefined ? node._tempItem : null;
            return null;
        }
    },

    'logic_while': {
        execute: (runner, node) => { 
            let iterations = 0;
            const LIMIT = 5000; 

            while (runner.getInputValue(node, 'condition') === true) {
                iterations++;
                if (iterations > LIMIT) {
                    console.error(`[LupisEngine] Infinite Loop Terdeteksi pada Node While! Dihentikan paksa.`);
                    break;
                }
                runner.executeFlow(node._id, 'loop_body'); 
            }
            runner.executeFlow(node._id, 'completed');
        }
    }
};
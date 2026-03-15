export const NodeLogic = {
    'logic_branch': {
        execute: (runner, node) => {
            const branches = node.data?.branches || [];

            if (runner.getInputValue(node, 'cond_0')) {
                runner.executeFlow(node._id, 'out_0');
                return; 
            }

            for (let i = 0; i < branches.length; i++) {
                const bType = branches[i];
                
                if (bType === 'else_if') {
                    if (runner.getInputValue(node, `cond_${i + 1}`)) {
                        runner.executeFlow(node._id, `out_${i + 1}`);
                        return; 
                    }
                } else if (bType === 'else') {
                    runner.executeFlow(node._id, 'out_else');
                    return;
                }
            }

            runner.executeFlow(node._id, 'out_false');
        }
    },
    'logic_switch': {
        execute: (runner, node) => {
            const rawValue = runner.getInputValue(node, 'value');
            const cases = node.data?.cases || [];
            const dataType = node.data?.dataType || 'string';

            let checkValue;
            if (dataType === 'number') {
                checkValue = Number(rawValue);
            } else if (dataType === 'boolean') {
                checkValue = Boolean(rawValue);
            } else {
                checkValue = String(rawValue || '');
            }

            const matchIndex = cases.findIndex(c => {
                if (dataType === 'number') return Number(c) === checkValue;
                if (dataType === 'boolean') return Boolean(c) === checkValue;
                return String(c) === checkValue;
            });

            if (matchIndex !== -1) {
                runner.executeFlow(node._id, `out_case_${matchIndex}`);
            } else {
                runner.executeFlow(node._id, 'out_default');
            }
        }
    },
    'logic_flow_merge': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        }
    },
    'logic_and': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a && b) : false
        }
    },
    'logic_or': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a || b) : false
        }
    },
    'logic_loop': { 
        execute: (runner, node) => {
            const start = Number(runner.getInputValue(node, 'start')) || 0
            const end = Number(runner.getInputValue(node, 'end')) || 0
            
            for (let i = start; i < end; i++) {
                runner._tempLoopIndex = i 
                runner.executeFlow(node._id, 'loop') 
            }
            runner.executeFlow(node._id, 'completed')
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'index' ? (runner._tempLoopIndex || 0) : 0
        }
    },

    'logic_flow_merge': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        },
        getOutput: () => null
    }
}
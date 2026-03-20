export const NodeComparison = {
    'logic_compare': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'res') return false;
            
            const a = runner.getInputValue(node, 'a');
            const b = runner.getInputValue(node, 'b');
            const op = node.data?.op || 'equal';

            const valA = isNaN(Number(a)) || a === "" ? a : Number(a);
            const valB = isNaN(Number(b)) || b === "" ? b : Number(b);
            
            switch (op) {
                case 'equal': return valA == valB;
                case 'not_equal': return valA != valB;
                case 'greater': return valA > valB;
                case 'less': return valA < valB;
                case 'greater_equal': return valA >= valB;
                case 'less_equal': return valA <= valB;
                default: return false;
            }
        }
    },
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
            if (dataType === 'number') checkValue = Number(rawValue);
            else if (dataType === 'boolean') checkValue = Boolean(rawValue);
            else checkValue = String(rawValue || '');

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
    }
};
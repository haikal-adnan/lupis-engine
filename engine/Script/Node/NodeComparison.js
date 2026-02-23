export const NodeComparison = {
    'logic_compare': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a');
            const b = runner.getInputValue(node, 'b');
            const op = node.data?.op || 'equal';

            const valA = isNaN(Number(a)) || a === "" ? a : Number(a);
            const valB = isNaN(Number(b)) || b === "" ? b : Number(b);

            if (outputKey === 'res') {
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
            return false;
        }
    }
}
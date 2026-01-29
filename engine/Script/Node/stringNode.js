export const stringNode = {
    'format_string': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        },
        
        getOutput: (runner, node, outputKey) => {
            
            let rawFormat = node.data?.format;
            let formatStr = (rawFormat !== undefined && rawFormat !== null) ? String(rawFormat) : "";
            
            const getVal = (idx) => {
                return runner.getInputValue(node, String(idx));
            };

            if (formatStr.trim().length === 0) {
                const results = [];
                for (let i = 0; i < 10; i++) {
                    const val = getVal(i);
                    if (val !== undefined && val !== null) {
                        results.push(typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : val);
                    }
                }
                return results.join(" ");
            }

            for (let i = 0; i < 10; i++) {
                const val = getVal(i);
                if (val !== undefined && val !== null) {
                    const displayVal = (typeof val === 'number' && !Number.isInteger(val)) ? val.toFixed(2) : val;
                    const placeholder = `{${i}}`; 
                    formatStr = formatStr.split(placeholder).join(String(displayVal));
                }
            }
            return formatStr;
        }
    }
}
export const NodeString = {
    'string_format': {
        getOutput: (runner, node, outputKey) => {
            let rawFormat = node.data?.format;
            let formatStr = (rawFormat !== undefined && rawFormat !== null) ? String(rawFormat) : "";

            const getVal = (idx) => runner.getInputValue(node, String(idx));

            for (let i = 0; i < 10; i++) {
                const val = getVal(i);
                if (val !== undefined && val !== null) {
                    const displayVal = (typeof val === 'number' && !Number.isInteger(val)) ? val.toFixed(2) : val;
                    formatStr = formatStr.split(`{${i}}`).join(String(displayVal));
                }
            }
            return formatStr;
        }
    },

    'string_join': {
        getOutput: (runner, node, outputKey) => {
            const separator = node.data?.separator || "";
            const valA = runner.getInputValue(node, 'a');
            const valB = runner.getInputValue(node, 'b');

            const strA = (valA !== undefined && valA !== null) ? String(valA) : "";
            const strB = (valB !== undefined && valB !== null) ? String(valB) : "";

            return strA + separator + strB;
        }
    },

    'string_length': {
        getOutput: (runner, node, outputKey) => {
            const val = runner.getInputValue(node, 'str_in');
            if (val === undefined || val === null) return 0;
            return String(val).length;
        }
    },

    'number_to_string': {
        getOutput: (runner, node, outputKey) => {
            const val = runner.getInputValue(node, 'in_val');
            
            if (val === undefined || val === null) return "0";

            const decimals = node.data?.decimals;

            if (typeof val === 'number' && decimals !== undefined && decimals !== null && decimals >= 0) {
                return val.toFixed(Number(decimals));
            }

            return String(val);
        }
    }
};
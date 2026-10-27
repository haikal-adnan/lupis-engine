export const NodeString = {
    'string_format': {
        getOutput: (runner, node, outputKey) => {
            const formats = node.data?.formats || (node.data?.format ? [node.data.format] : [""]);
            
            let formatIndex = 0;
            if (outputKey && outputKey.startsWith('res_')) {
                formatIndex = parseInt(outputKey.replace('res_', ''), 10);
            }

            let rawFormat = formats[formatIndex];
            let formatStr = (rawFormat !== undefined && rawFormat !== null) ? String(rawFormat) : "";

            return formatStr.replace(/{([^{}]+)}/g, (match, path) => {
                const parts = path.split('.');
                const varName = parts[0].trim();
                
                const matchingPorts = (node.inputs || []).filter(p => p.label === varName);
                
                let finalVal = undefined;

                for (const port of matchingPorts) {
                    let edgeVal = runner.getInputValue(node, port._id);
                    if (edgeVal !== undefined && edgeVal !== null && edgeVal !== "") {
                        finalVal = edgeVal;
                        break; 
                    }
                }

                if (finalVal === undefined || finalVal === null || finalVal === "") {
                    for (const port of matchingPorts) {
                        let manualVal = node.data?.values?.[port._id];
                        if (manualVal !== undefined && manualVal !== null && manualVal !== "") {
                            finalVal = manualVal;
                            break;
                        }
                    }
                }

                if (finalVal !== undefined && finalVal !== null && finalVal !== "") {
                    
                    if (parts.length > 1 && typeof finalVal === 'object') {
                        for (let i = 1; i < parts.length; i++) {
                            const prop = parts[i].trim();
                            if (finalVal[prop] === undefined) {
                                finalVal = undefined;
                                break;
                            }
                            finalVal = finalVal[prop];
                        }
                    }

                    if (finalVal !== undefined && finalVal !== null) {
                        if (typeof finalVal === 'object' && !Array.isArray(finalVal)) {
                            return JSON.stringify(finalVal);
                        }
                        return (typeof finalVal === 'number' && !Number.isInteger(finalVal)) 
                            ? finalVal.toFixed(2) 
                            : String(finalVal);
                    }
                }
                
                return ""; 
            });
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

    'any_to_string': {
        getOutput: (runner, node, outputKey) => {
            const val = runner.getInputValue(node, 'in_val');
            
            if (val === undefined || val === null) return "null";

            if (typeof val === 'number') {
                const decimals = node.data?.decimals;
                if (decimals !== undefined && decimals !== null && decimals >= 0) {
                    return val.toFixed(Number(decimals));
                }
                return String(val);
            }

            if (typeof val === 'object') {
                try {
                    const isPretty = node.data?.pretty !== false;
                    return JSON.stringify(val, null, isPretty ? 2 : 0);
                } catch (err) {
                    return "[Complex Object]";
                }
            }

            return String(val);
        }
    },
    
};
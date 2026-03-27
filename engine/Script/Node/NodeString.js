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
                
                // Kumpulkan SEMUA port yang labelnya sama dengan variabel 
                // (Ini mencegah bug 'Ghost Port' jika ada duplikasi ID di background)
                const matchingPorts = (node.inputs || []).filter(p => p.label === varName);
                
                let finalVal = undefined;

                // PRIORITAS 1: EDGE (Kabel)
                for (const port of matchingPorts) {
                    let edgeVal = runner.getInputValue(node, port._id);
                    // Abaikan jika edge belum tersambung atau mengirim nilai kosong
                    if (edgeVal !== undefined && edgeVal !== null && edgeVal !== "") {
                        finalVal = edgeVal;
                        break; 
                    }
                }

                // PRIORITAS 2: INPUTAN UI (Manual)
                // Hanya dieksekusi jika dari Edge benar-benar kosong
                if (finalVal === undefined || finalVal === null || finalVal === "") {
                    for (const port of matchingPorts) {
                        let manualVal = node.data?.values?.[port._id];
                        if (manualVal !== undefined && manualVal !== null && manualVal !== "") {
                            finalVal = manualVal;
                            break;
                        }
                    }
                }

                // Jika nilai berhasil didapatkan (dari Edge atau Inputan)
                if (finalVal !== undefined && finalVal !== null && finalVal !== "") {
                    
                    // Jika ada dot notation (misal: dialog_id.text)
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

                    // Format hasil akhir
                    if (finalVal !== undefined && finalVal !== null) {
                        if (typeof finalVal === 'object' && !Array.isArray(finalVal)) {
                            return JSON.stringify(finalVal);
                        }
                        return (typeof finalVal === 'number' && !Number.isInteger(finalVal)) 
                            ? finalVal.toFixed(2) 
                            : String(finalVal);
                    }
                }
                
                // Jika data benar-benar tidak ada di Edge maupun Inputan, return string kosong
                // agar tidak muncul tulisan "{dialog_id}" secara mentah di hasil akhir
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
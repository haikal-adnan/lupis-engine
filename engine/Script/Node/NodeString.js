export const NodeString = {
    // 1. FORMAT STRING (Updated from your code)
    'string_format': {
        getOutput: (runner, node, outputKey) => {
            let rawFormat = node.data?.format;
            let formatStr = (rawFormat !== undefined && rawFormat !== null) ? String(rawFormat) : "";

            // Helper untuk mengambil input 0-9
            const getVal = (idx) => runner.getInputValue(node, String(idx));

            // Logic replace {0}, {1}, dst
            for (let i = 0; i < 10; i++) {
                const val = getVal(i);
                if (val !== undefined && val !== null) {
                    const displayVal = (typeof val === 'number' && !Number.isInteger(val)) ? val.toFixed(2) : val;
                    // Replace all occurrences
                    formatStr = formatStr.split(`{${i}}`).join(String(displayVal));
                }
            }
            return formatStr;
        }
    },

    // 2. JOIN STRINGS (Logic Baru)
    'string_join': {
        getOutput: (runner, node, outputKey) => {
            const separator = node.data?.separator || "";
            const valA = runner.getInputValue(node, 'a');
            const valB = runner.getInputValue(node, 'b');

            const strA = (valA !== undefined && valA !== null) ? String(valA) : "";
            const strB = (valB !== undefined && valB !== null) ? String(valB) : "";

            // Jika separatornya koma, tapi salah satu kosong, logic bisa disesuaikan
            // Tapi standard join adalah tempel mentah-mentah
            return strA + separator + strB;
        }
    },

    // 3. STRING LENGTH (Logic Baru)
    'string_length': {
        getOutput: (runner, node, outputKey) => {
            const val = runner.getInputValue(node, 'str_in');
            if (val === undefined || val === null) return 0;
            return String(val).length;
        }
    },

    // 4. NUMBER TO STRING (Logic Baru)
    'number_to_string': {
        getOutput: (runner, node, outputKey) => {
            const val = runner.getInputValue(node, 'in_val');
            
            // Jika input null/undefined, return "0" atau string kosong
            if (val === undefined || val === null) return "0";

            // Cek setting 'decimals' (misal: 2 angka di belakang koma)
            const decimals = node.data?.decimals;

            if (typeof val === 'number' && decimals !== undefined && decimals !== null && decimals >= 0) {
                return val.toFixed(Number(decimals));
            }

            return String(val);
        }
    }
};
export const NodeRandom = {
    'random_smart': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;
            
            // Ambil dari input pin, jika kosong gunakan data.values dari UI node
            const minIn = runner.getInputValue(node, 'min');
            const maxIn = runner.getInputValue(node, 'max');

            const min = (minIn !== undefined && minIn !== null) ? minIn : node.data?.values?.min;
            const max = (maxIn !== undefined && maxIn !== null) ? maxIn : node.data?.values?.max;

            // Pastikan nilai dikonversi ke Number agar aman
            const numMin = Number(min ?? 0);
            const numMax = Number(max ?? 1);

            // Deteksi Pintar (Smart Detection): 
            // Jika kedua input adalah bilangan bulat, hasilkan bilangan bulat.
            // Jika salah satu/keduanya desimal, hasilkan angka desimal.
            if (Number.isInteger(numMin) && Number.isInteger(numMax)) {
                return Math.floor(Math.random() * (numMax - numMin + 1)) + numMin;
            } else {
                return Math.random() * (numMax - numMin) + numMin;
            }
        }
    },

    'random_boolean': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;
            
            // Langsung mengembalikan true atau false (peluang 50:50)
            return Math.random() < 0.5;
        }
    },

    'random_from_list': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'item') return null;
            
            const list = runner.getInputValue(node, 'list');
            
            // Mengambil satu elemen acak dari Array
            if (Array.isArray(list) && list.length > 0) {
                const randomIndex = Math.floor(Math.random() * list.length);
                return list[randomIndex];
            }
            return null;
        }
    },

    'random_chance': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'result') return null;
            
            const chanceIn = runner.getInputValue(node, 'chance');
            const chance = (chanceIn !== undefined && chanceIn !== null) ? chanceIn : node.data?.values?.chance;
            
            const numChance = Number(chance ?? 50);

            // Logika weighted chance (0 - 100%)
            // Mengembalikan true jika berhasil masuk persentase, false jika gagal
            return (Math.random() * 100) < numChance;
        }
    },

    'random_color': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey !== 'color') return null;
            
            // Menghasilkan angka acak dari 0 hingga 16777215 (FFFFFF dalam hex),
            // lalu dikonversi ke string berbasis 16 (hexadecimal).
            // padStart digunakan untuk memastikan selalu 6 digit jika kebetulan angkanya kecil.
            const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            
            return `#${randomHex}`;
        }
    }
};
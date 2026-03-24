export const NodeHelper = {
    'logic_flow_merge': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        }
    },
    
    // DELAY: Hanya menunda eksekusi (cocok untuk durasi attack)
    'logic_delay': {
        execute: async (runner, node) => {
            const durationInput = runner.getInputValue(node, 'duration');
            const duration = durationInput !== undefined && durationInput !== null 
                ? Number(durationInput)
                : (node.data?.values?.duration || 500); // ms
            
            // Jeda secara asinkron (menunggu mandiri)
            await new Promise(resolve => setTimeout(resolve, duration));
            
            // Lanjut ke node berikutnya setelah waktu habis
            runner.executeFlow(node._id, 'out');
        }
    },

    // COOLDOWN: Sebagai gerbang anti-spam (tidak menunggu, langsung putuskan)
    'logic_cooldown': {
        execute: (runner, node) => {
            const durationInput = runner.getInputValue(node, 'duration');
            const targetDuration = durationInput !== undefined && durationInput !== null 
                ? Number(durationInput) 
                : (node.data?.values?.duration || 500); // ms
            
            const currentTime = Date.now(); // Ambil waktu sistem saat ini dalam milidetik

            // Inisialisasi jika belum pernah dieksekusi sebelumnya
            if (node._lastExecuteTime === undefined) {
                node._lastExecuteTime = 0; 
            }

            // Cek: Apakah waktu sekarang sudah melewati (waktu eksekusi terakhir + cooldown)?
            if (currentTime - node._lastExecuteTime >= targetDuration) {
                // Berhasil lolos cooldown! Catat waktu eksekusi saat ini
                node._lastExecuteTime = currentTime; 
                
                // Meneruskan jalur eksekusi utama
                runner.executeFlow(node._id, 'ready');
            } else {
                // Masih dalam masa cooldown (Spam terdeteksi)
                // Jalur ini bisa dibiarkan kosong, atau disambungkan ke suara "error/cooldown"
                runner.executeFlow(node._id, 'cooling');
            }
        }
    }
};
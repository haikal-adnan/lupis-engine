export const systemNode = {
    'ui_notification': {
        execute: (runner, node) => {
            // [FIX] Gunakan ID 'in_msg' sesuai definisi di basicSystem
            // Runner akan otomatis mencari:
            // 1. Kabel yang terhubung ke 'in_msg'
            // 2. Jika tidak ada, ambil nilai default dari node.data.inputs (atau node.data.message sebagai fallback)
            let message = runner.getInputValue(node, 'in_msg');
            
            // Fallback manual jika runner mengembalikan undefined (misal belum diisi)
            if (message === undefined || message === null) {
                message = node.data?.message || 'Notification';
            }
            
            console.log(
                `%c 🔔 [GAME] ${message} `, 
                'background: #222; color: #E040FB; font-weight: bold; border-left: 3px solid #E040FB; padding: 4px;'
            );
            
            // Di sini nanti kamu bisa panggil UI Manager game kamu
            // e.g., runner.game.ui.showToast(message);

            runner.executeFlow(node._id, 'exec_out'); // [FIX] Gunakan ID output yang benar 'exec_out'
        }
    },

    'system_log': {
        execute: (runner, node) => {
            const val = runner.getInputValue(node, 'in_value');
            const prefix = node.data?.prefix || 'LOG: ';
            
            console.log(`%c 📟 ${prefix}`, 'color: #00E676;', val);
            
            runner.executeFlow(node._id, 'exec_out');
        }
    }
}
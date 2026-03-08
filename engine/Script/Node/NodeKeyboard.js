export const NodeKeyboard = {
    'is_key_down': {
        execute: (runner, node) => {
            // Ambil nilai tombol dari input atau data default
            const key = runner.getInputValue(node, 'key');
            
            // Cek status tombol secara real-time
            const isDown = key ? runner.game.input.keyboard.isDown(key.toLowerCase()) : false;

            // Teruskan alur eksekusi sesuai kondisi
            if (isDown) {
                runner.executeFlow(node._id, 'true');
            } else {
                runner.executeFlow(node._id, 'false');
            }
        }
    }
};
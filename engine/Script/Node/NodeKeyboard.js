export const NodeKeyboard = {
    'is_key_down': {
        execute: (runner, node) => {
            const key = runner.getInputValue(node, 'key');
            const isDown = key ? runner.game.input.keyboard.isDown(key.toLowerCase()) : false;
            if (isDown) {
                runner.executeFlow(node._id, 'true');
            } else {
                runner.executeFlow(node._id, 'false');
            }
        }
    },
    
    'get_key_state': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'isDown') {
                const key = runner.getInputValue(node, 'key') || node.data?.key || '';
                return key ? runner.game.input.keyboard.isDown(key.toLowerCase()) : false;
            }
            return null;
        }
    },
    'calculate_axis_2d': {
        execute: (runner, node) => {
            // Ambil string tombol dari input (jika dihubungkan) atau dari data statis node
            const upKey = runner.getInputValue(node, 'upKey');
            const downKey = runner.getInputValue(node, 'downKey');
            const rightKey = runner.getInputValue(node, 'rightKey');
            const leftKey = runner.getInputValue(node, 'leftKey');
            
            let x = 0;
            let y = 0;

            // Logika Pintar: Hanya kalkulasi X jika tombol dikanan/kiri didefinisikan
            if (rightKey && runner.game.input.keyboard.isDown(rightKey.toLowerCase())) {
                x += 1;
            }
            if (leftKey && runner.game.input.keyboard.isDown(leftKey.toLowerCase())) {
                x -= 1;
            }
            
            // Logika Pintar: Hanya kalkulasi Y jika tombol atas/bawah didefinisikan
            if (upKey && runner.game.input.keyboard.isDown(upKey.toLowerCase())) {
                y += 1; // Sesuaikan dengan koordinat engine Anda (-1 / +1)
            }
            if (downKey && runner.game.input.keyboard.isDown(downKey.toLowerCase())) {
                y -= 1;
            }
            
            // Simpan hasil untuk getOutput
            node._tempData = { axis_x: x, axis_y: y };

            // Teruskan SATU KALI eksekusi Out secara berurutan dan rapi!
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'axis_x') {
                return node._tempData ? node._tempData.axis_x : 0;
            }
            if (outputKey === 'axis_y') {
                return node._tempData ? node._tempData.axis_y : 0;
            }
            return 0;
        }
    }
};
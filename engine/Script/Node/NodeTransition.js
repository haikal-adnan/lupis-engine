export const NodeTransition = {
    'action_fade_screen': {
        execute: (runner, node) => {
            // Mengambil nilai asli dari node, bukan hardcode lagi
            const type = runner.getInputValue(node, 'type') || 'fade'; 
            const duration = parseFloat(runner.getInputValue(node, 'duration') ?? 1.0);
            const color = runner.getInputValue(node, 'color') || '#000000';

            // Jalankan pin 'Out' utama secara langsung (tidak menunggu fade selesai)
            runner.executeFlow(node._id, 'exec_out'); 

            if (type === 'fade_out') {
                runner.game.transitionSystem.fadeOut(duration, color, () => {
                    runner.executeFlow(node._id, 'on_complete'); 
                });
            } else if (type === 'fade_in') {
                runner.game.transitionSystem.fadeIn(duration, color, () => {
                    runner.executeFlow(node._id, 'on_complete');
                });
            } else if (type === 'fade') {
                // UPDATE: Logika gabungan fade out -> fade in
                const halfDuration = duration / 2;
                runner.game.transitionSystem.fadeOut(halfDuration, color, () => {
                    // Setelah fade out selesai, langsung jalankan fade in
                    runner.game.transitionSystem.fadeIn(halfDuration, color, () => {
                        // Pin On Complete dipanggil HANYA saat seluruh proses (out + in) selesai
                        runner.executeFlow(node._id, 'on_complete');
                    });
                });
            }
        }
    }
};
export const NodeScene = {
    'change_scene': {
        execute: (runner, node) => {
            const sceneName = runner.getInputValue(node, 'sceneName');
            if (sceneName) {
                // Gunakan antrean, jangan load langsung
                runner.game.queueLoadScene(sceneName);
            } else {
                console.warn("[NodeScene] Gagal pindah scene: Input Scene Name kosong.");
            }
            
            // JANGAN panggil runner.executeFlow(node._id, 'exec_out'); di sini.
            // Script scene saat ini sudah tamat riwayatnya karena mau pindah scene.
        }
    },

    'restart_scene': {
        execute: (runner, node) => {
            runner.game.restartScene();
            runner.executeFlow(node._id, 'exec_out');
        }
    }
};
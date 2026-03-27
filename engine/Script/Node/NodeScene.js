export const NodeScene = {
    'change_scene': {
        execute: (runner, node) => {
            const sceneName = runner.getInputValue(node, 'sceneName');
            if (sceneName) {
                runner.game.queueLoadScene(sceneName);
            } else {
                console.warn("[NodeScene] Gagal pindah scene: Input Scene Name kosong.");
            }
            
            // Lanjutkan eksekusi (queueLoadScene baru tereksekusi di frame update berikutnya)
            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'restart_scene': {
        execute: (runner, node) => {
            runner.game.restartScene();
            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'get_current_scene': {
        // Karena ini Get Node (seperti get_sprite/get_text), kita gunakan getOutput
        // agar node bisa dievaluasi langsung nilainya tanpa pin execution (exec_in/exec_out)
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'sceneName') {
                return runner.game.world.currentSceneName || "";
            }
            return null;
        }
    }
};
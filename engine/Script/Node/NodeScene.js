export const NodeScene = {
    'change_scene': {
        execute: (runner, node) => {
            const sceneName = runner.getInputValue(node, 'sceneName');
            if (sceneName) {
                runner.game.queueLoadScene(sceneName);
            } else {
                console.warn("[NodeScene] Gagal pindah scene: Input Scene Name kosong.");
            }
            
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
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'sceneName') {
                return runner.game.world.currentSceneName || "";
            }
            return null;
        }
    }
};
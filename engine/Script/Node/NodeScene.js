export const NodeScene = {
    'change_scene': {
        execute: (runner, node) => {
            const sceneName = runner.getInputValue(node, 'sceneName');
            if (sceneName) {
                runner.game.loadScene(sceneName);
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
    }
};
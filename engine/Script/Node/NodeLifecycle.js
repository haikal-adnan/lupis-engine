export const NodeLifecycle = {
    'event_game_start': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        }
    },

    'event_tick': {
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'dt') {
                return node._tempData?.dt || 0.016; 
            }
            return 0;
        }
    },

    'action_game_pause': {
        execute: (runner, node) => {
            runner.game.pauseGame();
            runner.executeFlow(node._id, 'out');
        }
    },

    'action_game_resume': {
        execute: (runner, node) => {
            runner.game.resumeGame();
            runner.executeFlow(node._id, 'out');
        }
    },

    'action_game_toggle_pause': {
        execute: (runner, node) => {
            if (runner.game.isPaused) {
                runner.game.resumeGame();
            } else {
                runner.game.pauseGame();
            }
            runner.executeFlow(node._id, 'out');
        }
    },

    'action_game_quit': {
        execute: (runner, node) => {
            runner.game.quitGame();
        }
    }
};
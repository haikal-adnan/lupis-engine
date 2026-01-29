export const cameraNode = {
    'action_camera_follow': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_entity');
            const speed = Number(runner.getInputValue(node, 'smooth_speed')) || 0.1;
            const offsetX = Number(runner.getInputValue(node, 'offset_x')) || 0;
            const offsetY = Number(runner.getInputValue(node, 'offset_y')) || 0;

            const entity = targetId ? runner.resolveEntity(targetId) : runner.owner;

            if (entity && runner.game.camera) {
                runner.game.camera.setTarget(entity, speed, { x: offsetX, y: offsetY });
            }

            runner.executeFlow(node._id, 'out');
        }
    },

    'action_camera_stop_follow': {
        execute: (runner, node) => {
             if (runner.game.camera) {
                runner.game.camera.clearTarget();
        }
            runner.executeFlow(node._id, 'out');
        }
    }
};
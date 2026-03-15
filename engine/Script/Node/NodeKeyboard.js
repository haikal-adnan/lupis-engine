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
    }
};
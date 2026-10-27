export const NodeTransition = {
    'action_fade_screen': {
        execute: (runner, node) => {
            const type = runner.getInputValue(node, 'type') || node.data?.values?.type || 'fade'; 
            
            const duration = parseFloat(runner.getInputValue(node, 'duration') ?? node.data?.values?.duration ?? 1000);
            
            const color = runner.getInputValue(node, 'color') || node.data?.values?.color || '#000000';

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
                const halfDuration = duration / 2;
                
                runner.game.transitionSystem.fadeOut(halfDuration, color, () => {
                    runner.game.transitionSystem.fadeIn(halfDuration, color, () => {
                        runner.executeFlow(node._id, 'on_complete');
                    });
                });
            }
        }
    }
};
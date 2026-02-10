export const NodeSystem = {
    'ui_notification': {
        execute: (runner, node) => {
            let message = runner.getInputValue(node, 'in_msg');
            
            if (message === undefined || message === null) {
                message = node.data?.message || 'Notification';
            }
            
            console.log(
                `%c 🔔 [GAME] ${message} `, 
                'background: #222; color: #E040FB; font-weight: bold; border-left: 3px solid #E040FB; padding: 4px;'
            );
            
            runner.executeFlow(node._id, 'exec_out'); 
        }
    },

    'system_log': {
        execute: (runner, node) => {
            const val = runner.getInputValue(node, 'in_value');
            const prefix = node.data?.prefix || 'LOG: ';
            
            console.log(`%c 📟 ${prefix}`, 'color: #00E676;', val);
            
            runner.executeFlow(node._id, 'exec_out');
        }
    }
}
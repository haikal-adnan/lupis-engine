export const debugNode = {
    'ui_notification': {
        execute: (runner, node) => {
            const message = runner.getInputValue(node, 'msg')
            
            console.log(
                `%c 🔔 [GAME] ${message} `, 
                'background: #222; color: #E040FB; font-weight: bold; border-left: 3px solid #E040FB; padding: 4px;'
            )
            
            runner.executeFlow(node._id, 'out')
        }
    }
}
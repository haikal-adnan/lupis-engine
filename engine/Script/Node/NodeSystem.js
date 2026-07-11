import { bus } from "../../Util/EventBus.js";

const logToBoth = (message, source, type = 'log', style = '') => {
    if (style) {
        console.log(`%c [${source}] ${message}`, style);
    } else {
        console.log(`[${source}] ${message}`);
    }

    bus.emit('console:log', {
        type: type,
        time: Date.now(),
        message: message, 
        source: source    
    });
};

export const NodeSystem = {
    'ui_notification': {
        execute: (runner, node) => {
            let source = runner.getInputValue(node, 'in_source') ?? node.data?.values?.in_source ?? 'Notification';
            let message = runner.getInputValue(node, 'in_msg') ?? node.data?.values?.in_msg ?? 'Hello World';
            
            logToBoth(
                message, 
                source, 
                'log',
                'background: #222; color: #E040FB; font-weight: bold; border-left: 3px solid #E040FB; padding: 4px;'
            );
            
            runner.executeFlow(node._id, 'exec_out'); 
        }
    }
};
export const NodeVariable = {
    'variable_get': {
        getOutput: (runner, node, outputKey) => {
            const varId = node.data?.variableId;
            const scope = node.data?.scope || 'Local';

            return runner.getVariableValue(varId, scope);
        }
    },

    'variable_set': {
        execute: (runner, node) => {
            const varId = node.data?.variableId;
            const scope = node.data?.scope || 'Local';
            
            const newVal = runner.getInputValue(node, 'val_in');

            runner.setVariableValue(varId, newVal, scope);

            runner.executeFlow(node._id, 'exec_out');
        },

        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'val_out') {
                return runner.getInputValue(node, 'val_in');
            }
            return null;
        }
    }
};
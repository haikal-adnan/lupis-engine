export const logicNode = {
    'logic_branch': {
        execute: (runner, node) => {
            const condition = runner.getInputValue(node, 'condition')
            if (condition === true) {
                runner.executeFlow(node._id, 'true')
            } else {
                runner.executeFlow(node._id, 'false')
            }
        }
    },

    'logic_and': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a && b) : false
        }
    },
    'logic_or': {
        getOutput: (runner, node, outputKey) => {
            const a = runner.getInputValue(node, 'a')
            const b = runner.getInputValue(node, 'b')
            return outputKey === 'result' ? (a || b) : false
        }
    },
    'logic_loop': { 
        execute: (runner, node) => {
            const start = Number(runner.getInputValue(node, 'start')) || 0
            const end = Number(runner.getInputValue(node, 'end')) || 0
            
            for (let i = start; i < end; i++) {
                runner._tempLoopIndex = i 
                runner.executeFlow(node._id, 'loop') 
            }
            runner.executeFlow(node._id, 'completed')
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'index' ? (runner._tempLoopIndex || 0) : 0
        }
    },

    'logic_flow_merge': {
        execute: (runner, node) => {
            runner.executeFlow(node._id, 'out');
        },
        getOutput: () => null
    }
}
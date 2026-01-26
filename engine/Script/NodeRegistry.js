import { mathNode } from './Node/mathNode.js'
import { logicNode } from './Node/logicNode.js'
import { entityNode } from './Node/entityNode.js'
import { variableNode } from './Node/variableNode.js'
import { transformNode } from './Node/transformNode.js'
import { stringNode } from './Node/stringNode.js'
import { debugNode } from './Node/debugNode.js'

export const NodeRegistry = {
    ...mathNode,
    ...logicNode,
    ...entityNode,
    ...variableNode,
    ...transformNode,
    ...stringNode,
    ...debugNode,

    // Fallback default
    'default': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: () => null
    }
}
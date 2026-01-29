import { mathNode } from './Node/mathNode.js'
import { logicNode } from './Node/logicNode.js'
import { entityNode } from './Node/entityNode.js'
import { variableNode } from './Node/variableNode.js'
import { transformNode } from './Node/transformNode.js'
import { stringNode } from './Node/stringNode.js'
import { debugNode } from './Node/debugNode.js'
import { cameraNode } from './Node/cameraNode.js'
import { lifecycleNode } from './Node/lifecycleNode.js'

export const NodeRegistry = {
    ...lifecycleNode,
    ...mathNode,
    ...logicNode,
    ...entityNode,
    ...variableNode,
    ...transformNode,
    ...stringNode,
    ...debugNode,
    ...cameraNode,

    'default': {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: () => null
    }
}
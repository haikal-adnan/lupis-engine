import { NodeMath } from './Node/NodeMath.js'
import { NodeLogic } from './Node/NodeLogic.js'
import { NodeObject } from './Node/NodeObject.js'
import { NodeTransform } from './Node/NodeTransform.js'
import { NodeString } from './Node/NodeString.js'
import { NodeSystem } from './Node/NodeSystem.js'
import { NodeCamera } from './Node/NodeCamera.js'
import { NodeLifecycle } from './Node/NodeLifecycle.js'
import { NodeCollider } from './Node/NodeCollider.js'
import { NodePhysics } from './Node/NodePhysics.js'
import { NodeRenderer } from './Node/NodeRenderer.js'
import { NodeVariable } from './Node/NodeVariable';
import { NodeComparison } from './Node/NodeComparison.js';

export const NodeRegistry = {
    ...NodeVariable,
    ...NodeLifecycle,
    ...NodeCollider,
    ...NodeMath,
    ...NodeLogic,
    ...NodeObject,
    ...NodeTransform,
    ...NodeString,
    ...NodeSystem,
    ...NodeCamera,
    ...NodePhysics,
    ...NodeRenderer,


    default: {
        execute: (runner, node) => runner.executeFlow(node._id, 'out'),
        getOutput: () => null
    }
}

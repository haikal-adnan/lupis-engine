import { isValidPortId } from '../../nodes/contract/portIds.js';
import { isTypeCompatible } from '../../nodes/contract/portTypes.js';

export function validateScript(script, options = {}) {
  const errors = [];
  if (!script || typeof script !== 'object') {
    return {
      isValid: false,
      errors: [{ message: 'Script is not a valid object' }]
    };
  }

  const nodes = Array.isArray(script.nodes) ? script.nodes : [];
  const edges = Array.isArray(script.edges) ? script.edges : [];
  const variables = Array.isArray(script.variables || script.localVariables) ? (script.variables || script.localVariables) : [];
  const globals = Array.isArray(options.globalVariables) ? options.globalVariables : [];

  const nodeMap = new Map();
  const variableIdSet = new Set(variables.map(v => v.id));
  const variableNameSet = new Set(variables.map(v => v.name));
  const globalIdSet = new Set(globals.map(g => g.id));
  const globalNameSet = new Set(globals.map(g => g.name));

  nodes.forEach(node => {
    if (!node.id) {
      errors.push({ message: 'Found node without ID' });
      return;
    }
    nodeMap.set(node.id, node);

    const portIdsSeen = new Set();
    const allPorts = [...(node.inputs || []), ...(node.outputs || [])];

    allPorts.forEach(port => {
      if (!port.id) {
        errors.push({
          nodeId: node.id,
          message: `Node '${node.id}' has a port without ID`
        });
        return;
      }

      if (!isValidPortId(port.id)) {
        errors.push({
          nodeId: node.id,
          portId: port.id,
          message: `Port ID '${port.id}' does not match regex ^[A-Za-z][A-Za-z0-9]*$`
        });
      }

      if (portIdsSeen.has(port.id)) {
        errors.push({
          nodeId: node.id,
          portId: port.id,
          message: `Duplicate port ID '${port.id}' in node '${node.id}'`
        });
      }
      portIdsSeen.add(port.id);
    });

    if (node.role === 'pure') {
      const hasExec = allPorts.some(p => String(p.dataType || '').toLowerCase() === 'execution');
      if (hasExec) {
        errors.push({
          nodeId: node.id,
          message: `Pure node '${node.id}' cannot have execution ports`
        });
      }
    }

    const varBindings = node.data?.variableBindings || {};
    Object.entries(varBindings).forEach(([portId, varKey]) => {
      if (varKey) {
        const isKnownLocal = variableIdSet.has(varKey) || variableNameSet.has(varKey);
        const isKnownGlobal = globalIdSet.has(varKey) || globalNameSet.has(varKey);
        if (!isKnownLocal && !isKnownGlobal) {
          errors.push({
            nodeId: node.id,
            portId: portId,
            message: `Variable '${varKey}' bound to port '${portId}' is not found in schema`
          });
        }
      }
    });
  });

  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
      errors.push({
        message: `Edge '${edge.id}' references non-existent source node '${edge.source}'`
      });
      return;
    }
    if (!targetNode) {
      errors.push({
        message: `Edge '${edge.id}' references non-existent target node '${edge.target}'`
      });
      return;
    }

    const sourcePort = (sourceNode.outputs || []).find(p => p.id === edge.sourceHandle);
    const targetPort = (targetNode.inputs || []).find(p => p.id === edge.targetHandle);

    if (!sourcePort) {
      errors.push({
        nodeId: edge.source,
        portId: edge.sourceHandle,
        message: `Edge '${edge.id}' references missing output port '${edge.sourceHandle}' on node '${edge.source}'`
      });
      return;
    }

    if (!targetPort) {
      errors.push({
        nodeId: edge.target,
        portId: edge.targetHandle,
        message: `Edge '${edge.id}' references missing input port '${edge.targetHandle}' on node '${edge.target}'`
      });
      return;
    }

    if (!isTypeCompatible(sourcePort.dataType, targetPort.dataType)) {
      errors.push({
        nodeId: edge.target,
        portId: edge.targetHandle,
        message: `Type mismatch on connection: '${sourcePort.dataType}' to '${targetPort.dataType}' (edge: ${edge.id})`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  validateScript
};

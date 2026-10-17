import { SCHEMA_VERSION } from '../../nodes/contract/scriptPayload.js';
import { getNodeRole } from '../../nodes/contract/nodeRoles.js';
import { coercePortValue } from './coerceByPort.js';
import { normalizeScript } from './normalizeScript.js';
import { validateScript } from './validateScript.js';

export function compileScript(rawScript, options = {}) {
  const normalized = normalizeScript(rawScript);
  const validation = validateScript(normalized, options);

  if (!validation.isValid && !options.force) {
    const errDetails = validation.errors.map(e => e.message).join('; ');
    throw new Error(`[compileScript] Validation failed: ${errDetails}`);
  }

  const incomingEdgeMap = new Map();
  const outgoingFlowMap = new Map();

  normalized.edges.forEach(edge => {
    incomingEdgeMap.set(`${edge.target}:${edge.targetHandle}`, {
      sourceNodeId: edge.source,
      sourcePortId: edge.sourceHandle,
      modifier: edge.modifier || null
    });

    const flowKey = `${edge.source}:${edge.sourceHandle}`;
    if (!outgoingFlowMap.has(flowKey)) {
      outgoingFlowMap.set(flowKey, []);
    }
    outgoingFlowMap.get(flowKey).push({
      targetNodeId: edge.target,
      targetPortId: edge.targetHandle
    });
  });

  const compiledNodes = normalized.nodes.map(node => {
    const rawData = node.data || {};
    const valueModes = rawData.valueModes || {};
    const varBindings = rawData.variableBindings || {};
    const varModifiers = rawData.variableModifiers || {};
    const values = rawData.values || {};

    const compiledInputs = (node.inputs || []).map(port => {
      if (port.dataType === 'execution') {
        return {
          id: port.id,
          dataType: 'execution'
        };
      }

      const portId = port.id;
      const connectedEdge = incomingEdgeMap.get(`${node.id}:${portId}`);

      let source;
      if (connectedEdge) {
        source = {
          kind: 'edge',
          modifier: connectedEdge.modifier || null
        };
      } else {
        const mode = valueModes[portId] || 'input';
        if (mode === 'variable' && varBindings[portId]) {
          source = {
            kind: 'variable',
            scope: varBindings[portId].startsWith('global:') ? 'global' : 'local',
            variableId: varBindings[portId].replace(/^global:/, ''),
            modifiers: varModifiers[portId] || null
          };
        } else {
          const literalVal = values[portId] !== undefined ? values[portId] : port.defaultValue;
          source = {
            kind: 'literal',
            value: coercePortValue(port, literalVal)
          };
        }
      }

      return {
        id: portId,
        dataType: port.dataType,
        source
      };
    });

    const compiledOutputs = (node.outputs || []).map(port => ({
      id: port.id,
      dataType: port.dataType
    }));

    return {
      id: node.id,
      type: node.type,
      role: node.role || getNodeRole(node),
      code: rawData.code || 'return;',
      config: {
        ...(rawData.options || {}),
        ...(node.settings || {})
      },
      inputs: compiledInputs,
      outputs: compiledOutputs,
      data: {
        values: values,
        code: rawData.code || 'return;'
      }
    };
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    id: normalized.id,
    scriptId: normalized.scriptId,
    variables: normalized.variables,
    nodes: compiledNodes,
    edges: normalized.edges
  };
}

export default {
  compileScript
};

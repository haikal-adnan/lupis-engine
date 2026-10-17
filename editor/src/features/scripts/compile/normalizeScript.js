import { getNodeRole } from '../../nodes/contract/nodeRoles.js';
import { coercePortValue } from './coerceByPort.js';

const LEGACY_PORT_MAP = {
  exec_in: 'execIn',
  execin: 'execIn',
  exec_out: 'execOut',
  execout: 'execOut',
  target_in: 'targetEntity',
  in_target: 'targetEntity',
  ptr_click_main: 'onClick',
  sk_main: 'execOut',
  out: 'completed',
  cond_0: 'condition',
  dt: 'deltaTime'
};

export function normalizePort(port) {
  const normId = LEGACY_PORT_MAP[port.id] || port.id;
  const normalized = {
    id: normId,
    dataType: port.dataType || 'any',
    color: port.color || '#555',
    enabled: port.enabled ?? true
  };
  if (port.defaultValue !== undefined) {
    normalized.defaultValue = coercePortValue(normalized, port.defaultValue);
  }
  return normalized;
}

export function normalizeScript(script) {
  if (!script || typeof script !== 'object') {
    return { id: 'empty', variables: [], nodes: [], edges: [] };
  }

  const normalized = {
    id: script.id || 'script_' + Date.now(),
    scriptId: script.scriptId || 'script_' + Date.now(),
    variables: Array.isArray(script.variables || script.localVariables) 
      ? (script.variables || script.localVariables).map(v => ({
          id: v.id,
          name: v.name,
          type: v.type || 'number',
          isExposed: Boolean(v.isExposed),
          defaultValue: v.defaultValue ?? 0
        }))
      : [],
    nodes: [],
    edges: []
  };

  const rawNodes = Array.isArray(script.nodes) ? script.nodes : [];
  normalized.nodes = rawNodes.map(node => {
    const rawInputs = Array.isArray(node.inputs) ? node.inputs : [];
    const rawOutputs = Array.isArray(node.outputs) ? node.outputs : [];

    const inputs = rawInputs.map(normalizePort);
    const outputs = rawOutputs.map(normalizePort);

    const safeData = node.data ? JSON.parse(JSON.stringify(node.data)) : {};
    const values = {};

    inputs.forEach(port => {
      if (port.dataType === 'execution') return;
      const portId = port.id;
      let rawVal = safeData.values?.[portId];
      if (rawVal === undefined && port.defaultValue !== undefined) {
        rawVal = port.defaultValue;
      }
      values[portId] = coercePortValue(port, rawVal);
    });

    safeData.values = values;

    return {
      id: node.id,
      type: node.type || 'unknownNode',
      role: getNodeRole({ inputs, outputs, role: node.role }),
      dynamicMode: node.dynamicMode || 'none',
      position: {
        x: node.position?.x ?? 0,
        y: node.position?.y ?? 0
      },
      settings: { ...(node.settings || {}) },
      inputs,
      outputs,
      data: safeData
    };
  });

  const rawEdges = Array.isArray(script.edges) ? script.edges : [];
  normalized.edges = rawEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    sourceHandle: LEGACY_PORT_MAP[edge.sourceHandle] || edge.sourceHandle,
    target: edge.target,
    targetHandle: LEGACY_PORT_MAP[edge.targetHandle] || edge.targetHandle,
    modifier: edge.modifier ? { ...edge.modifier } : (edge.modifier || null)
  }));

  return normalized;
}

export default {
  normalizeScript,
  normalizePort
};

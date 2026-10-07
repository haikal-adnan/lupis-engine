import { GenerateUUID } from '@utils/utils.js';

export const createScriptPort = (data = {}) => ({
  id: data.id || GenerateUUID(), 
  label: data.label || "",
  dataType: data.dataType || "any",
  color: data.color || "#555",
  enabled: data.enabled ?? true,
  defaultValue: data.defaultValue ?? null 
});

export const createScriptVariable = (data = {}) => ({
  id: data.id || GenerateUUID(),
  name: data.name || "NewVariable",
  type: data.type || "number",
  isExposed: data.isExposed || false,
  defaultValue: data.defaultValue ?? 0
});

export const createScriptNode = (data = {}) => {
  const safeData = data.data ? JSON.parse(JSON.stringify(data.data)) : {};
  if (!safeData.values) {
    safeData.values = {};
  }

  const inputs = Array.isArray(data.inputs)
    ? data.inputs.map(createScriptPort)
    : [];

  inputs.forEach(port => {
    const dType = String(port.dataType || '').toLowerCase();
    if (dType !== 'execution') {
      const defaultVal = port.defaultValue ?? null;
      if (safeData.values[port.id] === undefined) {
        safeData.values[port.id] = defaultVal;
      }
      if (safeData.values[port.label] === undefined) {
        safeData.values[port.label] = defaultVal;
      }
    }
  });

  if (typeof safeData.code !== 'string') {
    safeData.code = safeData.code || `/**\n * Node: ${data.settings?.headerTitle || 'Node'}\n */\nfunction execute(inputs, outputs, context) {\n   return outputs;\n}`;
  }

  return {
    id: data.id || GenerateUUID(),
    type: data.type || "unknown_node",
    allowDynamicInputs: data.allowDynamicInputs ?? false, 
    allowDynamicOutputs: data.allowDynamicOutputs ?? false, 
    position: {
      x: data.position?.x ?? 0,
      y: data.position?.y ?? 0
    },
    settings: {
      headerTitle: data.settings?.headerTitle || "Node",
      description: data.settings?.description || "",
      headerColor: data.settings?.headerColor || "#424242",
      category: data.settings?.category || "General",
      visibleDataFields: Array.isArray(data.settings?.visibleDataFields)
        ? [...data.settings.visibleDataFields]
        : []
    },
    inputs,
    outputs: Array.isArray(data.outputs)
      ? data.outputs.map(createScriptPort)
      : [],
    data: safeData 
  };
};

export const createScriptEdge = (data = {}) => ({
  id: data.id || GenerateUUID(),
  source: data.source,
  sourceHandle: data.sourceHandle || null,
  target: data.target,
  targetHandle: data.targetHandle || null
});

export const scriptSchema = (data = {}) => {
  return {
    id: data.id || GenerateUUID(),
    projectId: data.projectId || null,
    folderId: data.folderId || null,
    name: data.name || "Untitled Script",
    type: data.type || "component", 
    localVariables: Array.isArray(data.localVariables)
      ? data.localVariables.map(createScriptVariable)
      : [],
    nodes: Array.isArray(data.nodes)
      ? data.nodes.map(createScriptNode)
      : [],
    edges: Array.isArray(data.edges)
      ? data.edges.map(createScriptEdge)
      : [],
  };
};
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export const createScriptPort = (data = {}) => ({
  _id: data._id || GenerateUUID(), 
  label: data.label || "",
  dataType: data.dataType || "any",
  color: data.color || "#555",
  enabled: data.enabled ?? true,
  defaultValue: data.defaultValue ?? null 
});

export const createScriptVariable = (data = {}) => ({
  _id: data._id || GenerateUUID(),
  name: data.name || "NewVariable",
  type: data.type || "number",
  defaultValue: data.defaultValue ?? 0
});

export const createScriptNode = (data = {}) => {
  const safeData = data.data ? JSON.parse(JSON.stringify(data.data)) : {};
  if (!safeData.values) {
    safeData.values = {};
  }

  return {
    _id: data._id || GenerateUUID(),
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
    inputs: Array.isArray(data.inputs)
      ? data.inputs.map(createScriptPort)
      : [],
    outputs: Array.isArray(data.outputs)
      ? data.outputs.map(createScriptPort)
      : [],
    
    data: safeData 
  };
};

export const createScriptEdge = (data = {}) => ({
  _id: data._id || GenerateUUID(),
  source: data.source,
  sourceHandle: data.sourceHandle || null,
  target: data.target,
  targetHandle: data.targetHandle || null
});

export const createScript = (data = {}) => {
  return {
    _id: data._id || GenerateUUID(),
    projectId: data.projectId || null,
    name: data.name || "Untitled Script",
    type: data.type || "component", 
    exposedVariables: Array.isArray(data.exposedVariables)
      ? data.exposedVariables.map(createScriptVariable)
      : [],
    nodes: Array.isArray(data.nodes)
      ? data.nodes.map(createScriptNode)
      : [],
    edges: Array.isArray(data.edges)
      ? data.edges.map(createScriptEdge)
      : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
};
import { GenerateUUID, sanitizeScriptId } from '@utils/utils.js';
import { getNodeRole } from '@nodes/contract/nodeRoles.js';

export const createScriptPort = (data = {}) => ({
  id: data.id || GenerateUUID(),
  dataType: data.dataType || "any",
  color: data.color || "#555",
  enabled: data.enabled ?? true,
  defaultValue: data.defaultValue ?? null
});

export const createScriptVariable = (data = {}) => ({
  id: data.id || GenerateUUID(),
  name: sanitizeScriptId(data.name || "new_variable", "new_variable"),
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
    }
  });

  if (typeof safeData.code !== 'string') {
    safeData.code = safeData.code || `return;`;
  }

  const outputs = Array.isArray(data.outputs)
    ? data.outputs.map(createScriptPort)
    : [];

  return {
    id: data.id || GenerateUUID(),
    type: data.type || "unknown_node",
    role: data.role || getNodeRole({ inputs, outputs }),
    dynamicMode: data.dynamicMode || "none",
    ...(data.isCustomScript !== undefined ? { isCustomScript: Boolean(data.isCustomScript) } : {}),
    ...(data.originalType ? { originalType: data.originalType } : {}),
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
    outputs,
    data: safeData
  };
};

export const createScriptEdge = (data = {}) => ({
  id: data.id || GenerateUUID(),
  source: data.source,
  sourceHandle: data.sourceHandle || null,
  target: data.target,
  targetHandle: data.targetHandle || null,
  modifier: data.modifier ? { ...data.modifier } : {}
});

export const scriptSchema = (data = {}) => {
  const scriptId = sanitizeScriptId(
    data.scriptId || `script_${GenerateUUID().slice(0, 8)}`,
    `script_${GenerateUUID().slice(0, 8)}`
  );

  const script = {
    id: data.id || GenerateUUID(),
    projectId: data.projectId || null,
    folderId: data.folderId || null,
    scriptId: scriptId,
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

  return script;
};

// Node execution roles (event, action, pure) and classification utilities.

export const NODE_ROLES = Object.freeze({
  EVENT: 'event',
  ACTION: 'action',
  PURE: 'pure'
});

// Resolves node execution role from explicit declaration or execution port presence
export function getNodeRole(nodeDef) {
  if (nodeDef && nodeDef.role) {
    return nodeDef.role;
  }

  const inputs = Array.isArray(nodeDef?.inputs) ? nodeDef.inputs : [];
  const outputs = Array.isArray(nodeDef?.outputs) ? nodeDef.outputs : [];

  const hasExecIn = inputs.some(p => String(p.dataType || '').toLowerCase() === 'execution');
  const hasExecOut = outputs.some(p => String(p.dataType || '').toLowerCase() === 'execution');

  if (hasExecIn) {
    return NODE_ROLES.ACTION;
  }
  if (hasExecOut) {
    return NODE_ROLES.EVENT;
  }
  return NODE_ROLES.PURE;
}

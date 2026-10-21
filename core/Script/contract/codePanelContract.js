import {
  CONTEXT_NAMESPACES,
  CONTEXT_ASSERT_METHODS,
  CONTEXT_CONSOLE_METHODS,
  CONTEXT_ROOT_METHODS,
  CONTEXT_ROOT_PROPERTIES
} from './contextContract.js';

/**
 * Standard parameters available inside every custom node script.
 */
export const CODE_PANEL_PARAM_NAMES = Object.freeze([
  'inputs',
  'outputs',
  'context',
  'node'
]);

/**
 * Valid ContextSystem property names accessible on `context`.
 */
export const VALID_CONTEXT_PROPERTIES = Object.freeze(new Set([
  ...CONTEXT_NAMESPACES,
  ...CONTEXT_ROOT_METHODS,
  ...CONTEXT_ROOT_PROPERTIES
]));

/**
 * Strips single-line and multi-line comments from JavaScript source code
 * without corrupting string literals or URLs with slashes.
 * 
 * @param {string} code - Raw JavaScript code
 * @returns {string} Code with comments removed
 */
export function stripComments(code) {
  if (typeof code !== 'string') return '';
  return code.replace(
    /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/.*/g,
    (match, quoted) => (quoted ? quoted : '')
  );
}

/**
 * Backward compatibility alias for stripComments.
 */
export const stripStringsAndComments = stripComments;

/**
 * Extracts input port identifier names read in code:
 * - inputs['myPort']
 * - inputs["myPort"]
 * - inputs.myPort
 * 
 * @param {string} code - JavaScript source code
 * @returns {string[]} Unique list of input port keys
 */
export function extractUsedInputs(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\binputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...clean.matchAll(/\binputs\.([A-Za-z0-9_$]+)/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

/**
 * Extracts output port identifier names assigned or referenced in code:
 * - outputs['myPort'] = ...
 * - outputs.myPort = ...
 * - outputs['myPort']
 * 
 * @param {string} code - JavaScript source code
 * @returns {string[]} Unique list of output port keys
 */
export function extractUsedOutputs(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\boutputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...clean.matchAll(/\boutputs\.([A-Za-z0-9_$]+)\s*[+\-*/%&|^]?=/g)].map(m => m[1]),
    ...[...clean.matchAll(/\bcontext\.triggerFlow\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

/**
 * Extracts local variable keys referenced in code:
 * - context.getLocal('varName')
 * - context.setLocal('varName', value)
 * 
 * @param {string} code - JavaScript source code
 * @returns {string[]} Unique list of local variable keys
 */
export function extractUsedLocalVariables(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const localGetMatches = [...clean.matchAll(/\bcontext\.getLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const localSetMatches = [...clean.matchAll(/\bcontext\.setLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return [...new Set([...localGetMatches, ...localSetMatches])];
}

/**
 * Extracts global variable keys referenced in code:
 * - context.getGlobal('varName')
 * - context.setGlobal('varName', value)
 * 
 * @param {string} code - JavaScript source code
 * @returns {string[]} Unique list of global variable keys
 */
export function extractUsedGlobalVariables(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const globalGetMatches = [...clean.matchAll(/\bcontext\.getGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const globalSetMatches = [...clean.matchAll(/\bcontext\.setGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return [...new Set([...globalGetMatches, ...globalSetMatches])];
}

/**
 * Extracts all property accesses on `context` (e.g. context.entity, context.foo).
 * 
 * @param {string} code - JavaScript source code
 * @returns {string[]} Unique list of accessed context properties
 */
export function extractContextAccesses(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\bcontext\.([A-Za-z0-9_$]+)/g)].map(m => m[1]),
    ...[...clean.matchAll(/\bcontext\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

/**
 * Validates a node's code against the CodePanel and Engine Visual Scripting Contract.
 * 
 * Invariants & Contract Rules:
 * 1. Port Identification:
 *    - All inputs read in code MUST match an existing node input port ID or label.
 *    - All outputs assigned in code MUST match an existing node output port ID or label.
 *    - Defined data input ports should be consumed in the logic.
 *    - Defined output ports should be assigned in the logic.
 * 2. Variable Scope:
 *    - Keys in context.getLocal/setLocal MUST exist in script.localVariables.
 *    - Keys in context.getGlobal/setGlobal MUST exist in project.globalVariables.
 * 3. Context API Conformance:
 *    - Properties accessed on `context` should exist in ContextSystem contract.
 * 4. JavaScript Syntax Integrity:
 *    - Code must be parsable as valid JavaScript function body.
 * 
 * @param {string} code - The JavaScript source code of the node
 * @param {Object} options - Contextual data for validation
 * @param {Object} [options.node] - Target node object (with inputs and outputs arrays)
 * @param {Array} [options.localVariables] - Script local variables list
 * @param {Array} [options.globalVariables] - Project global variables list
 * @returns {Object} Structured validation result
 */
export function validateCodePanelContract(code, options = {}) {
  const targetNode = options.node || null;
  const localVariables = Array.isArray(options.localVariables) ? options.localVariables : [];
  const globalVariables = Array.isArray(options.globalVariables) ? options.globalVariables : [];

  if (!targetNode) {
    return {
      isValid: true,
      hasSyntaxError: false,
      syntaxError: null,
      issues: [],
      usedInputsCount: 0,
      usedOutputsCount: 0,
      usedVarsCount: 0,
      metadata: {
        usedInputKeys: [],
        usedOutputKeys: [],
        usedLocalVars: [],
        usedGlobalVars: [],
        unrecognizedContextProps: []
      }
    };
  }

  const codeStr = String(code || '');
  const issues = [];
  let hasSyntaxError = false;
  let syntaxError = null;

  // 1. Basic Syntax Verification
  if (codeStr.trim().length > 0) {
    try {
      new Function('inputs', 'outputs', 'context', 'node', codeStr);
    } catch (err) {
      hasSyntaxError = true;
      syntaxError = err.message;
      issues.push(`Syntax error: ${err.message}`);
    }
  }

  // 2. Ports Validation (Inputs & Outputs)
  const usedInputKeys = extractUsedInputs(codeStr);
  const usedOutputKeys = extractUsedOutputs(codeStr);

  const dynamicMode = targetNode.dynamicMode || targetNode.data?.dynamicMode || 'none';
  const propertyOptions = targetNode.data?.propertyOptions || targetNode.propertyOptions || [];
  const propertyOptionKeys = propertyOptions.map(p => p.value).filter(Boolean);

  const dynamicInputKeys = (dynamicMode === 'inputProperty' || (propertyOptions.length > 0 && dynamicMode !== 'outputProperty')) ? propertyOptionKeys : [];
  const dynamicOutputKeys = (dynamicMode === 'outputProperty' || (propertyOptions.length > 0 && dynamicMode !== 'inputProperty')) ? propertyOptionKeys : [];

  const allValidInputIdentifiers = [
    ...(targetNode.inputs?.flatMap(p => [p.label, p.id]).filter(Boolean) || []),
    ...dynamicInputKeys
  ];
  const allValidOutputIdentifiers = [
    ...(targetNode.outputs?.flatMap(p => [p.label, p.id]).filter(Boolean) || []),
    ...dynamicOutputKeys
  ];

  usedInputKeys.forEach(inputKey => {
    const isDynamicAllowed = 
      (dynamicMode === 'switch' && /^case\d+$/.test(inputKey)) ||
      (dynamicMode === 'keyboard' && /^key\d+$/.test(inputKey)) ||
      (dynamicMode === 'sequential' && /^v\d+$/.test(inputKey));

    if (!allValidInputIdentifiers.includes(inputKey) && !isDynamicAllowed) {
      issues.push(`Input '${inputKey}' is used in code, but is not defined in Node Input Ports.`);
    }
  });

  usedOutputKeys.forEach(outputKey => {
    const isDynamicAllowed = 
      (dynamicMode === 'switch' && /^onCase\d+$/.test(outputKey)) ||
      (dynamicMode === 'keyboard' && /^onKey\d+$/.test(outputKey)) ||
      (dynamicMode === 'sequential' && /^v\d+$/.test(outputKey));

    if (!allValidOutputIdentifiers.includes(outputKey) && !isDynamicAllowed) {
      issues.push(`Output '${outputKey}' is set in code, but is not defined in Node Output Ports.`);
    }
  });

  const dataInputPorts = (targetNode.inputs || []).filter(p => {
    const dType = String(p.dataType || '').toLowerCase();
    return dType !== 'execution';
  });

  const definedOutputPorts = targetNode.outputs || [];

  let matchedInputsCount = 0;
  dataInputPorts.forEach(port => {
    const isUsed = (port.label && usedInputKeys.includes(port.label)) || (port.id && usedInputKeys.includes(port.id));
    if (isUsed) {
      matchedInputsCount++;
    } else {
      issues.push(`Input Port '${port.label || port.id}' is defined on node, but never read in code.`);
    }
  });

  let matchedOutputsCount = 0;
  definedOutputPorts.forEach(port => {
    const isUsed = (port.label && usedOutputKeys.includes(port.label)) || (port.id && usedOutputKeys.includes(port.id));
    if (isUsed) {
      matchedOutputsCount++;
    } else {
      issues.push(`Output Port '${port.label || port.id}' is defined on node, but never set in code.`);
    }
  });

  // 3. Variables Validation (Local & Global)
  const usedLocalVars = extractUsedLocalVariables(codeStr);
  const usedGlobalVars = extractUsedGlobalVariables(codeStr);

  const definedLocalVars = localVariables.flatMap(v => [v.name, v.id]).filter(Boolean);
  const definedGlobalVars = globalVariables.flatMap(v => [v.name, v.id]).filter(Boolean);

  usedLocalVars.forEach(varKey => {
    if (!definedLocalVars.includes(varKey)) {
      issues.push(`Local Variable '${varKey}' is referenced in code, but not defined in Script Variables.`);
    }
  });

  usedGlobalVars.forEach(varKey => {
    if (!definedGlobalVars.includes(varKey)) {
      issues.push(`Global Variable '${varKey}' is referenced in code, but not defined in Project Global Variables.`);
    }
  });

  // 4. Context API Conformance Check
  const contextAccesses = extractContextAccesses(codeStr);
  const unrecognizedContextProps = [];
  contextAccesses.forEach(prop => {
    if (!VALID_CONTEXT_PROPERTIES.has(prop)) {
      unrecognizedContextProps.push(prop);
      issues.push(`Context property 'context.${prop}' is not defined in ContextSystem contract.`);
    }
  });

  return {
    isValid: issues.length === 0,
    hasSyntaxError,
    syntaxError,
    issues,
    usedInputsCount: matchedInputsCount,
    usedOutputsCount: matchedOutputsCount,
    usedVarsCount: usedLocalVars.length + usedGlobalVars.length,
    metadata: {
      usedInputKeys,
      usedOutputKeys,
      usedLocalVars,
      usedGlobalVars,
      unrecognizedContextProps
    }
  };
}

/**
 * Generates initial boilerplate code for a node based on its defined ports.
 * Useful when scaffolding new nodes or resetting custom code.
 * 
 * @param {Object} node - Target node object
 * @returns {string} Boilerplate code string
 */
export function generateDefaultNodeCode(node) {
  if (!node) return '// Write your node logic here...\n';

  const inputs = (node.inputs || []).filter(p => p.dataType !== 'execution');
  const outputs = (node.outputs || []).filter(p => p.dataType !== 'execution');
  const hasExecOut = (node.outputs || []).some(p => p.dataType === 'execution');

  const lines = [];

  if (inputs.length > 0) {
    lines.push('// 1. Read input values');
    inputs.forEach(port => {
      const portKey = port.label || port.id;
      const varName = port.id || 'val';
      lines.push(`const ${varName} = inputs['${portKey}'];`);
    });
    lines.push('');
  }

  lines.push('// 2. Execute node computation');

  if (outputs.length > 0) {
    lines.push('// 3. Set output values');
    outputs.forEach(port => {
      const portKey = port.label || port.id;
      lines.push(`outputs['${portKey}'] = null;`);
    });
  }

  if (hasExecOut) {
    lines.push('');
    lines.push('// 4. Trigger execution flow');
    lines.push('outputs.execOut = true;');
  }

  return lines.join('\n') + '\n';
}

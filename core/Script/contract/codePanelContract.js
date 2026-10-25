import {
  CONTEXT_NAMESPACES,
  CONTEXT_ASSERT_METHODS,
  CONTEXT_CONSOLE_METHODS,
  CONTEXT_ROOT_METHODS,
  CONTEXT_ROOT_PROPERTIES
} from './contextContract.js';

export const CODE_PANEL_PARAM_NAMES = Object.freeze([
  'inputs',
  'outputs',
  'context',
  'node'
]);

export const VALID_CONTEXT_PROPERTIES = Object.freeze(new Set([
  ...CONTEXT_NAMESPACES,
  ...CONTEXT_ROOT_METHODS,
  ...CONTEXT_ROOT_PROPERTIES
]));

// Strips single-line and multi-line comments while preserving string literals
export function stripComments(code) {
  if (typeof code !== 'string') return '';
  return code.replace(
    /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/.*/g,
    (match, quoted) => (quoted ? quoted : '')
  );
}

export const stripStringsAndComments = stripComments;

// Extracts input port identifier names read in code
export function extractUsedInputs(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\binputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...clean.matchAll(/\binputs\.([A-Za-z0-9_$]+)/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

// Extracts output port identifier names assigned or referenced in code
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

// Extracts local variable keys referenced in code
export function extractUsedLocalVariables(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const localGetMatches = [...clean.matchAll(/\bcontext\.getLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const localSetMatches = [...clean.matchAll(/\bcontext\.setLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return [...new Set([...localGetMatches, ...localSetMatches])];
}

// Extracts global variable keys referenced in code
export function extractUsedGlobalVariables(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const globalGetMatches = [...clean.matchAll(/\bcontext\.getGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const globalSetMatches = [...clean.matchAll(/\bcontext\.setGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return [...new Set([...globalGetMatches, ...globalSetMatches])];
}

// Extracts all property accesses on context
export function extractContextAccesses(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\bcontext\.([A-Za-z0-9_$]+)/g)].map(m => m[1]),
    ...[...clean.matchAll(/\bcontext\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

// Validates a node's code against input/output ports, variables, and context API
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

  // Basic syntax verification
  if (codeStr.trim().length > 0) {
    try {
      new Function('inputs', 'outputs', 'context', 'node', codeStr);
    } catch (err) {
      hasSyntaxError = true;
      syntaxError = err.message;
      issues.push(`Syntax error: ${err.message}`);
    }
  }

  // Ports validation
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

  // Variables validation
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

  // Context API conformance check
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

// Generates initial boilerplate code for a node based on its defined ports
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

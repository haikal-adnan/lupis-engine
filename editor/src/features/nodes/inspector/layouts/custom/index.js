import KeyboardMapperInspector from './KeyboardMapperInspector.vue';
import BatchSetInspector from './BatchSetInspector.vue';
import StringFormatInspector from './StringFormatInspector.vue';
import MathChainInspector from './MathChainInspector.vue';
import CustomScriptInspector from './CustomScriptInspector.vue';

export {
  KeyboardMapperInspector,
  BatchSetInspector,
  StringFormatInspector,
  MathChainInspector,
  CustomScriptInspector
};

export const MANAGED_CUSTOM_INSPECTORS = {
  eventAdvancedKey: KeyboardMapperInspector,
  inputKeyboardMapper: KeyboardMapperInspector,
  eventOnKey: KeyboardMapperInspector,
  batchSet: BatchSetInspector,
  stringFormat: StringFormatInspector,
  mathChain: MathChainInspector
};

/**
 * Checks if a node is a User Custom Node.
 * Can come from ANY blueprint in the system or created by user,
 * when converted/unlocked by the user or defined as customScript / custom_*.
 * @param {Object} node 
 * @returns {boolean}
 */
export function isUserCustomNode(node) {
  if (!node) return false;
  return Boolean(
    node.isCustomScript ||
    node.type === 'customScript' ||
    (typeof node.type === 'string' && (node.type.startsWith('custom_') || node.type === 'customScript'))
  );
}

/**
 * Checks if a node is a Custom Inspector Node.
 * Same as a system node, the only difference is it renders a custom inspector for its node data.
 * The rest of its behavior is identical to a system node.
 * If converted to a user custom node, it is no longer managed by the custom inspector.
 * @param {Object} node 
 * @returns {boolean}
 */
export function isCustomInspectorNode(node) {
  if (!node || isUserCustomNode(node)) return false;
  return Boolean(MANAGED_CUSTOM_INSPECTORS[node.type]);
}

/**
 * Checks if a node is a System Node (either generic system node or custom inspector node).
 * @param {Object} node 
 * @returns {boolean}
 */
export function isSystemNode(node) {
  if (!node) return false;
  return !isUserCustomNode(node);
}

/**
 * Returns the matching custom inspector component for a given node, or null if generic inspector should be used.
 * @param {Object} node 
 * @returns {Component|null}
 */
export function getCustomInspectorForNode(node) {
  if (!node) return null;

  // 1. If it's a custom node user, use CustomScriptInspector (which renders NodeData)
  if (isUserCustomNode(node)) {
    return CustomScriptInspector;
  }

  // 2. If it is one of the managed custom node types, return its dedicated inspector
  return MANAGED_CUSTOM_INSPECTORS[node.type] || null;
}

/**
 * Checks if a node is currently managed by a custom inspector (meaning its code is controlled by UI)
 * @param {Object} node 
 * @returns {boolean}
 */
export function isNodeManagedByCustomInspector(node) {
  return isCustomInspectorNode(node);
}

/**
 * Saves a node definition into the active project's customBlueprints library.
 * Supports prompting for blueprint name via atomic usePrompt modal.
 * Any name is allowed, and unique ID ensures safe co-existence of identical names.
 * @param {Object} node 
 * @param {Object} projectStore 
 * @param {Function|Object} [options] showPop function OR options object { prompt, showPop, blueprintName }
 * @returns {Promise<boolean>}
 */
export async function saveCustomBlueprintToLibrary(node, projectStore, options = {}) {
  if (!node) return false;
  const project = projectStore?.activeProject || projectStore?.project;
  const showPop = typeof options === 'function' ? options : options?.showPop;
  const prompt = typeof options === 'object' ? options?.prompt : null;

  if (!project) {
    if (showPop) {
    showPop({
      title: 'Save Blueprint Failed',
      message: 'No active project found to save the custom blueprint.',
      type: 'error'
    });
  }
    return false;
  }

  let finalName = typeof options === 'object' ? options?.blueprintName : undefined;
  if (finalName === undefined && prompt) {
    const defaultName = node.settings?.headerTitle || node.label || 'Custom Node';
    const inputName = await prompt({
      title: 'Save Custom Blueprint',
      message: 'Enter a name for this custom blueprint in the library:',
      defaultValue: defaultName,
      placeholder: 'Blueprint Name',
      confirmText: 'Save'
    });

    if (inputName === null) {
      return false; // User cancelled prompt
    }
    finalName = String(inputName).trim() || defaultName;
  } else if (!finalName) {
    finalName = node.settings?.headerTitle || node.label || 'Custom Node';
  }

  if (!Array.isArray(project.customBlueprints)) {
    project.customBlueprints = [];
  }

  const blueprintId = `custom_${node.id || (node.type === 'customScript' ? Date.now() : node.type)}`;
  const customBlueprint = {
    type: blueprintId,
    label: finalName,
    description: node.settings?.description || '',
    role: node.role || 'action',
    dynamicMode: 'none',
    defaultData: {
      isCustomScript: true,
      role: node.role || 'action',
      settings: {
        headerTitle: finalName,
        headerColor: node.settings?.headerColor || '#8B5CF6',
        category: 'Custom'
      },
      inputs: JSON.parse(JSON.stringify(node.inputs || [])),
      outputs: JSON.parse(JSON.stringify(node.outputs || [])),
      data: {
        values: JSON.parse(JSON.stringify(node.data?.values || {})),
        code: node.data?.code || 'return;'
      }
    }
  };

  const existingIdx = project.customBlueprints.findIndex(bp => bp.type === blueprintId);
  if (existingIdx !== -1) {
    project.customBlueprints[existingIdx] = customBlueprint;
  } else {
    project.customBlueprints.push(customBlueprint);
  }

  projectStore.markAsDirty();
  if (showPop) {
    showPop({
      title: 'Custom Blueprint Saved',
      message: `Custom blueprint "${finalName}" has been successfully saved to the project library.`,
      type: 'success'
    });
  }
  return true;
}

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

// Maps node types to specialized custom inspector layout components
export const MANAGED_CUSTOM_INSPECTORS = {
  eventAdvancedKey: KeyboardMapperInspector,
  inputKeyboardMapper: KeyboardMapperInspector,
  eventOnKey: KeyboardMapperInspector,
  batchSet: BatchSetInspector,
  stringFormat: StringFormatInspector,
  mathChain: MathChainInspector
};

// Checks if a node has user-editable source code and custom ports
export function isUserCustomNode(node) {
  if (!node) return false;
  return Boolean(
    node.isCustomScript ||
    node.type === 'customScript' ||
    (typeof node.type === 'string' && (node.type.startsWith('custom_') || node.type === 'customScript'))
  );
}

// Checks if a node uses a specialized inspector layout rather than generic inspector
export function isCustomInspectorNode(node) {
  if (!node || isUserCustomNode(node)) return false;
  return Boolean(MANAGED_CUSTOM_INSPECTORS[node.type]);
}

export function isSystemNode(node) {
  if (!node) return false;
  return !isUserCustomNode(node);
}

// Resolves dedicated inspector Vue component for a node
export function getCustomInspectorForNode(node) {
  if (!node) return null;

  if (isUserCustomNode(node)) {
    return CustomScriptInspector;
  }

  return MANAGED_CUSTOM_INSPECTORS[node.type] || null;
}

export function isNodeManagedByCustomInspector(node) {
  return isCustomInspectorNode(node);
}

// Exports a configured node instance to the active project's custom blueprint library
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
      return false;
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

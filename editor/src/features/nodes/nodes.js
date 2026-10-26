// Exports visual script node graph components, inspector composables, and contracts.

export { 
  useGraphEditor,
  isTypeCompatible,
  validatePayloadShape
} from '@nodes/graph/composables/useGraphEditor.js'
export { useNodeMenu } from '@nodes/graph/composables/useNodeMenu.js'

export { default as GraphNode } from '@nodes/graph/layouts/GraphNode.vue'
export { default as GraphPanel } from '@nodes/graph/layouts/GraphPanel.vue'
export { default as CodePanel } from '@nodes/graph/layouts/CodePanel.vue'

export { useVariableLogic } from '@nodes/variable/composables/useVariableLogic.js'

export { default as VariableManagerModal } from '@nodes/variable/layouts/VariableManagerModal.vue'
export { default as VariablePanel } from '@nodes/variable/layouts/VariablePanel.vue'

export { useNodeBlueprint, createCustomNodeInstance } from '@nodes/library/composables/useNodeBlueprint.js'
export { useNodePreferences } from '@nodes/library/composables/useNodePreferences.js'
export { useVariableConfig } from '@nodes/library/composables/useVariableConfig.js'
export { 
  useNodeOverride, 
  overrideNodeFromBlueprint, 
  resetNodeToDefault, 
  overrideAllScriptNodes,
  overrideAllProjectNodes 
} from '@nodes/library/composables/useNodeOverride.js'

export { default as NodeBlueprintModal } from '@nodes/library/layouts/NodeBlueprintModal.vue'
export { default as NodeLibrary } from '@nodes/library/layouts/NodeLibrary.vue'
export { default as NodeListItem } from '@nodes/library/layouts/NodeListItem.vue'

export { 
  useDynamicPortManager,
  isValidPortId,
  isProtectedPort,
  keyToPortId
} from '@nodes/inspector/composables/useDynamicPortManager.js';

export { 
  useNodeLogic,
  getPortColor,
  getNodeRole,
  validateCodePanelContract,
  stripComments,
  stripStringsAndComments,
  extractUsedInputs,
  extractUsedOutputs,
  extractUsedLocalVariables,
  extractUsedGlobalVariables,
  extractContextAccesses,
  generateDefaultNodeCode
} from '@nodes/inspector/composables/useNodeLogic.js'
export { useNodeInspector } from '@nodes/inspector/composables/useNodeInspector.js'

export { default as VariableSelect } from '@nodes/inspector/layouts/VariableSelect.vue'
export { default as VariableInputGroup } from '@nodes/inspector/layouts/VariableInputGroup.vue'
export { default as NodePanel } from '@nodes/inspector/layouts/NodePanel.vue'
export { default as NodeHeader } from '@nodes/inspector/layouts/NodeHeader.vue'
export { default as NodeData } from '@nodes/inspector/layouts/NodeData.vue'
export { default as NodeEdge } from '@nodes/inspector/layouts/NodeEdge.vue'
export { default as NodePorts } from '@nodes/inspector/layouts/NodePorts.vue'
export * from './inspector/layouts/custom/index.js'

// --- Constants and blueprints ---
export * from './nodeConstants.js';
export * from './library/blueprints/index.js';

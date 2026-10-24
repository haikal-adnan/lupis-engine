import { ref } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { usePopAlert, usePrompt } from '@composables/composables.js';
import { useNodeBlueprint } from '@nodes/nodes.js';
import { PROTECTED_PORTS } from '../../contract/portIds.js';
import { keyToPortId } from '../../contract/keyPortNames.js';
import { isUserCustomNode } from '../layouts/custom/index.js';

// Singleton state to keep target dropdown synchronized across components
const activeDropdownTarget = ref(null);

/**
 * Helper: Multi-key parser for On Key events
 */
function parseKeysString(rawKeys) {
  if (!rawKeys || !rawKeys.trim()) return [];
  const rawTokens = String(rawKeys).split(',').map(t => t.trim().toLowerCase());
  const parsedKeys = [];

  let i = 0;
  while (i < rawTokens.length) {
    const token = rawTokens[i];
    if (token.length > 0) {
      parsedKeys.push(token);
      i++;
    } else {
      if (i + 1 < rawTokens.length && rawTokens[i + 1] === '') {
        parsedKeys.push(',');
        i += 2;
      } else {
        i++;
      }
    }
  }
  return parsedKeys;
}

export function useDynamicPortManager() {
  const scriptStore = useScriptStore();
  const scriptHistory = useScriptHistory();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();
  const { getNodeBlueprint } = useNodeBlueprint();

  // =========================================================================
  // 1. REGISTRY: Custom Value Change Handlers (Inspector Input Sync)
  // =========================================================================
  const onKeyHandler = (node, key, value, disconnectEdges) => {
    if (key === 'keys' || key === 'key') {
      const parsedKeys = parseKeysString(value);
      const currentOutputs = node.outputs || [];
      const seenIds = new Set();

      const newOutputs = [];
      parsedKeys.forEach((keyToken) => {
        let canonicalId = keyToPortId(keyToken);
        if (seenIds.has(canonicalId)) {
          let suffix = 1;
          while (seenIds.has(`${canonicalId}${suffix}`)) {
            suffix++;
          }
          canonicalId = `${canonicalId}${suffix}`;
        }
        seenIds.add(canonicalId);

        newOutputs.push({
          id: canonicalId,
          dataType: 'execution',
          color: '#FFFFFF'
        });
      });

      // Disconnect edges for removed or altered ports
      const newIdSet = new Set(newOutputs.map(p => p.id));
      currentOutputs.forEach(port => {
        if (!newIdSet.has(port.id)) {
          disconnectEdges(port.id);
        }
      });

      scriptStore.updateNodeInActive(node.id, { outputs: newOutputs });
    }
  };

  function syncSwitchCases(node) {
    if (!node || node.type !== 'logicSwitch') return;
    if (!node.data) node.data = {};
    const caseInputs = (node.inputs || [])
      .filter(p => p.id && String(p.id).startsWith('case'))
      .sort((a, b) => {
        const idxA = parseInt(String(a.id).replace('case', ''), 10) || 0;
        const idxB = parseInt(String(b.id).replace('case', ''), 10) || 0;
        return idxA - idxB;
      });

    node.data.cases = caseInputs.map(p => {
      if (node.data.values && node.data.values[p.id] !== undefined) {
        return node.data.values[p.id];
      }
      return p.defaultValue ?? '';
    });
  }

  const switchHandler = (node, key, value) => {
    if (String(key).startsWith('case')) {
      syncSwitchCases(node);
    }
  };

  const valueChangeHandlers = {
    eventOnKey: onKeyHandler,
    eventAdvancedKey: onKeyHandler,
    logicSwitch: switchHandler
  };

  // =========================================================================
  // 2. REGISTRY: Custom Add Port Handlers
  // =========================================================================
  const switchCaseHandler = (node, { scriptHistory }) => {
    let nextIndex = 0;
    while (
      (node.inputs || []).some(p => p.id === `case${nextIndex}`) ||
      (node.outputs || []).some(p => p.id === `onCase${nextIndex}`)
    ) {
      nextIndex++;
    }

    const newInputPort = {
      id: `case${nextIndex}`,
      dataType: 'string',
      color: '#F48FB1',
      defaultValue: ''
    };

    const newOutputPort = {
      id: `onCase${nextIndex}`,
      dataType: 'execution',
      color: '#FFFFFF'
    };

    scriptStore.addNodePort(node.id, 'input', newInputPort);
    scriptStore.addNodePort(node.id, 'output', newOutputPort);

    const activeNode = scriptStore.activeScript?.nodes?.find(n => n.id === node.id) || node;
    if (!activeNode.data) activeNode.data = {};
    if (!activeNode.data.values) activeNode.data.values = {};
    activeNode.data.values[newInputPort.id] = '';

    syncSwitchCases(activeNode);
    scriptStore.saveActiveScript();

    if (activeNode !== node) {
      node.inputs = activeNode.inputs;
      node.outputs = activeNode.outputs;
      node.data = activeNode.data;
    }

    scriptHistory.recordPortChange(node.id, 'ADD', newInputPort, 'input', []);
    scriptHistory.recordPortChange(node.id, 'ADD', newOutputPort, 'output', []);
  };

  const keyEventHandler = (node, { scriptHistory }) => {
    let nextIndex = 0;
    while (
      (node.inputs || []).some(p => p.id === `key${nextIndex}`) ||
      (node.outputs || []).some(p => p.id === `onKey${nextIndex}`)
    ) {
      nextIndex++;
    }

    const newInputPort = {
      id: `key${nextIndex}`,
      dataType: 'string',
      color: '#F48FB1',
      defaultValue: ''
    };

    const newOutputPort = {
      id: `onKey${nextIndex}`,
      dataType: 'execution',
      color: '#FFFFFF'
    };

    scriptStore.addNodePort(node.id, 'input', newInputPort);
    scriptStore.addNodePort(node.id, 'output', newOutputPort);

    const activeNode = scriptStore.activeScript?.nodes?.find(n => n.id === node.id) || node;
    if (!activeNode.data) activeNode.data = {};
    if (!activeNode.data.values) activeNode.data.values = {};
    activeNode.data.values[newInputPort.id] = '';

    scriptStore.saveActiveScript();

    if (activeNode !== node) {
      node.inputs = activeNode.inputs;
      node.outputs = activeNode.outputs;
      node.data = activeNode.data;
    }

    scriptHistory.recordPortChange(node.id, 'ADD', newInputPort, 'input', []);
    scriptHistory.recordPortChange(node.id, 'ADD', newOutputPort, 'output', []);
  };

  const addPortHandlers = {
    logicSwitch: switchCaseHandler,
    eventOnKey: keyEventHandler,
    eventAdvancedKey: keyEventHandler
  };

  // =========================================================================
  // 3. REGISTRY: Default Port Dynamic Resolver (Sequential)
  // =========================================================================
  function getDynamicPortDefaults(nodeType, nextIndex, bpPorts = []) {
    if (['eventOnKey', 'eventAdvancedKey'].includes(nodeType)) {
      return { id: `onKey${nextIndex}`, dataType: 'execution', color: '#FFFFFF' };
    }

    if (nodeType.startsWith('math')) {
      return { id: `v${nextIndex}`, dataType: 'number', color: '#64B5F6' };
    }

    if (['stringJoin', 'stringFormat'].includes(nodeType)) {
      return { id: `v${nextIndex}`, dataType: 'string', color: '#F48FB1' };
    }

    if (['logicAnd', 'logicOr'].includes(nodeType)) {
      return { id: `v${nextIndex}`, dataType: 'boolean', color: '#E57373' };
    }

    if (['logicFlowMerge'].includes(nodeType)) {
      return { id: `v${nextIndex}`, dataType: 'execution', color: '#FFFFFF' };
    }

    if (bpPorts.length > 0) {
      const lastBpPort = bpPorts[bpPorts.length - 1];
      return {
        id: `v${nextIndex}`,
        dataType: lastBpPort.dataType || lastBpPort.type || 'any',
        color: lastBpPort.color || '#B0BEC5'
      };
    }

    return { id: `v${nextIndex}`, dataType: 'any', color: '#B0BEC5' };
  }

  // =========================================================================
  // 4. METADATA & PROPERTY HELPERS
  // =========================================================================
  function getDynamicMode(node) {
    if (!node) return 'none';
    const bp = getNodeBlueprint(node.type);
    return (node.dynamicMode && node.dynamicMode !== 'none')
      ? node.dynamicMode
      : (bp?.dynamicMode || 'none');
  }

  function getAvailableProperties(node) {
    if (!node) return [];
    const bp = getNodeBlueprint(node.type);
    const options = node.data?.propertyOptions || bp?.defaultData?.data?.propertyOptions || [];
    const existingPorts = [...(node.inputs || []), ...(node.outputs || [])];

    return options
      .filter(opt => !existingPorts.some(p => p.id === opt.value))
      .map(opt => ({
        label: opt.label || opt.value,
        value: opt.value,
        type: opt.type || 'number',
        color: opt.color || '#64B5F6'
      }));
  }

  function resolveNextSequentialPort(node, type = 'input') {
    const bp = getNodeBlueprint(node.type);
    const ports = type === 'input' ? (node.inputs || []) : (node.outputs || []);

    let nextIndex = 0;
    while (ports.some(p => p.id === `v${nextIndex}`)) {
      nextIndex++;
    }

    const bpPorts = type === 'input'
      ? (bp?.defaultData?.inputs || [])
      : (bp?.defaultData?.outputs || []);

    const defaults = getDynamicPortDefaults(node.type, nextIndex, bpPorts);

    return {
      id: defaults.id || `v${nextIndex}`,
      dataType: defaults.dataType || 'number',
      color: defaults.color || '#64B5F6'
    };
  }

  // =========================================================================
  // 5. CORE ACTIONS: VALUE SYNC, ADD & REMOVE PORT
  // =========================================================================
  function handleNodeValueSync(node, key, value, disconnectEdges) {
    if (!node) return;
    const handler = valueChangeHandlers[node.type];
    if (handler) {
      handler(node, key, value, disconnectEdges);
    }
  }

  async function addDynamicPort(node, type = 'input', explicitOption = null) {
    if (!node) return;

    if (isUserCustomNode(node)) {
      const ports = type === 'input' ? (node.inputs || []) : (node.outputs || []);
      const prefix = type === 'input' ? 'input' : 'result';
      let nextIdx = 1;
      while (ports.some(p => p.id === `${prefix}${nextIdx}`)) {
        nextIdx++;
      }
      const newPortId = (type === 'output' && ports.length === 0) ? 'result' : `${prefix}${nextIdx}`;
      const newPort = {
        id: newPortId,
        label: newPortId,
        dataType: 'number',
        color: '#64B5F6'
      };
      scriptStore.addNodePort(node.id, type, newPort);
      return;
    }

    const mode = getDynamicMode(node);

    // A. Mode Property Dynamic (inputProperty / outputProperty)
    if (
      (type === 'input' && mode === 'inputProperty') ||
      (type === 'output' && mode === 'outputProperty')
    ) {
      if (!explicitOption) {
        activeDropdownTarget.value = activeDropdownTarget.value === type ? null : type;
        return;
      }

      const optionValue = typeof explicitOption === 'object' && explicitOption !== null
        ? (explicitOption.value ?? explicitOption.label)
        : explicitOption;

      const bp = getNodeBlueprint(node.type);
      const options = node.data?.propertyOptions || bp?.defaultData?.data?.propertyOptions || [];
      const selected = options.find(o => o.value === optionValue || o.label === optionValue);

      if (selected) {
        const newPort = {
          id: selected.value,
          dataType: selected.type || 'number',
          color: selected.color || '#64B5F6'
        };

        scriptStore.addNodePort(node.id, type, newPort);

        if (type === 'input') {
          const values = node.data?.values || {};
          const defaultVal = selected.type === 'boolean' ? false : selected.type === 'number' ? 0 : '';
          node.data.values = { ...values, [selected.value]: defaultVal };
        }

        scriptHistory.recordPortChange(node.id, 'ADD', newPort, type, []);
      }

      activeDropdownTarget.value = null;
      return;
    }

    // B. Custom Node Handlers (e.g.: logicSwitch)
    const customAddHandler = addPortHandlers[node.type];
    if (customAddHandler) {
      await customAddHandler(node, { prompt, scriptHistory });
      return;
    }

    // C. Mode Sequential Dynamic (math, string join, logic, dsb)
    if (mode === 'sequential') {
      const newPort = resolveNextSequentialPort(node, type);

      scriptStore.addNodePort(node.id, type, newPort);

      if (type === 'input') {
        const values = node.data?.values || {};
        const defaultVal = newPort.dataType === 'boolean' ? false : newPort.dataType === 'number' ? 0 : '';
        node.data.values = { ...values, [newPort.id]: defaultVal };
      }

      scriptHistory.recordPortChange(node.id, 'ADD', newPort, type, []);
    }
  }

  function canDeleteInputPort(node, portId) {
    if (!node || !portId) return false;
    if (isUserCustomNode(node)) {
      return true;
    }
    if (PROTECTED_PORTS.includes(portId)) return false;

    if (node.type === 'logicSwitch') {
      return String(portId).startsWith('case');
    }

    if (node.type === 'eventOnKey' || node.type === 'eventAdvancedKey') {
      if (portId === 'action') return false;
      return String(portId).startsWith('key');
    }

    if (node.type === 'stringFormat') {
      if (portId === 'format' || String(portId).startsWith('format')) return false;
    }

    const mode = getDynamicMode(node);
    if (mode === 'sequential') {
      return true;
    }

    if (mode === 'inputProperty') {
      const bp = getNodeBlueprint(node.type);
      const options = node.data?.propertyOptions || bp?.defaultData?.data?.propertyOptions || [];
      return options.some(o => o.value === portId);
    }

    return false;
  }

  function canDeleteOutputPort(node, portId) {
    if (!node || !portId) return false;
    if (isUserCustomNode(node)) {
      return true;
    }
    if (PROTECTED_PORTS.includes(portId)) return false;

    if (node.type === 'logicSwitch') {
      if (portId === 'onDefault') return false;
      return String(portId).startsWith('onCase');
    }

    if (node.type === 'eventOnKey' || node.type === 'eventAdvancedKey') {
      return String(portId).startsWith('onKey');
    }

    const mode = getDynamicMode(node);
    if (mode === 'outputProperty') {
      const bp = getNodeBlueprint(node.type);
      const options = node.data?.propertyOptions || bp?.defaultData?.data?.propertyOptions || [];
      return options.some(o => o.value === portId);
    }

    return false;
  }

  function removeDynamicPort(node, portId, type = 'input') {
    if (!node) return;

    if (PROTECTED_PORTS.includes(portId)) {
      showPop({
        title: 'Protected Port',
        message: `Port "${portId}" is a core node port and cannot be removed.`,
        type: 'warning',
        duration: 3000
      });
      return;
    }

    if (node.type === 'logicSwitch') {
      if (portId === 'value' || portId === 'onDefault' || portId === 'execIn') {
        showPop({
          title: 'Protected Port',
          message: `Port "${portId}" cannot be removed.`,
          type: 'warning',
          duration: 3000
        });
        return;
      }
    }

    if (node.type === 'eventOnKey' || node.type === 'eventAdvancedKey') {
      if (portId === 'action') {
        showPop({
          title: 'Protected Port',
          message: `Port "${portId}" cannot be removed.`,
          type: 'warning',
          duration: 3000
        });
        return;
      }
    }

    const activeNode = scriptStore.activeScript?.nodes?.find(n => n.id === node.id) || node;
    const portList = type === 'input' ? activeNode.inputs : activeNode.outputs;
    const target = portList.find(p => p.id === portId);
    const targetId = target ? target.id : portId;

    const connectedEdges = (scriptStore.activeScript?.edges || []).filter(e =>
      (type === 'input' && e.target === activeNode.id && e.targetHandle === targetId) ||
      (type === 'output' && e.source === activeNode.id && e.sourceHandle === targetId)
    );

    // 1. Identify paired port to remove
    let pairedPort = null;
    if (activeNode.type === 'logicSwitch') {
      if (type === 'input' && String(targetId).startsWith('case')) {
        const caseIdx = String(targetId).replace('case', '');
        pairedPort = { type: 'output', id: `onCase${caseIdx}` };
      } else if (type === 'output' && String(targetId).startsWith('onCase')) {
        const caseIdx = String(targetId).replace('onCase', '');
        pairedPort = { type: 'input', id: `case${caseIdx}` };
      }
    } else if (activeNode.type === 'eventOnKey' || activeNode.type === 'eventAdvancedKey') {
      if (type === 'input' && String(targetId).startsWith('key')) {
        const keyIdx = String(targetId).replace('key', '');
        pairedPort = { type: 'output', id: `onKey${keyIdx}` };
      } else if (type === 'output' && String(targetId).startsWith('onKey')) {
        const keyIdx = String(targetId).replace('onKey', '');
        pairedPort = { type: 'input', id: `key${keyIdx}` };
      }
    }

    // 2. Remove primary port from scriptStore
    scriptStore.removeNodePort(activeNode.id, type, targetId);

    // 3. Remove paired port from scriptStore if present
    if (pairedPort) {
      scriptStore.removeNodePort(activeNode.id, pairedPort.type, pairedPort.id);
    }

    // 4. Clean up node.data.values and cases on the fresh node in scriptStore
    const freshNode = scriptStore.activeScript?.nodes?.find(n => n.id === node.id) || activeNode;
    if (freshNode.data?.values) {
      if (type === 'input') {
        delete freshNode.data.values[targetId];
      }
      if (pairedPort && pairedPort.type === 'input') {
        delete freshNode.data.values[pairedPort.id];
      }
    }

    if (freshNode.type === 'logicSwitch') {
      syncSwitchCases(freshNode);
    }

    // 5. Persist the updated node.data in activeScript
    scriptStore.saveActiveScript();

    if (target) {
      scriptHistory.recordPortChange(activeNode.id, 'REMOVE', target, type, connectedEdges);
    }

    const currentActiveNode = scriptStore.activeScript?.nodes?.find(n => n.id === node.id);
    if (currentActiveNode && currentActiveNode !== node) {
      node.inputs = currentActiveNode.inputs;
      node.outputs = currentActiveNode.outputs;
      if (currentActiveNode.data) node.data = currentActiveNode.data;
    }
  }

  return {
    activeDropdownTarget,
    getDynamicMode,
    getAvailableProperties,
    resolveNextSequentialPort,
    getDynamicPortDefaults,
    handleNodeValueSync,
    addDynamicPort,
    removeDynamicPort,
    canDeleteInputPort,
    canDeleteOutputPort,
    syncSwitchCases,
    isProtectedPort: (portId) => PROTECTED_PORTS.includes(portId)
  };
}
import { ref } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { usePopAlert, usePrompt } from '@composables/composables.js';
import { useNodeBlueprint } from '@nodes/nodes.js';
import { PROTECTED_PORTS } from '../../contract/portIds.js';
import { keyToPortId } from '../../contract/keyPortNames.js';

// Singleton state agar dropdown target tersinkronisasi di seluruh komponen
const activeDropdownTarget = ref(null);

/**
 * Helper: Parser Multi-Key untuk Event On Key
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

  const valueChangeHandlers = {
    eventOnKey: onKeyHandler,
    eventAdvancedKey: onKeyHandler
  };

  // =========================================================================
  // 2. REGISTRY: Custom Add Port Handlers
  // =========================================================================
  const switchCaseHandler = async (node, { prompt, scriptHistory }) => {
    const res = await prompt({
      title: 'Add Case',
      message: 'Enter value to compare (string/number):',
      defaultValue: ''
    });
    if (res === null || res.trim() === '') return;

    const caseCount = (node.outputs || []).filter(p => p.id && p.id.startsWith('onCase')).length;
    const newPort = {
      id: `onCase${caseCount}`,
      dataType: 'execution',
      color: '#FFFFFF'
    };
    scriptStore.addNodePort(node.id, 'output', newPort);
    scriptHistory.recordPortChange(node.id, 'ADD', newPort, 'output', []);
  };

  const addPortHandlers = {
    logicSwitch: switchCaseHandler
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

  function removeDynamicPort(node, portId, type = 'input') {
    if (!node) return;

    if (PROTECTED_PORTS.includes(portId)) {
      showPop({
        title: 'Protected Port',
        message: `Port "${portId}" adalah bagian inti node dan tidak bisa dihapus.`,
        type: 'warning',
        duration: 3000
      });
      return;
    }

    const portList = type === 'input' ? node.inputs : node.outputs;
    const target = portList.find(p => p.id === portId);
    const targetId = target ? target.id : portId;

    const connectedEdges = scriptStore.activeScript.edges.filter(e =>
      (type === 'input' && e.target === node.id && e.targetHandle === targetId) ||
      (type === 'output' && e.source === node.id && e.sourceHandle === targetId)
    );

    scriptStore.removeNodePort(node.id, type, targetId);

    if (type === 'input' && node.data?.values) {
      const updatedValues = { ...node.data.values };
      delete updatedValues[targetId];
      node.data.values = updatedValues;
    }

    if (target) {
      scriptHistory.recordPortChange(node.id, 'REMOVE', target, type, connectedEdges);
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
    isProtectedPort: (portId) => PROTECTED_PORTS.includes(portId)
  };
}
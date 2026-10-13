// lokasi: src/editor/nodes/composables/useDynamicPortManager.js

import { ref } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { usePopAlert, usePrompt } from '@composables/composables.js';
import { useNodeBlueprint } from '@nodes/nodes.js';

// Singleton state agar dropdown target tersinkronisasi di seluruh komponen
const activeDropdownTarget = ref(null);

const PROTECTED_PORTS = [
  'exec_in', 'exec_out', 'in_target', 'target_in', 'sk_main', 'ptr_click_main'
];

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
  const valueChangeHandlers = {
    event_on_key: (node, key, value, disconnectEdges) => {
      if (key === 'keys' || key === 'key') {
        const parsedKeys = parseKeysString(value);
        const currentOutputs = node.outputs || [];

        const newOutputs = parsedKeys.map((keyLabel, idx) => {
          const existingPort = currentOutputs[idx];
          return {
            id: existingPort ? existingPort.id : `out_${Date.now()}_${idx}`,
            label: keyLabel,
            dataType: 'execution',
            color: '#FFFFFF'
          };
        });

        if (currentOutputs.length > newOutputs.length) {
          const removedPorts = currentOutputs.slice(newOutputs.length);
          removedPorts.forEach(port => disconnectEdges(port.id));
        }

        scriptStore.updateNodeInActive(node.id, { outputs: newOutputs });
      }
    },

    event_advanced_key: (node, key, value, disconnectEdges) => {
      valueChangeHandlers.event_on_key(node, key, value, disconnectEdges);
    }
  };

  // =========================================================================
  // 2. REGISTRY: Custom Add Port Handlers
  // =========================================================================
  const addPortHandlers = {
    compare_switch: async (node, { prompt, scriptHistory }) => {
      const res = await prompt({
        title: 'Add Case',
        message: 'Enter value to compare (string/number):',
        defaultValue: ''
      });
      if (res === null || res.trim() === '') return;

      const newPort = {
        id: `case_${res}`,
        label: `Case ${res}`,
        dataType: 'execution',
        color: '#FFFFFF'
      };
      scriptStore.addNodePort(node.id, 'output', newPort);
      scriptHistory.recordPortChange(node.id, 'ADD', newPort, 'output', []);
    }
  };

  // =========================================================================
  // 3. REGISTRY: Default Port Dynamic Resolver (Sequential)
  // =========================================================================
  function getDynamicPortDefaults(nodeType, nextIndex, bpPorts = []) {
    if (nodeType === 'event_advanced_key' || nodeType === 'event_on_key') {
      return { id: `key_${nextIndex}`, label: `Key ${nextIndex + 1}`, dataType: 'execution', color: '#FFFFFF' };
    }

    if (nodeType.startsWith('math_')) {
      return { id: `v${nextIndex}`, label: `Val ${nextIndex + 1}`, dataType: 'number', color: '#64B5F6' };
    }

    if (nodeType === 'string_join') {
      return { id: `str_${nextIndex}`, label: `Str ${nextIndex + 1}`, dataType: 'string', color: '#F48FB1' };
    }

    if (nodeType === 'logic_and' || nodeType === 'logic_or') {
      return { id: `in_${nextIndex}`, label: `In ${nextIndex + 1}`, dataType: 'boolean', color: '#E57373' };
    }

    if (bpPorts.length > 0) {
      const lastBpPort = bpPorts[bpPorts.length - 1];
      return {
        id: `v${nextIndex}`,
        label: `Val ${nextIndex + 1}`,
        dataType: lastBpPort.dataType || lastBpPort.type || 'any',
        color: lastBpPort.color || '#B0BEC5'
      };
    }

    return { id: `v${nextIndex}`, label: `Val ${nextIndex + 1}`, dataType: 'any', color: '#B0BEC5' };
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
      .filter(opt => !existingPorts.some(p => p.id === opt.value || p.label === opt.label))
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
    while (ports.some(p => p.id === `v${nextIndex}` || p.label === `Val ${nextIndex + 1}`)) {
      nextIndex++;
    }

    const bpPorts = type === 'input'
      ? (bp?.defaultData?.inputs || [])
      : (bp?.defaultData?.outputs || []);

    const defaults = getDynamicPortDefaults(node.type, nextIndex, bpPorts);

    return {
      id: defaults.id || `v${nextIndex}`,
      label: defaults.label || `Val ${nextIndex + 1}`,
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
          label: selected.label,
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

    // B. Custom Node Handlers (cth: compare_switch)
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
    const target = portList.find(p => p.id === portId || p.label === portId);
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
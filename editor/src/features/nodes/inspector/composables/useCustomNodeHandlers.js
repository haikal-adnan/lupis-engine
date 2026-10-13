import { useScriptStore } from '@scripts/scripts.js';

export function useCustomNodeHandlers() {
  const scriptStore = useScriptStore();

  /**
   * Parser Pintar Multi-Key dengan Aturan Pasangan Koma:
   * 1. Token berteks (e.g. 'a', 'space', 'b') -> Key biasa.
   * 2. Dua token kosong berurutan ("" + "") -> Dianggap sebagai 1 Key Koma (',').
   * 3. Satu token kosong tunggal (e.g. 'a, ') -> Diabaikan (user sedang mengetik).
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
        // Jika menemukan token kosong, cek apakah token berikutnya juga kosong
        if (i + 1 < rawTokens.length && rawTokens[i + 1] === '') {
          parsedKeys.push(',');
          i += 2; // Konsumsi 2 token kosong menjadi 1 key koma
        } else {
          i++; // Token kosong tunggal diabaikan
        }
      }
    }

    return parsedKeys;
  }

  // =========================================================
  // 1. REGISTRY: Custom Value Change Handlers (Inspector Sync)
  // =========================================================
  const valueChangeHandlers = {
    event_on_key: (node, key, value, disconnectEdges) => {
      if (key === 'keys' || key === 'key') {
        const parsedKeys = parseKeysString(value);
        const currentOutputs = node.outputs || [];

        // Buat port output baru sesuai hasil parsing
        const newOutputs = parsedKeys.map((keyLabel, idx) => {
          const existingPort = currentOutputs[idx];
          return {
            id: existingPort ? existingPort.id : `out_${Date.now()}_${idx}`,
            label: keyLabel,
            dataType: 'execution',
            color: '#ffffff'
          };
        });

        // Putus edge jika jumlah output berkurang
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

  // =========================================================
  // 2. REGISTRY: Custom Add Port Handlers
  // =========================================================
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
        color: '#ffffff'
      };
      scriptStore.addNodePort(node.id, 'output', newPort);
      scriptHistory.recordPortChange(node.id, 'ADD', newPort, 'output', []);
    }
  };

  // =========================================================
  // 3. REGISTRY: Dynamic Port Defaults Resolver
  // =========================================================
  function getDynamicPortDefaults(nodeType, nextIndex, bpPorts = []) {
    if (nodeType === 'event_advanced_key' || nodeType === 'event_on_key') {
      return { label: `Key_${nextIndex + 1}`, dataType: 'execution', color: '#FFEB3B' };
    }
    if (nodeType.startsWith('math_')) {
      return { label: String.fromCharCode(65 + nextIndex), dataType: 'number', color: '#B2FF59' };
    }
    if (nodeType === 'string_join') {
      return { label: `Str ${nextIndex + 1}`, dataType: 'string', color: '#FFEB3B' };
    }
    if (nodeType === 'logic_and' || nodeType === 'logic_or') {
      return { label: `In ${nextIndex + 1}`, dataType: 'boolean', color: '#f472b6' };
    }

    if (bpPorts.length > 0) {
      const lastBpPort = bpPorts[bpPorts.length - 1];
      return {
        label: `Key_${nextIndex + 1}`,
        dataType: lastBpPort.dataType || lastBpPort.type || 'any',
        color: lastBpPort.color || '#ffffff'
      };
    }

    return { label: `{${nextIndex}}`, dataType: 'any', color: '#ffffff' };
  }

  // =========================================================
  // EXPOSED METHODS
  // =========================================================
  function handleNodeValueSync(node, key, value, disconnectEdges) {
    if (!node) return;
    const handler = valueChangeHandlers[node.type];
    if (handler) {
      handler(node, key, value, disconnectEdges);
    }
  }

  async function handleNodeAddPort(node, context) {
    if (!node) return false;
    const customAddHandler = addPortHandlers[node.type];
    if (customAddHandler) {
      await customAddHandler(node, context);
      return true;
    }
    return false;
  }

  return {
    handleNodeValueSync,
    handleNodeAddPort,
    getDynamicPortDefaults
  };
}
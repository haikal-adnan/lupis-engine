import { useHistory } from '@historys/historys.js';
import { useScriptStore } from '@scripts/scripts.js';

let activeTransaction = null;
let clearTransactionTimer = null;

export function useScriptHistory() {
  const { record, undo, redo, logHistory } = useHistory();
  const scriptStore = useScriptStore();

  const deepClone = (data) => (data ? JSON.parse(JSON.stringify(data)) : null);

  const restoreSelection = (nodeIds = [], edgeId = null) => {
    if (nodeIds.length > 0) {
      if (scriptStore.setSelectedNodes) {
        scriptStore.setSelectedNodes(nodeIds);
      }
      scriptStore.selectedNodeId = nodeIds[0];
    } else if (edgeId) {
      if (scriptStore.setSelectedEdge) {
        scriptStore.setSelectedEdge(edgeId);
      }
      scriptStore.selectedNodeId = null;
    } else {
      if (scriptStore.setSelectedNodes) {
        scriptStore.setSelectedNodes([]);
      }
      if (scriptStore.setSelectedEdge) {
        scriptStore.setSelectedEdge(null);
      }
      scriptStore.selectedNodeId = null;
    }
  };

  const startTransaction = () => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    if (!activeTransaction) {
      activeTransaction = { isContinuous: true, initialValues: {} };
    }
  };

  const endTransactionWithDelay = (delay = 100) => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    clearTransactionTimer = setTimeout(() => { activeTransaction = null; }, delay);
  };

  const recordMoveNodes = (movedNodes) => {
    if (!movedNodes || movedNodes.length === 0) return;
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const nodeIds = movedNodes.map(n => n.id);

    record({
      type: 'MOVE_NODES',
      description: `Move ${movedNodes.length} node(s)`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        movedNodes.forEach(({ id, oldPos }) => {
          const node = scriptStore.activeScript.nodes.find(n => n.id === id);
          if (node) node.position = deepClone(oldPos);
        });
        scriptStore.saveActiveScript();
        restoreSelection(nodeIds);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        movedNodes.forEach(({ id, newPos }) => {
          const node = scriptStore.activeScript.nodes.find(n => n.id === id);
          if (node) node.position = deepClone(newPos);
        });
        scriptStore.saveActiveScript();
        restoreSelection(nodeIds);
      }
    });
  };

  const recordAddNode = (rawNodeData) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;
    const clonedNode = deepClone(rawNodeData);

    record({
      type: 'ADD_NODE',
      description: `Add node ${clonedNode.label || clonedNode.id}`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.nodes = scriptStore.activeScript.nodes.filter(n => n.id !== clonedNode.id);
        scriptStore.saveActiveScript();
        restoreSelection([]);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.nodes.push(deepClone(clonedNode));
        scriptStore.saveActiveScript();
        restoreSelection([clonedNode.id]);
      }
    });
  };

  const recordRemoveNodes = (deletedNodes, connectedEdges) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const clonedNodes = deepClone(deletedNodes);
    const clonedEdges = deepClone(connectedEdges);
    const nodeIds = clonedNodes.map(n => n.id);

    record({
      type: 'REMOVE_NODES',
      description: `Remove ${clonedNodes.length} node(s)`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.nodes.push(...deepClone(clonedNodes));
        scriptStore.activeScript.edges.push(...deepClone(clonedEdges));
        scriptStore.saveActiveScript();
        restoreSelection(nodeIds);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.nodes = scriptStore.activeScript.nodes.filter(n => !nodeIds.includes(n.id));
        const edgeIds = clonedEdges.map(e => e.id);
        scriptStore.activeScript.edges = scriptStore.activeScript.edges.filter(e => !edgeIds.includes(e.id));
        scriptStore.saveActiveScript();
        restoreSelection([]);
      }
    });
  };

  const recordNodeDataChange = (nodeId, propPath, oldValue, newValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    let transactionKey = null;
    let originalOldValue = oldValue;

    if (activeTransaction && activeTransaction.isContinuous) {
      transactionKey = `trans_${targetScriptId}_node_${nodeId}_${propPath}`;
      if (!(transactionKey in activeTransaction.initialValues)) {
        activeTransaction.initialValues[transactionKey] = oldValue;
      }
      originalOldValue = activeTransaction.initialValues[transactionKey];
    }

    const setDeepValue = (obj, path, val) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
      target[lastKey] = val;
    };

    record({
      type: 'CHANGE_NODE_DATA',
      transactionKey,
      description: `Change ${propPath} on node ${nodeId}`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        const node = scriptStore.activeScript.nodes.find(n => n.id === nodeId);
        if (node) setDeepValue(node, propPath, deepClone(originalOldValue));
        scriptStore.saveActiveScript();
        restoreSelection([nodeId]);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        const node = scriptStore.activeScript.nodes.find(n => n.id === nodeId);
        if (node) setDeepValue(node, propPath, deepClone(newValue));
        scriptStore.saveActiveScript();
        restoreSelection([nodeId]);
      }
    });
  };

  const recordAddEdge = (edgeData, replacedEdge = null) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const clonedEdge = deepClone(edgeData);
    const clonedReplaced = deepClone(replacedEdge);

    record({
      type: 'ADD_EDGE',
      description: `Connect edge ${clonedEdge.id}`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.edges = scriptStore.activeScript.edges.filter(e => e.id !== clonedEdge.id);
        if (clonedReplaced) {
          scriptStore.activeScript.edges.push(deepClone(clonedReplaced));
        }
        scriptStore.saveActiveScript();
        restoreSelection([], clonedReplaced ? clonedReplaced.id : null);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        if (clonedReplaced) {
          scriptStore.activeScript.edges = scriptStore.activeScript.edges.filter(e => e.id !== clonedReplaced.id);
        }
        scriptStore.activeScript.edges.push(deepClone(clonedEdge));
        scriptStore.saveActiveScript();
        restoreSelection([], clonedEdge.id);
      }
    });
  };

  const recordRemoveEdge = (edgeData) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const clonedEdge = deepClone(edgeData);

    record({
      type: 'REMOVE_EDGE',
      description: `Remove edge ${clonedEdge.id}`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.edges.push(deepClone(clonedEdge));
        scriptStore.saveActiveScript();
        restoreSelection([], clonedEdge.id);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.edges = scriptStore.activeScript.edges.filter(e => e.id !== clonedEdge.id);
        scriptStore.saveActiveScript();
        restoreSelection([]);
      }
    });
  };

  const recordEdgeModifierChange = (edgeId, oldModifier, newModifier) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    record({
      type: 'CHANGE_EDGE_MODIFIER',
      description: `Change modifier on edge ${edgeId}`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        const edge = scriptStore.activeScript.edges.find(e => e.id === edgeId);
        if (edge) edge.modifier = deepClone(oldModifier);
        scriptStore.saveActiveScript();
        restoreSelection([], edgeId);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        const edge = scriptStore.activeScript.edges.find(e => e.id === edgeId);
        if (edge) edge.modifier = deepClone(newModifier);
        scriptStore.saveActiveScript();
        restoreSelection([], edgeId);
      }
    });
  };

  const recordPortChange = (nodeId, actionType, portData, portType = 'input', connectedEdges = []) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const clonedPort = deepClone(portData);
    const clonedEdges = deepClone(connectedEdges);
    const key = portType === 'input' ? 'inputs' : 'outputs';

    record({
      type: `${actionType}_PORT`,
      description: `${actionType} port ${clonedPort.id} on node ${nodeId}`,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        const node = scriptStore.activeScript.nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (actionType === 'ADD') {
          node[key] = node[key].filter(p => p.id !== clonedPort.id);
        } else {
          node[key].push(deepClone(clonedPort));
          scriptStore.activeScript.edges.push(...deepClone(clonedEdges));
        }
        scriptStore.saveActiveScript();
        restoreSelection([nodeId]);
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        const node = scriptStore.activeScript.nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (actionType === 'ADD') {
          node[key].push(deepClone(clonedPort));
        } else {
          node[key] = node[key].filter(p => p.id !== clonedPort.id);
          const edgeIds = clonedEdges.map(e => e.id);
          scriptStore.activeScript.edges = scriptStore.activeScript.edges.filter(e => !edgeIds.includes(e.id));
        }
        scriptStore.saveActiveScript();
        restoreSelection([nodeId]);
      }
    });
  };

  const recordLocalVariableChange = (oldVariables, newVariables, transactionKey = null) => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const oldCloned = deepClone(oldVariables);
    const newCloned = deepClone(newVariables);

    let finalTransactionKey = transactionKey;
    let originalOldCloned = oldCloned;

    if (activeTransaction && activeTransaction.isContinuous) {
      finalTransactionKey = transactionKey || `trans_${targetScriptId}_local_vars`;
      if (!(finalTransactionKey in activeTransaction.initialValues)) {
        activeTransaction.initialValues[finalTransactionKey] = oldCloned;
      }
      originalOldCloned = activeTransaction.initialValues[finalTransactionKey];
    }

    record({
      type: 'CHANGE_LOCAL_VARIABLES',
      transactionKey: finalTransactionKey,
      description: 'Change local variables list',
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.localVariables = deepClone(originalOldCloned);
        scriptStore.saveActiveScript();
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.localVariables = deepClone(newCloned);
        scriptStore.saveActiveScript();
      }
    });
  };

  const recordOverrideNodes = (oldNodes, oldEdges, newNodes, newEdges, description = 'Override Nodes') => {
    const targetScriptId = scriptStore.activeScript?.id;
    if (!targetScriptId) return;

    const oldNodesCloned = deepClone(oldNodes);
    const oldEdgesCloned = deepClone(oldEdges);
    const newNodesCloned = deepClone(newNodes);
    const newEdgesCloned = deepClone(newEdges);

    record({
      type: 'OVERRIDE_NODES',
      description,
      undo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.nodes = deepClone(oldNodesCloned);
        scriptStore.activeScript.edges = deepClone(oldEdgesCloned);
        scriptStore.saveActiveScript();
      },
      redo: () => {
        if (scriptStore.activeScript?.id !== targetScriptId) return;
        scriptStore.activeScript.nodes = deepClone(newNodesCloned);
        scriptStore.activeScript.edges = deepClone(newEdgesCloned);
        scriptStore.saveActiveScript();
      }
    });
  };

  return {
    startTransaction,
    endTransactionWithDelay,
    recordMoveNodes,
    recordAddNode,
    recordRemoveNodes,
    recordNodeDataChange,
    recordAddEdge,
    recordRemoveEdge,
    recordEdgeModifierChange,
    recordPortChange,
    recordLocalVariableChange,
    recordOverrideNodes,
    undo,
    redo,
    logHistory
  };
}
// Dynamic input port operations for visual scripting nodes.

import { useSceneStore } from '@scenes/scenes.js';

export function useNodeActions() {
  const sceneStore = useSceneStore();

  // Adds a sequential dynamic input port to a node
  const addDynamicInput = (nodeId) => {
    const scene = sceneStore.activeScene;
    const node =
      scene?.entities?.find(n => n.id === nodeId) ||
      scene?.nodes?.find(n => n.id === nodeId);
    
    if (!node) return;

    const currentCount = node.inputs.length;
    const newId = String(currentCount);

    const newInput = {
      id: newId,
      label: `{${newId}}`,
      type: 'any',
      color: '#fff'
    };

    node.inputs.push(newInput);
  };

  // Removes the last dynamic input port while maintaining minimum ports
  const removeDynamicInput = (nodeId) => {
    const scene = sceneStore.activeScene;
    const node = scene?.entities?.find(n => n.id === nodeId); 
    
    if (!node || node.inputs.length <= 2) return;

    node.inputs.pop();
  };

  return {
    addDynamicInput,
    removeDynamicInput
  };
}

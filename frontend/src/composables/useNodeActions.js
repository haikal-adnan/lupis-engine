import { useSceneStore } from '@/stores/scene/useSceneStore';

export function useNodeActions() {
  const sceneStore = useSceneStore();

  const addDynamicInput = (nodeId) => {
    const scene = sceneStore.activeScene;
    const node =
      scene.entities.find(n => n._id === nodeId) ||
      scene.nodes.find(n => n._id === nodeId);
    
    if (!node) return;

    const currentCount = node.inputs.length;
    const newId = String(currentCount);

    const newInput = {
      _id: newId,
      label: `{${newId}}`,
      type: 'any',
      color: '#fff'
    };

    node.inputs.push(newInput);
  };

  const removeDynamicInput = (nodeId) => {
    const scene = sceneStore.activeScene;
    const node = scene.entities.find(n => n._id === nodeId); 
    
    if (!node || node.inputs.length <= 2) return;

    node.inputs.pop();
  };

  return {
    addDynamicInput,
    removeDynamicInput
  };
}

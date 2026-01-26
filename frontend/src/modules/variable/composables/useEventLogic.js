import { computed } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export function useEventLogic() {
  const projectStore = useProjectStore();

  const globalEvents = computed(() => projectStore.activeProject?.globalEvents || []);

  const saveList = (newList) => {
    projectStore.updateProject(projectStore.activeProject._id, { globalEvents: newList });
  };

  const addGlobalEvent = () => {
    const newList = [
      ...globalEvents.value, 
      { 
        _id: GenerateUUID(), 
        name: 'NewEvent',
        description: '' 
      }
    ];
    saveList(newList);
  };

  const updateGlobalEvent = (index, key, value) => {
    const newList = JSON.parse(JSON.stringify(globalEvents.value));
    newList[index][key] = value;
    saveList(newList);
  };

  const deleteGlobalEvent = (index) => {
    if(!confirm('Delete this event definition? Nodes using it might break.')) return;
    const newList = [...globalEvents.value];
    newList.splice(index, 1);
    saveList(newList);
  };

  return {
    globalEvents,
    addGlobalEvent,
    updateGlobalEvent,
    deleteGlobalEvent
  };
}
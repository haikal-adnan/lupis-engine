import { ref, computed } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';
import { Radio } from 'lucide-vue-next'; 

// Import definisi statis
import { basicEvent } from '@/modules/variable/definitions/basicEvent.js';
import { basicTransform } from '@/modules/variable/definitions/basicTransform.js'; // <-- Pastikan ini versi baru
import { basicMath } from '@/modules/variable/definitions/basicMath.js';
import { basicUI } from '@/modules/variable/definitions/basicUI.js';
import { basicString } from '@/modules/variable/definitions/basicString';

export const STATIC_NODE_GROUPS = [
  basicEvent,        
  basicTransform,    
  basicMath,         
  basicUI,
  basicString 
];

export function useNodeTemplate() {
  const projectStore = useProjectStore();
  const searchQuery = ref('');

  const dynamicGroups = computed(() => {
    // Clone array statis
    const groups = [...STATIC_NODE_GROUPS]; 

    // Generate Global Events Nodes
    const globalEvents = projectStore.activeProject?.globalEvents || [];

    if (globalEvents.length > 0) {
      const globalItems = [];

      globalEvents.forEach(evt => {
        // Node A: Listener (Event)
        globalItems.push({
          type: 'event_global_listener',
          label: `On ${evt.name}`,
          description: `Wait for ${evt.name}`,
          defaultData: {
            settings: { 
                headerTitle: `On ${evt.name}`, 
                headerColor: '#7B1FA2', 
                category: 'Global Event' 
            },
            data: { eventId: evt._id, eventName: evt.name },
            outputs: [
                { _id: 'out', label: 'Trigger', type: 'execution', color: '#fff' }
            ],
            inputs: [] 
          }
        });

        // Node B: Trigger (Action)
        globalItems.push({
          type: 'action_trigger_global',
          label: `Trigger ${evt.name}`,
          description: `Broadcast ${evt.name}`,
          defaultData: {
            settings: { 
                headerTitle: `Trigger ${evt.name}`, 
                333333333: '#9C27B0', 
                category: 'Global Event' 
            },
            data: { eventId: evt._id, eventName: evt.name },
            inputs: [
                { _id: 'in', label: 'In', type: 'execution', color: '#fff' }
            ],
            outputs: [
                { _id: 'out', label: 'Out', type: 'execution', color: '#fff' }
            ]
          }
        });
      });

      // Sisipkan di posisi kedua (setelah Basic Events)
      groups.splice(1, 0, {
        id: 'global_events',
        label: 'Global Events',
        color: '#9C27B0',
        icon: Radio,
        items: globalItems
      });
    }

    return groups;
  });

  // Filter Search Logic
  const filteredGroups = computed(() => {
    const allGroups = dynamicGroups.value;
    if (!searchQuery.value) return allGroups;
    
    const q = searchQuery.value.toLowerCase();
    
    return allGroups.map(g => ({
      ...g,
      items: g.items.filter(i => i.label.toLowerCase().includes(q))
    })).filter(g => g.items.length > 0);
  });

  const onDragNode = (event, item) => {
    event.dataTransfer.setData('application/node-template', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return {
    searchQuery,
    filteredGroups,
    onDragNode
  };
}
import { ref, computed } from 'vue';
import { useProjectStore } from '@/stores/useProjectStore';
import { Radio } from 'lucide-vue-next'; 

import { BlueprintLifecycle } from '@/modules/variable/parts/BlueprintLifecycle.js'
import { BlueprintKeyboard } from '@/modules/variable/parts/BlueprintKeyboard.js'
import { BlueprintTransform } from '@/modules/variable/parts/BlueprintTransform.js'
import { BlueprintMath } from '@/modules/variable/parts/BlueprintMath.js'
import { BlueprintSystem } from '@/modules/variable/parts/BlueprintSystem.js'
import { BlueprintString } from '@/modules/variable/parts/BlueprintString.js'
import { BlueprintObject } from '@/modules/variable/parts/BlueprintObject.js'
import { BlueprintProgramming } from '@/modules/variable/parts/BlueprintProgramming.js'
import { BlueprintBoolean } from '@/modules/variable/parts/BlueprintBoolean.js'
import { BlueprintComparison } from '@/modules/variable/parts/BlueprintComparison.js'
import { BlueprintPointer } from '@/modules/variable/parts/BlueprintPointer.js'
import { BlueprintCamera } from '@/modules/variable/parts/BlueprintCamera.js'
import { BlueprintCollider } from '@/modules/variable/parts/BlueprintCollider.js'
import { BlueprintPhysics } from '@/modules/variable/parts/BlueprintPhysics.js'
import { BlueprintRenderer } from '@/modules/variable/parts/BlueprintRenderer';

export const STATIC_NODE_GROUPS = [
  BlueprintRenderer,
  BlueprintLifecycle,
  BlueprintProgramming,
  BlueprintBoolean,
  BlueprintComparison,
  BlueprintKeyboard,
  BlueprintPointer,
  BlueprintTransform,
  BlueprintMath,
  BlueprintSystem,
  BlueprintString,
  BlueprintObject,
  BlueprintCamera,
  BlueprintCollider,
  BlueprintPhysics
]


export function useNodeBlueprint() {
  const projectStore = useProjectStore();
  const searchQuery = ref('');

  const dynamicGroups = computed(() => {
    const groups = [...STATIC_NODE_GROUPS]; 

    const globalEvents = projectStore.activeProject?.globalEvents || [];

    if (globalEvents.length > 0) {
      const globalItems = [];

      globalEvents.forEach(evt => {
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
              { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' }
            ],
            inputs: [] 
          }
        });

        globalItems.push({
          type: 'action_trigger_global',
          label: `Trigger ${evt.name}`,
          description: `Broadcast ${evt.name}`,
          defaultData: {
            settings: { 
              headerTitle: `Trigger ${evt.name}`, 
              headerColor: '#9C27B0', 
              category: 'Global Event' 
            },
            data: { eventId: evt._id, eventName: evt.name },
            inputs: [
              { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' }
            ],
            outputs: [
              { _id: 'out', label: 'Out', dataType: 'execution', color: '#fff' }
            ]
          }
        });
      });

      groups.splice(1, 0, {
        _id: 'global_events', 
        label: 'Global Events',
        color: '#9C27B0',
        icon: Radio,
        items: globalItems
      });
    }

    return groups;
  });

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
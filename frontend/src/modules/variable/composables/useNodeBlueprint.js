import { ref, computed } from 'vue';
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
  const searchQuery = ref('');

  const filteredGroups = computed(() => {
    const allGroups = STATIC_NODE_GROUPS;
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
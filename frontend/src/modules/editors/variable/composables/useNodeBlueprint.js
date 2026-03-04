import { ref, computed } from 'vue';
import { BlueprintLifecycle } from '@editors/variable/parts/BlueprintLifecycle.js'
import { BlueprintKeyboard } from '@editors/variable/parts/BlueprintKeyboard.js'
import { BlueprintTransform } from '@editors/variable/parts/BlueprintTransform.js'
import { BlueprintMath } from '@editors/variable/parts/BlueprintMath.js'
import { BlueprintSystem } from '@editors/variable/parts/BlueprintSystem.js'
import { BlueprintString } from '@editors/variable/parts/BlueprintString.js'
import { BlueprintObject } from '@editors/variable/parts/BlueprintObject.js'
import { BlueprintProgramming } from '@editors/variable/parts/BlueprintProgramming.js'
import { BlueprintBoolean } from '@editors/variable/parts/BlueprintBoolean.js'
import { BlueprintComparison } from '@editors/variable/parts/BlueprintComparison.js'
import { BlueprintPointer } from '@editors/variable/parts/BlueprintPointer.js'
import { BlueprintCamera } from '@editors/variable/parts/BlueprintCamera.js'
import { BlueprintCollider } from '@editors/variable/parts/BlueprintCollider.js'
import { BlueprintPhysics } from '@editors/variable/parts/BlueprintPhysics.js'
import { BlueprintRenderer } from '@editors/variable/parts/BlueprintRenderer';
import { BlueprintLayer } from '@editors/variable/parts/BlueprintLayer';
import { BlueprintScene } from '@editors/variable/parts/BlueprintScene';
import { BlueprintMouse } from '@editors/variable/parts/BlueprintMouse';

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
  BlueprintPhysics,
  BlueprintLayer,
  BlueprintScene,
  BlueprintMouse
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
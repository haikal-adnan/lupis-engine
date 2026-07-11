import { ref, computed } from 'vue';
import { BlueprintLifecycle } from '@editors/variable/parts/BlueprintLifecycle.js'
import { BlueprintKeyboard } from '@editors/variable/parts/BlueprintKeyboard.js'
import { BlueprintTransform } from '@editors/variable/parts/BlueprintTransform.js'
import { BlueprintMath } from '@editors/variable/parts/BlueprintMath.js'
import { BlueprintSystem } from '@editors/variable/parts/BlueprintSystem.js'
import { BlueprintString } from '@editors/variable/parts/BlueprintString.js'
import { BlueprintObject } from '@editors/variable/parts/BlueprintObject.js'
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
import { BlueprintAnimator } from '@editors/variable/parts/BlueprintAnimator';
import { BlueprintTransition } from '@editors/variable/parts/BlueprintTransition';
import { BlueprintEvent } from '@editors/variable/parts/BlueprintEvent';
import { BlueprintCollectionHelper } from '@editors/variable/parts/BlueprintCollectionHelper';
import { BlueprintList } from '@editors/variable/parts/BlueprintList';
import { BlueprintMap } from '@editors/variable/parts/BlueprintMap';
import { BlueprintLoop } from '@editors/variable/parts/BlueprintLoop';
import { BlueprintHelper } from '@editors/variable/parts/BlueprintHelper';
import { BlueprintEntity } from '@editors/variable/parts/BlueprintEntity';
import { BlueprintRandom } from '@editors/variable/parts/BlueprintRandom';

const rawGroups = [
  BlueprintRandom,
  BlueprintEntity,
  BlueprintLoop,
  BlueprintHelper,
  BlueprintList,
  BlueprintMap,
  BlueprintCollectionHelper,
  BlueprintRenderer,
  BlueprintLifecycle,
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
  BlueprintMouse,
  BlueprintAnimator,
  BlueprintTransition,
  BlueprintEvent
];

export const STATIC_NODE_GROUPS = [...rawGroups].sort((a, b) => {
  return a.label.localeCompare(b.label);
});

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
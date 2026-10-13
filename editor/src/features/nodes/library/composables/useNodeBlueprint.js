import { ref, computed } from 'vue';
import { BlueprintLifecycle } from '@nodes/library/blueprints/BlueprintLifecycle.js';
import { BlueprintKeyboard } from '@nodes/library/blueprints/BlueprintKeyboard.js';
import { BlueprintTransform } from '@nodes/library/blueprints/BlueprintTransform.js';
import { BlueprintMath } from '@nodes/library/blueprints/BlueprintMath.js';
import { BlueprintSystem } from '@nodes/library/blueprints/BlueprintSystem.js';
import { BlueprintString } from '@nodes/library/blueprints/BlueprintString.js';
import { BlueprintObject } from '@nodes/library/blueprints/BlueprintObject.js';
import { BlueprintBoolean } from '@nodes/library/blueprints/BlueprintBoolean.js';
import { BlueprintComparison } from '@nodes/library/blueprints/BlueprintComparison.js';
import { BlueprintPointer } from '@nodes/library/blueprints/BlueprintPointer.js';
import { BlueprintCamera } from '@nodes/library/blueprints/BlueprintCamera.js';
import { BlueprintCollider } from '@nodes/library/blueprints/BlueprintCollider.js';
import { BlueprintPhysics } from '@nodes/library/blueprints/BlueprintPhysics.js';
import { BlueprintRenderer } from '@nodes/library/blueprints/BlueprintRenderer.js';
import { BlueprintLayer } from '@nodes/library/blueprints/BlueprintLayer.js';
import { BlueprintScene } from '@nodes/library/blueprints/BlueprintScene.js';
import { BlueprintMouse } from '@nodes/library/blueprints/BlueprintMouse.js';
import { BlueprintAnimator } from '@nodes/library/blueprints/BlueprintAnimator.js';
import { BlueprintTransition } from '@nodes/library/blueprints/BlueprintTransition.js';
import { BlueprintEvent } from '@nodes/library/blueprints/BlueprintEvent.js';
import { BlueprintCollectionHelper } from '@nodes/library/blueprints/BlueprintCollectionHelper.js';
import { BlueprintList } from '@nodes/library/blueprints/BlueprintList.js';
import { BlueprintMap } from '@nodes/library/blueprints/BlueprintMap.js';
import { BlueprintLoop } from '@nodes/library/blueprints/BlueprintLoop.js';
import { BlueprintHelper } from '@nodes/library/blueprints/BlueprintHelper.js';
import { BlueprintEntity } from '@nodes/library/blueprints/BlueprintEntity.js';
import { BlueprintRandom } from '@nodes/library/blueprints/BlueprintRandom.js';
import { BlueprintVariable } from '@nodes/library/blueprints/BlueprintVariable.js';

const rawGroups = [
  BlueprintRandom, BlueprintEntity, BlueprintLoop, BlueprintHelper,
  BlueprintList, BlueprintMap, BlueprintCollectionHelper, BlueprintRenderer,
  BlueprintLifecycle, BlueprintBoolean, BlueprintComparison, BlueprintKeyboard,
  BlueprintPointer, BlueprintTransform, BlueprintMath, BlueprintSystem,
  BlueprintString, BlueprintObject, BlueprintCamera, BlueprintCollider,
  BlueprintPhysics, BlueprintLayer, BlueprintScene, BlueprintMouse,
  BlueprintAnimator, BlueprintTransition, BlueprintEvent, BlueprintVariable
];

export function useNodeBlueprint() {
  const searchQuery = ref('');

  const nodeGroups = [...rawGroups].sort((a, b) => a.label.localeCompare(b.label));

  const filteredGroups = computed(() => {
    if (!searchQuery.value) return nodeGroups;
    
    const q = searchQuery.value.toLowerCase();
    
    return nodeGroups.map(g => ({
      ...g,
      items: g.items.filter(i => i.label.toLowerCase().includes(q))
    })).filter(g => g.items.length > 0);
  });

  const onDragNode = (event, item) => {
    event.dataTransfer.setData('application/node-template', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const getNodeBlueprint = (type) => {
    for (const group of rawGroups) {
      if (Array.isArray(group.items)) {
        const found = group.items.find(item => item.type === type);
        if (found) return found;
      }
    }
    return null;
  };

  const getDefaultValueByDataType = (dataType) => {
    const type = String(dataType || '').toLowerCase();
    if (type === 'number' || type === 'float' || type === 'int') return 0;
    if (type === 'boolean' || type === 'bool') return false;
    return '';
  };

  const syncDynamicInputsAndCode = (node) => {
    if (!node || !Array.isArray(node.inputs)) return;

    if (!node.data) node.data = {};
    if (!node.data.values) node.data.values = {};

    const execInputs = node.inputs.filter(p => {
      const dType = String(p.dataType || '').toLowerCase();
      const pId = String(p.id || '').toLowerCase();
      return dType === 'execution' || pId === 'exec_in';
    });

    const dataInputs = node.inputs.filter(p => {
      const dType = String(p.dataType || '').toLowerCase();
      const pId = String(p.id || '').toLowerCase();
      return dType !== 'execution' && pId !== 'exec_in';
    });

    const newValues = {};

    const reindexedDataInputs = dataInputs.map((port, index) => {
      const sequenceNum = index + 1;
      const portId = `v${index}`;
      
      const existingValue = node.data.values[port.id] ?? node.data.values[portId];
      newValues[portId] = existingValue !== undefined ? existingValue : getDefaultValueByDataType(port.dataType);

      return {
        ...port,
        id: portId,
        label: `Val ${sequenceNum}`
      };
    });

    node.inputs = [...execInputs, ...reindexedDataInputs];
    node.data.values = newValues;

    const constDeclarations = reindexedDataInputs.map((port, index) => {
      const varName = `val${index + 1}`;
      return `const ${varName} = inputs['${port.label}'];`;
    });

    const varNames = reindexedDataInputs.map((_, index) => `val${index + 1}`);
    const collectionLine = `const collection = [${varNames.join(', ')}];`;

    const blueprintItem = getNodeBlueprint(node.type);
    const baseCode = blueprintItem?.defaultData?.data?.code || node.data?.code || '';

    let bodyLogic = '';
    const collectionIndex = baseCode.indexOf('const collection =');
    if (collectionIndex !== -1) {
      const afterCollection = baseCode.substring(collectionIndex);
      bodyLogic = afterCollection.substring(afterCollection.indexOf('\n') + 1);
    } else {
      bodyLogic = baseCode;
    }

    node.data.code = `${constDeclarations.join('\n')}

${collectionLine}

${bodyLogic.trim()}`;
  };

  return {
    nodeGroups,
    searchQuery,
    filteredGroups,
    onDragNode,
    getNodeBlueprint,
    syncDynamicInputsAndCode
  };
}
import { Box } from 'lucide-vue-next';

export const BlueprintEntity = {
  id: 'game_entity',
  label: 'Entity Management',
  color: '#E91E63',
  icon: Box,
  items: [
    {
      type: 'entitySpawn',
      label: 'Spawn Prefab',
      description: 'Instantiates a new entity prefab into the world at specified position.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Spawn Prefab',
          headerColor: '#E91E63',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'prefabName', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'x', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'layerId', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'zIndex', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'customId', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            prefabName: '',
            x: 0,
            y: 0,
            layerId: '',
            zIndex: 0,
            customId: ''
          },
          code: 
`const newEntity = context.prefab.spawn(inputs.prefabName, inputs.x, inputs.y, inputs.layerId, inputs.zIndex, inputs.customId);
outputs.targetEntity = newEntity ? newEntity.scriptId : '';
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityDestroy',
      label: 'Destroy Entity',
      description: 'Removes an entity from the world.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy Entity',
          headerColor: '#D32F2F',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { targetEntity: 'self' },
          code: 
`const targetEntity = context.entity.get(inputs.targetEntity);
context.entity.destroy(targetEntity);
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityDestroyWithParent',
      label: 'Destroy With Parent',
      description: 'Destroys the top-level parent entity if available, otherwise destroys target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy With Parent',
          headerColor: '#D32F2F',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { targetEntity: 'self' },
          code: 
`const targetEntity = context.entity.get(inputs.targetEntity);
const parentEntity = context.entity.getParent(targetEntity);
context.entity.destroy(parentEntity || targetEntity);
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityClone',
      label: 'Clone Entity',
      description: 'Creates a duplicate of an existing entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Clone Entity',
          headerColor: '#E91E63',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sourceEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { sourceEntity: 'self' },
          code: 
`const sourceEntity = context.entity.get(inputs.sourceEntity);
const res = context.entity.clone(sourceEntity);
outputs.targetEntity = res ? res.scriptId : '';
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityGetChildren',
      label: 'Get Entity Children',
      description: 'Retrieves all child entities or a specific child by index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Entity Children',
          headerColor: '#8E24AA',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'childEntities', dataType: 'list', color: '#4DD0E1' },
          { id: 'childEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { targetEntity: 'self', index: 0 },
          code: 
`const parentEntity = context.entity.get(inputs.targetEntity);
const children = context.entity.getChildren(parentEntity);
const childrenIds = children.map(c => c.scriptId);
const indexVal = Math.floor(inputs.index);

outputs.childEntities = childrenIds;
outputs.childEntity = (indexVal >= 0 && indexVal < childrenIds.length) ? childrenIds[indexVal] : '';
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityGetParent',
      label: 'Get Entity Parent',
      description: 'Retrieves the parent entity ID of the target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Entity Parent',
          headerColor: '#8E24AA',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'parentEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { targetEntity: 'self' },
          code: 
`const childEntity = context.entity.get(inputs.targetEntity);
const parent = context.entity.getParent(childEntity);
outputs.parentEntity = parent ? parent.scriptId : '';
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};
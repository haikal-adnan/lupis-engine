import { Box } from 'lucide-vue-next';

export const BlueprintObject = {
  id: 'game_object_basic',
  label: 'Basic Object',
  color: '#00BCD4',
  icon: Box,
  items: [
    {
      type: 'getObject',
      label: 'Get Object Info',
      description: 'Get entity info like Entity ID, Name, Tag, Active, Visible',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Object',
          headerColor: '#00838F',
          category: 'Basic Object'
        },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            targetEntity: 'self'
          },
          propertyOptions: [
            { value: 'entityId', label: 'Entity ID', type: 'string', color: '#F48FB1' },
            { value: 'name', label: 'Name', type: 'string', color: '#F48FB1' },
            { value: 'tagName', label: 'Tag Name', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

outputs.entityId = entity.scriptId;
outputs.name = entity.name;
outputs.tagName = entity.tag;
outputs.active = entity.active;
outputs.visible = entity.visible;
return;`
        }
      }
    },
    {
      type: 'setObject',
      label: 'Set Object Info',
      description: 'Set entity info like Name, Tag, Active, Visible',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Object',
          headerColor: '#00838F',
          category: 'Basic Object'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#F48FB1' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

const propKeys = ['name', 'tag', 'active', 'visible'];
for (const key of propKeys) {
  if (key in inputs) {
    entity[key] = inputs[key];
  }
}

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'findClosestByTag',
      label: 'Find Closest By Tag',
      description: 'Finds the nearest active entity with a specific tag relative to a 2D position',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Find Closest Tag',
          headerColor: '#00838F',
          category: 'Basic Object'
        },
        inputs: [
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: 'Enemy' },
          { id: 'fromX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'fromY', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'found', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { tag: 'Enemy', fromX: 0, fromY: 0 },
          code: 
`const closest = context.entity.findClosestByTag(inputs.tag, inputs.fromX, inputs.fromY);

outputs.targetEntity = closest ? closest.scriptId : '';
outputs.found = Boolean(closest);
return;`
        }
      }
    }
  ]
};
import { Move } from 'lucide-vue-next';

export const BlueprintTransform = {
  id: 'game_transform',
  label: 'Transform',
  color: '#64B5F6',
  icon: Move,
  items: [
    {
      type: 'getTransform',
      label: 'Get Transform',
      description: 'Get specific transform properties of Self or Target.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Transform',
          headerColor: '#64B5F6',
          category: 'Transform'
        },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#64B5F6' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#64B5F6' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#64B5F6' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#64B5F6' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#64B5F6' },
            { value: 'width', label: 'Width', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Height', type: 'number', color: '#64B5F6' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#64B5F6' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#64B5F6' },
            { value: 'anchorX', label: 'Anchor X', type: 'number', color: '#64B5F6' },
            { value: 'anchorY', label: 'Anchor Y', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

outputs.x = t.x;
outputs.y = t.y;
outputs.rotation = t.rotation;
outputs.scaleX = t.scaleX;
outputs.scaleY = t.scaleY;
outputs.width = t.width;
outputs.height = t.height;
outputs.pivotX = t.pivotX;
outputs.pivotY = t.pivotY;
outputs.anchorX = t.anchorX;
outputs.anchorY = t.anchorY;
return;`
        }
      }
    },

    {
      type: 'setTransform',
      label: 'Set Transform',
      description: 'Teleport or modify absolute transform properties.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Transform',
          headerColor: '#64B5F6',
          category: 'Transform'
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
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#64B5F6' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#64B5F6' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#64B5F6' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#64B5F6' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#64B5F6' },
            { value: 'width', label: 'Width', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Height', type: 'number', color: '#64B5F6' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#64B5F6' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#64B5F6' },
            { value: 'anchorX', label: 'Anchor X', type: 'number', color: '#64B5F6' },
            { value: 'anchorY', label: 'Anchor Y', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

const propKeys = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'width', 'height', 'pivotX', 'pivotY', 'anchorX', 'anchorY'];
for (const key of propKeys) {
  if (key in inputs) {
    const val = inputs[key];
    if (val !== '' && !isNaN(val)) {
      t[key] = Number(val);
    }
  }
}

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};
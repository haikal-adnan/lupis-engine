import { Move } from 'lucide-vue-next';

export const BlueprintTransform = {
  id: 'game_transform',
  label: 'Transform',
  color: '#64B5F6',
  icon: Move,
  items: [
    {
      type: 'get_transform',
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
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: { target_in: 'self' },
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
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.getEntity ? context.getEntity(targetId) : context.entity?.get(targetId);
const t = entity?.components?.UITransform || entity?.components?.Transform;

if (t) {
  outputs['Position X'] = t.x ?? 0;
  outputs['x'] = t.x ?? 0;

  outputs['Position Y'] = t.y ?? 0;
  outputs['y'] = t.y ?? 0;

  outputs['Rotation'] = t.rotation ?? 0;
  outputs['rotation'] = t.rotation ?? 0;

  outputs['Scale X'] = t.scaleX ?? 1;
  outputs['scaleX'] = t.scaleX ?? 1;

  outputs['Scale Y'] = t.scaleY ?? 1;
  outputs['scaleY'] = t.scaleY ?? 1;

  outputs['Width'] = t.width ?? 0;
  outputs['width'] = t.width ?? 0;

  outputs['Height'] = t.height ?? 0;
  outputs['height'] = t.height ?? 0;

  outputs['Pivot X'] = t.pivotX ?? 0.5;
  outputs['pivotX'] = t.pivotX ?? 0.5;

  outputs['Pivot Y'] = t.pivotY ?? 0.5;
  outputs['pivotY'] = t.pivotY ?? 0.5;

  outputs['Anchor X'] = t.anchorX ?? 0.5;
  outputs['anchorX'] = t.anchorX ?? 0.5;

  outputs['Anchor Y'] = t.anchorY ?? 0.5;
  outputs['anchorY'] = t.anchorY ?? 0.5;
}
return;`
        }
      }
    },

    {
      type: 'set_transform',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { target_in: 'self' },
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
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.getEntity ? context.getEntity(targetId) : context.entity?.get(targetId);
const t = entity?.components?.UITransform || entity?.components?.Transform;

if (t) {
  const props = {
    'Position X': 'x',
    'Position Y': 'y',
    'Rotation': 'rotation',
    'Scale X': 'scaleX',
    'Scale Y': 'scaleY',
    'Width': 'width',
    'Height': 'height',
    'Pivot X': 'pivotX',
    'Pivot Y': 'pivotY',
    'Anchor X': 'anchorX',
    'Anchor Y': 'anchorY'
  };

  Object.keys(props).forEach(label => {
    const propKey = props[label];
    const val = inputs[label] !== undefined ? inputs[label] : inputs[propKey];
    if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
      t[propKey] = Number(val);
    }
  });
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};
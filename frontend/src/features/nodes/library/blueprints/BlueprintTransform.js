import { Move, Axis3d } from 'lucide-vue-next';

export const BlueprintTransform = {
  id: 'game_transform',
  label: 'Transform',
  color: '#4CAF50',
  icon: Move,
  items: [
    // 1. GET TRANSFORM (Pure Node - Dynamic Outputs)
    { 
      type: 'get_transform', 
      label: 'Get Transform', 
      description: 'Get specific transform properties of Self or Target', 
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: true, 
      defaultData: { 
        settings: { headerTitle: 'Get Transform', headerColor: '#2E7D32', category: 'Transform' },
        inputs: [
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [], 
        data: {
          values: { target_in: 'self' },
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#B2FF59' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#B2FF59' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#B2FF59' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#B2FF59' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#B2FF59' },
            { value: 'width', label: 'Width', type: 'number', color: '#B2FF59' },
            { value: 'height', label: 'Height', type: 'number', color: '#B2FF59' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#B2FF59' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#B2FF59' },
            { value: 'anchorX', label: 'Anchor X', type: 'number', color: '#B2FF59' },
            { value: 'anchorY', label: 'Anchor Y', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);
const t = entity?.components?.UITransform || entity?.components?.Transform;

if (t) {
    outputs['Position X'] = t.x ?? 0;
    outputs['Position Y'] = t.y ?? 0;
    outputs['Rotation'] = t.rotation ?? 0;
    outputs['Scale X'] = t.scaleX ?? 1;
    outputs['Scale Y'] = t.scaleY ?? 1;
    outputs['Width'] = t.width ?? 0;
    outputs['Height'] = t.height ?? 0;
    outputs['Pivot X'] = t.pivotX ?? 0.5;
    outputs['Pivot Y'] = t.pivotY ?? 0.5;
    outputs['Anchor X'] = t.anchorX ?? 0.5;
    outputs['Anchor Y'] = t.anchorY ?? 0.5;
}
return;`
        }
      } 
    },

    // 2. SET TRANSFORM (Action Node - Dynamic Inputs)
    { 
      type: 'set_transform', 
      label: 'Set Transform', 
      description: 'Teleport or modify absolute transform properties', 
      icon: Axis3d,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Transform', headerColor: '#2E7D32', category: 'Transform' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: { target_in: 'self' },
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#B2FF59' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#B2FF59' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#B2FF59' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#B2FF59' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#B2FF59' },
            { value: 'width', label: 'Width', type: 'number', color: '#B2FF59' },
            { value: 'height', label: 'Height', type: 'number', color: '#B2FF59' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#B2FF59' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#B2FF59' },
            { value: 'anchorX', label: 'Anchor X', type: 'number', color: '#B2FF59' },
            { value: 'anchorY', label: 'Anchor Y', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);
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
        const val = inputs[label];
        if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
            t[propKey] = Number(val);
        }
    });
}

outputs['Out'] = true;
return;`
        }
      } 
    }
  ]
};
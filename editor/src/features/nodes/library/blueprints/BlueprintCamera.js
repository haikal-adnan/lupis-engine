import { Camera } from 'lucide-vue-next';

export const BlueprintCamera = {
  id: 'category_camera',
  label: 'Camera',
  color: '#F59E0B',
  icon: Camera,
  items: [
    {
      type: 'action_camera_follow',
      label: 'Camera Follow',
      description: 'Membuat kamera mengikuti entity target secara halus (smooth).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Camera Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_entity', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'smooth_speed', label: 'Smoothness', dataType: 'number', color: '#64B5F6', defaultValue: 0.1 },
          { id: 'offset_x', label: 'Offset X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'offset_y', label: 'Offset Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target_entity: 'self',
            smooth_speed: 0.1,
            offset_x: 0,
            offset_y: 0
          },
          code: 
`const target = inputs['Target Entity'] ?? inputs['target_entity'] ?? 'self';
const smoothness = Number(inputs['Smoothness'] ?? inputs['smooth_speed'] ?? 0.1);
const offsetX = Number(inputs['Offset X'] ?? inputs['offset_x'] ?? 0);
const offsetY = Number(inputs['Offset Y'] ?? inputs['offset_y'] ?? 0);

const targetEntity = context.entity.get(target);

if (targetEntity && context.camera && typeof context.camera.setTarget === 'function') {
  context.camera.setTarget(targetEntity, smoothness, {
    x: offsetX,
    y: offsetY
  });
}

outputs['Out'] = true;
outputs['out'] = true;
return;`
        }
      }
    },
    {
      type: 'action_camera_stop_follow',
      label: 'Stop Camera Follow',
      description: 'Menghentikan kamera dari mengikuti entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Stop Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`if (context.camera && typeof context.camera.clearTarget === 'function') {
  context.camera.clearTarget();
}

outputs['Out'] = true;
outputs['out'] = true;
return;`
        }
      }
    }
  ]
};
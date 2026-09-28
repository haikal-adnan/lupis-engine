import { Video, VideoOff, Camera } from 'lucide-vue-next';

export const BlueprintCamera = {
  id: 'category_camera',
  label: 'Camera',
  color: '#F59E0B', 
  icon: Camera,
  items: [
    {
      type: 'action_camera_follow',
      label: 'Camera Follow',
      description: 'Membuat kamera mengikuti entity target dengan smooth.',
      icon: Video,
      
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      
      defaultData: {
        settings: {
          headerTitle: 'Camera Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },

        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_entity', label: 'Target Entity', dataType: 'string', color: '#34d399', defaultValue: 'self' },
          { id: 'smooth_speed', label: 'Smoothness', dataType: 'number', color: '#60a5fa', defaultValue: 0.1 },
          { id: 'offset_x', label: 'Offset X', dataType: 'number', color: '#60a5fa', defaultValue: 0 },
          { id: 'offset_y', label: 'Offset Y', dataType: 'number', color: '#60a5fa', defaultValue: 0 }
        ],

        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],

        data: {
          code: `const target = inputs['Target Entity'];
const smoothness = inputs['Smoothness'];
const offsetX = inputs['Offset X'];
const offsetY = inputs['Offset Y'];

// Menggunakan context.entity.get() sesuai ContextSystem baru
const targetEntity = context.entity.get(target);

if (targetEntity) {
  context.camera.setTarget(targetEntity, smoothness, {
    x: offsetX,
    y: offsetY
  });
}

outputs['Out'] = true;
return;`
        }
      }
    },

    {
      type: 'action_camera_stop_follow',
      label: 'Stop Camera Follow',
      description: 'Menghentikan kamera dari mengikuti entity.',
      icon: VideoOff,
      
      defaultData: {
        settings: {
          headerTitle: 'Stop Follow',
          headerColor: '#78350f', 
          category: 'Camera'
        },

        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],

        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],

        data: {
          code: `context.camera.clearTarget();

outputs['Out'] = true;
return;`
        }
      }
    }
  ]
};
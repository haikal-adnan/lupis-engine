import { Video, VideoOff, Camera } from 'lucide-vue-next';

export const basicCamera = {
  _id: 'category_camera',
  label: 'Camera',
  color: '#F59E0B', 
  icon: Camera,
  items: [
    {
      type: 'action_camera_follow',
      label: 'Camera Follow',
      description: 'Make the camera follow a specific entity smoothly.',
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
          { 
            _id: 'exec_in',
            label: 'Start',
            dataType: 'execution',
            color: '#ffffff'
          },
          { 
            _id: 'target_entity',
            label: 'Target (Entity ID)',
            dataType: 'string',
            color: '#34d399',
            defaultValue: '' 
          },
          { 
            _id: 'smooth_speed',
            label: 'Smoothness (0-1)',
            dataType: 'number',
            color: '#60a5fa',
            defaultValue: 0.1
          },
          { 
            _id: 'offset_x',
            label: 'Offset X',
            dataType: 'number',
            color: '#60a5fa',
            defaultValue: 0
          },
          { 
            _id: 'offset_y',
            label: 'Offset Y',
            dataType: 'number',
            color: '#60a5fa',
            defaultValue: 0
          }
        ],

        outputs: [
          { 
            _id: 'out',
            label: 'Next',
            dataType: 'execution',
            color: '#ffffff'
          }
        ]
      }
    },

    {
      type: 'action_camera_stop_follow',
      label: 'Stop Camera Follow',
      description: 'Stop the camera from following any entity.',
      icon: VideoOff,
      
      defaultData: {
        settings: {
          headerTitle: 'Stop Follow',
          headerColor: '#78350f', 
          category: 'Camera'
        },

        inputs: [
          { 
            _id: 'exec_in',
            label: 'In',
            dataType: 'execution',
            color: '#ffffff'
          }
        ],

        outputs: [
          { 
            _id: 'out',
            label: 'Out',
            dataType: 'execution',
            color: '#ffffff'
          }
        ]
      }
    }
  ]
};
import { 
  Film, 
  PlayCircle, 
  PauseCircle, 
  Activity, 
  Settings2, 
  Layers,
  FileEdit
} from 'lucide-vue-next';

export const BlueprintAnimator = {
  _id: 'game_animator',
  label: 'Animator',
  color: '#8E24AA', 
  icon: Film,
  items: [
    { 
      type: 'play_animation', 
      label: 'Play Animation', 
      description: 'Memutar animasi. Gunakan On Complete untuk logika setelah animasi selesai.',
      icon: PlayCircle,
      defaultData: { 
        settings: { headerTitle: 'Play Animation', headerColor: '#9C27B0', category: 'Animation' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          { _id: 'clip_id', label: 'Clip Name/ID', dataType: 'string' },
          { _id: 'reset', label: 'Reset Frame?', dataType: 'boolean', defaultValue: true }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution' },
          { _id: 'on_start', label: 'On Start', dataType: 'execution', color: '#69F0AE' },
          { _id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#FF5252' }
        ]
      } 
    },
    { 
      type: 'pause_animation', 
      label: 'Pause Animation', 
      description: 'Berhenti sementara di frame saat ini.',
      icon: PauseCircle,
      defaultData: { 
        settings: { headerTitle: 'Pause Animation', headerColor: '#9C27B0', category: 'Animation' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ],
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution' }]
      } 
    },

    { 
      type: 'get_animator', 
      label: 'Get Animator', 
      icon: Activity, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Animator', headerColor: '#AB47BC', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'currentClip', label: 'Current Clip ID', type: 'string' },
            { value: 'isPlaying', label: 'Is Playing?', type: 'boolean' },
            { value: 'active', label: 'Is Enabled?', type: 'boolean' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean' }
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_animator', 
      label: 'Set Animator', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Animator', headerColor: '#AB47BC', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'currentClip', label: 'Set Current Clip', type: 'string' },
            { value: 'active', label: 'Is Enabled', type: 'boolean' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution' }]
      } 
    },

    { 
      type: 'get_clip_prop', 
      label: 'Get Clip Prop', 
      icon: Layers,
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Clip Property', headerColor: '#00897B', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'fps', label: 'Frame Rate', type: 'number' },
            { value: 'isLooping', label: 'Is Looping?', type: 'boolean' },
            { value: 'frameCount', label: 'Total Frames', type: 'number' }
          ]
        },
        inputs: [{ _id: 'clip_id', label: 'Clip ID', dataType: 'string' }],
        outputs: [] 
      } 
    },
    { 
      type: 'set_clip_prop', 
      label: 'Set Clip Prop', 
      icon: FileEdit,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Clip Property', headerColor: '#00897B', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'fps', label: 'Set FPS', type: 'number' },
            { value: 'isLooping', label: 'Set Looping', type: 'boolean' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'clip_id', label: 'Clip ID', dataType: 'string' }
        ],
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution' }]
      } 
    }
  ]
};
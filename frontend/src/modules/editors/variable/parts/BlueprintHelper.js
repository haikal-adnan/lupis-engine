import { 
  GitMerge, 
  Timer,
  Hourglass,
  Activity,
  TypeIcon,
  MousePointerClick
} from 'lucide-vue-next';



export const BlueprintHelper = {
  _id: 'flow_helper',
  label: 'Flow Helpers',
  color: '#607D8B',
  icon: GitMerge,
  items: [
    { 
      type: 'logic_flow_merge', 
      label: 'Merge Flow', 
      description: 'Menggabungkan banyak jalur eksekusi ke dalam satu output.',
      icon: GitMerge, 
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Merge', headerColor: '#607D8B', category: 'Helper' },
        inputs: [
          { _id: 'in_0', label: 'In 1', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_1', label: 'In 2', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'logic_delay', 
      label: 'Delay', 
      description: 'Menunda eksekusi selama beberapa milidetik.',
      icon: Timer,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Delay', headerColor: '#607D8B', category: 'Helper' },
        data: { values: { duration: 500 } }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'out', label: 'Completed', dataType: 'execution', color: '#ffffff' }
        ]
      },
    },
    { 
      type: 'logic_cooldown', 
      label: 'Cooldown / Interval', 
      description: 'Meneruskan eksekusi hanya jika waktu cooldown telah tercapai (ms).',
      icon: Hourglass,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Cooldown', headerColor: '#607D8B', category: 'Helper' },
        data: { values: { duration: 500 } }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'ready', label: 'Ready (Fire)', dataType: 'execution', color: '#ffffff' },
          { _id: 'cooling', label: 'Cooling Down', dataType: 'execution', color: '#B0BEC5' }
        ]
      } 
    },
    {
      type: 'logic_tween_value',
      label: 'Tween Value',
      description: 'Menghasilkan nilai interpolasi dari Start ke End selama durasi tertentu.',
      icon: Activity,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { 
          headerTitle: 'Tween Value', 
          headerColor: '#EC4899', 
          category: 'Helper' 
        },
        data: {
          values: {
            startValue: 0,
            endValue: 100,
            duration: 1000,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Accelerate (Ease In)', value: 'ease_in' }
            ]
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'startValue', label: 'Start Value', dataType: 'number', color: '#B2FF59' },
          { _id: 'endValue', label: 'End Value', dataType: 'number', color: '#FF4081' },
          { _id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'on_update', label: 'On Update', dataType: 'execution', color: '#29B6F6' },
          { _id: 'value', label: 'Value', dataType: 'number', color: '#00E676' }, 
          { _id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#69F0AE' }
        ]
      }
    },
    { 
      type: 'logic_typewriter', 
      label: 'Typewriter Effect', 
      description: 'Mengganti teks dan menganimasikannya satu per satu.',
      icon: TypeIcon, 
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Typewriter', 
          headerColor: '#FFB300', 
          category: 'UI / Text' 
        },
        data: { 
          values: { 
            speed: 50,
            target_in: '',
            text_in: '' // Tambahkan penampung nilai statis teks
           } ,
          
        }, 
        inputs: [
          { _id: 'exec_in', label: 'Start', dataType: 'execution', color: '#ffffff' },
          { _id: 'skip_in', label: 'Skip (Instant)', dataType: 'execution', color: '#FF5252' },
          { _id: 'target_in', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          { _id: 'text_in', label: 'New Text', dataType: 'string', color: '#FFF' }, // Port input teks baru
          { _id: 'speed', label: 'Speed (ms)', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { _id: 'on_complete', label: 'Completed', dataType: 'execution', color: '#69F0AE' }
        ]
      } 
    },
    { 
      type: 'ui_button_scale_effect', 
      label: 'Button Scale Effect', 
      description: 'Menangani efek hover, click, dan interpolasi (Lerp) scale secara otomatis dalam satu node.',
      icon: MousePointerClick,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Button Scale', 
          headerColor: '#E91E63', 
          category: 'UI Effects' 
        },
        data: { 
          values: { 
            target_in: '',
            scaleNormal: 1.0,
            scaleHover: 1.1,
            scalePressed: 0.9,
            lerpSpeed: 0.2,
            use_raycast: true // <--- Tambahan: Default value untuk raycast
          } 
        }, 
        inputs: [
          { _id: 'exec_in', label: 'Update (Tick)', dataType: 'execution' },
          { _id: 'target_in', label: 'Target ID (Self)', dataType: 'string' },
          { _id: 'use_raycast', label: 'Use Raycast?', dataType: 'boolean', value: true }, // <--- Tambahan: Port input baru
          { _id: 'scaleNormal', label: 'Normal Scale', dataType: 'number', color: '#B2FF59' },
          { _id: 'scaleHover', label: 'Hover Scale', dataType: 'number', color: '#B2FF59' },
          { _id: 'scalePressed', label: 'Pressed Scale', dataType: 'number', color: '#B2FF59' },
          { _id: 'lerpSpeed', label: 'Lerp Speed', dataType: 'number', color: '#40C4FF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { _id: 'on_click', label: 'On Click (Released)', dataType: 'execution', color: '#69F0AE' },
          { _id: 'script_id_out', label: 'Clicked ID', dataType: 'string', color: '#E040FB' } 
        ]
      } 
    }
  ]
};
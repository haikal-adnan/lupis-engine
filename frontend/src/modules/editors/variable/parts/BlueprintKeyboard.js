import { Zap, Keyboard, Move, HelpCircle } from 'lucide-vue-next';

export const BlueprintKeyboard = {
  _id: 'keyboard_events',
  label: 'Keyboard Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    { 
      type: 'event_simple_key', 
      label: 'Simple Key', 
      description: 'Single key trigger for simple actions like Jump or Interact',
      icon: Keyboard,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Simple Key', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        data: { 
           key: 'E', 
           trigger: 'press' 
        }, 
        inputs: [],
        outputs: [
          { 
            _id: 'sk_main', 
            label: 'E Pressed', 
            dataType: 'execution', 
            color: '#ffffff' 
          }
        ]
      } 
    },
    { 
      type: 'event_simple_key_up', 
      label: 'Simple Key Up', 
      description: 'Single key trigger saat tombol dilepas (Release). Cocok untuk set Idle.',
      icon: Keyboard,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Key Up', headerColor: '#C2185B', category: 'Keyboard Events' },
        data: { key: 'E', trigger: 'release' }, 
        inputs: [],
        outputs: [
          { _id: 'sk_up_main', label: 'Released', dataType: 'execution', color: '#69F0AE' }
        ]
      } 
    },
    { 
      type: 'is_key_down', 
      label: 'Is Key Down', 
      description: 'Meneruskan alur eksekusi ke True jika tombol ditahan, atau False jika dilepas.',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Is Key Down', headerColor: '#C2185B', category: 'Keyboard Events' },
        data: { key: 'W' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' }
        ],
        outputs: [
          { _id: 'true', label: 'True (Down)', dataType: 'execution', color: '#69F0AE' },
          { _id: 'false', label: 'False (Up)', dataType: 'execution', color: '#FF5252' }
        ]
      } 
    },
    { 
      type: 'event_advanced_key', 
      label: 'Advanced Keyboard', 
      description: 'Multi-key mapper with hold, threshold, and repeat support',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
          headerTitle: 'Input Mapper', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        
        data: {
            mappings: [
                { _id: 'def_w', key: 'W', trigger: 'hold', threshold: 0, repeat: true },
                { _id: 'def_s', key: 'S', trigger: 'hold', threshold: 0, repeat: true }
            ]
        }, 
        
        inputs: [],
        
        outputs: [
          { _id: 'out_def_w', label: 'W (hold)', dataType: 'execution', color: '#FFEB3B' },
          { _id: 'out_def_s', label: 'S (hold)', dataType: 'execution', color: '#FFEB3B' }
        ]
      } 
    },
    { 
      type: 'event_any_key', 
      label: 'Any Key Pressed', 
      description: 'Mendeteksi tombol apapun yang ditekan dan menghasilkan output string lowercase.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Any Key Down', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        data: {}, 
        inputs: [],
        outputs: [
          { 
            _id: 'out_exec', 
            label: 'Pressed', 
            dataType: 'execution', 
            color: '#ffffff' 
          },
          { 
            _id: 'key_string', 
            label: 'Key (string)', 
            dataType: 'string', 
            color: '#FFEB3B' 
          }
        ]
      } 
    },
  ]
};
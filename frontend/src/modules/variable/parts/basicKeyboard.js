import { Zap, Keyboard, Move } from 'lucide-vue-next';

export const basicKeyboard = {
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
    }
  ]
};
import { Zap, Move, HelpCircle } from 'lucide-vue-next';

export const BlueprintKeyboard = {
  _id: 'keyboard_events',
  label: 'Keyboard Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    { 
      type: 'event_advanced_key', 
      label: 'Input Mapper', 
      description: 'The primary trigger for keyboard inputs (Supports Press, Release, and Hold states).',
      icon: Zap,
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
      type: 'calculate_axis_2d', 
      label: 'Calculate Axis 2D', 
      description: 'Receives Tick execution. Automatically calculates directional axes (Horz/Vert) based on the assigned key strings.',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Calc Axis 2D', headerColor: '#C2185B', category: 'Keyboard Events' },
        data: {
          upKey: 'W', downKey: 'S', rightKey: 'D', leftKey: 'A'
        },
        inputs: [
          { _id: 'exec_tick', label: 'In (Tick)', dataType: 'execution', color: '#ffffff' },
          { _id: 'upKey', label: 'Up Key', dataType: 'string', color: '#FFEB3B' },
          { _id: 'downKey', label: 'Down Key', dataType: 'string', color: '#FFEB3B' },
          { _id: 'rightKey', label: 'Right Key', dataType: 'string', color: '#FFEB3B' },
          { _id: 'leftKey', label: 'Left Key', dataType: 'string', color: '#FFEB3B' },
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { _id: 'axis_x', label: 'Axis X', dataType: 'number', color: '#69F0AE' },
          { _id: 'axis_y', label: 'Axis Y', dataType: 'number', color: '#69F0AE' }
        ]
      } 
    },
    { 
      type: 'is_key_down', 
      label: 'Branch: Key Down', 
      description: 'A logic gate (If). Routes execution to True if the key is pressed, and False if it is released.',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'If Key Down', headerColor: '#C2185B', category: 'Keyboard Events' },
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
      type: 'get_key_state', 
      label: 'Get Key State', 
      description: 'Reads the Boolean value (True/False) of a key without blocking the execution flow.',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Key State', headerColor: '#C2185B', category: 'Keyboard Events' },
        data: { key: 'W' },
        inputs: [], 
        outputs: [
          { _id: 'isDown', label: 'Is Down?', dataType: 'boolean', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'event_any_key', 
      label: 'Any Key Pressed', 
      description: 'Detects when any key is pressed and outputs its corresponding name as a string.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Any Key Down', headerColor: '#C2185B', category: 'Keyboard Events' },
        data: {}, 
        inputs: [],
        outputs: [
          { _id: 'out_exec', label: 'Pressed', dataType: 'execution', color: '#ffffff' },
          { _id: 'key_string', label: 'Key (string)', dataType: 'string', color: '#FFEB3B' }
        ]
      } 
    },
    { 
      type: 'simulate_key', 
      label: 'Simulate Key', 
      description: 'Simulates a keyboard input event. Ideal for triggering movement behaviors using UI buttons.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Simulate Key', headerColor: '#C2185B', category: 'Keyboard Events' },
        data: { key: 'D', isDown: true },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFEB3B' },
          { _id: 'isDown', label: 'Is Down', dataType: 'boolean', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};
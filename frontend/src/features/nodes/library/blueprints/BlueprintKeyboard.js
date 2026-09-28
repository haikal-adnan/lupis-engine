import { Zap, Move, HelpCircle } from 'lucide-vue-next';

export const BlueprintKeyboard = {
  id: 'keyboard_events',
  label: 'Keyboard Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    // 1. INPUT MAPPER (Event Node - Output Dynamic & Hold Focus)
    { 
      type: 'event_advanced_key', 
      label: 'Input Mapper', 
      description: 'Dynamic output generator for mapped keys, executing continuously on Hold state.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: true, 
      defaultData: { 
        settings: { 
          headerTitle: 'Input Mapper', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        data: {
          mappings: [
            { id: 'def_w', key: 'W', trigger: 'hold', threshold: 0, repeat: true },
            { id: 'def_s', key: 'S', trigger: 'hold', threshold: 0, repeat: true }
          ],
          code: `context.onTick((dt) => {
  if (node.outputs && Array.isArray(node.outputs)) {
    node.outputs.forEach(output => {
      const keyName = output.label ? output.label.trim() : '';

      if (keyName && context.game.input.keyboard.isDown(keyName.toLowerCase())) {
        context.triggerFlow(output.id || output.label);
      }
    });
  }
});
return;`
        }, 
        inputs: [],
        outputs: [
          { id: 'out_def_w', label: 'W', dataType: 'execution', color: '#FFEB3B' },
          { id: 'out_def_s', label: 'S', dataType: 'execution', color: '#FFEB3B' }
        ]
      } 
    },

    // 2. CALCULATE AXIS 2D (Action Node)
    { 
      type: 'calculate_axis_2d', 
      label: 'Calculate Axis 2D', 
      description: 'Receives Tick execution. Automatically calculates directional axes (Horz/Vert) based on the assigned key strings.',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Calc Axis 2D', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'exec_tick', label: 'In (Tick)', dataType: 'execution', color: '#ffffff' },
          { id: 'upKey', label: 'Up Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'W' },
          { id: 'downKey', label: 'Down Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'S' },
          { id: 'rightKey', label: 'Right Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'D' },
          { id: 'leftKey', label: 'Left Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'A' },
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'axis_x', label: 'Axis X', dataType: 'number', color: '#B2FF59' },
          { id: 'axis_y', label: 'Axis Y', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          code: `const upKey = inputs['Up Key'];
const downKey = inputs['Down Key'];
const rightKey = inputs['Right Key'];
const leftKey = inputs['Left Key'];

let x = 0;
let y = 0;

if (rightKey && context.game.input.keyboard.isDown(rightKey.toLowerCase())) {
    x += 1;
}
if (leftKey && context.game.input.keyboard.isDown(leftKey.toLowerCase())) {
    x -= 1;
}
if (upKey && context.game.input.keyboard.isDown(upKey.toLowerCase())) {
    y += 1;
}
if (downKey && context.game.input.keyboard.isDown(downKey.toLowerCase())) {
    y -= 1;
}

outputs['Axis X'] = x;
outputs['Axis Y'] = y;
outputs['Out'] = true;
return;`
        }
      } 
    },

    // 3. BRANCH: KEY DOWN (Logic / Action Node)
    { 
      type: 'is_key_down', 
      label: 'Branch: Key Down', 
      description: 'A logic gate (If). Routes execution to True if the key is pressed, and False if it is released.',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'If Key Down', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'W' }
        ],
        outputs: [
          { id: 'true', label: 'True (Down)', dataType: 'execution', color: '#B2FF59' },
          { id: 'false', label: 'False (Up)', dataType: 'execution', color: '#f472b6' }
        ],
        data: {
          code: `const key = inputs['Key'];
const isDown = key ? context.game.input.keyboard.isDown(key.toLowerCase()) : false;

if (isDown) {
    outputs['True (Down)'] = true;
} else {
    outputs['False (Up)'] = true;
}
return;`
        }
      } 
    },

    // 4. GET KEY STATE (Pure Node)
    { 
      type: 'get_key_state', 
      label: 'Get Key State', 
      description: 'Reads the Boolean value (True/False) of a key without blocking the execution flow.',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Key State', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'key', label: 'Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'W' }
        ], 
        outputs: [
          { id: 'isDown', label: 'Is Down?', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          code: `const key = inputs['Key'];
outputs['Is Down?'] = key ? context.game.input.keyboard.isDown(key.toLowerCase()) : false;
return;`
        }
      } 
    },

    // 5. ANY KEY PRESSED (Event Node - Menggunakan Keyboard Class Method)
    { 
      type: 'event_any_key', 
      label: 'Any Key Pressed', 
      description: 'Detects when any key is pressed and outputs its corresponding name as a string.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Any Key Down', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [],
        outputs: [
          { id: 'out_exec', label: 'Pressed', dataType: 'execution', color: '#ffffff' },
          { id: 'key_string', label: 'Key (string)', dataType: 'string', color: '#FFEB3B' }
        ],
        data: {
          code: `context.onTick(() => {
  const keyboard = context.game?.input?.keyboard;
  if (keyboard) {
    const pressedKeys = keyboard.getPressedKeys ? keyboard.getPressedKeys() : [];
    if (pressedKeys.length > 0) {
      outputs['Key (string)'] = pressedKeys[0];
      context.triggerFlow('out_exec');
    }
  }
});
return;`
        }
      } 
    },

    // 6. SIMULATE KEY (Action Node)
    { 
      type: 'simulate_key', 
      label: 'Simulate Key', 
      description: 'Simulates a keyboard input event. Ideal for triggering movement behaviors using UI buttons.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Simulate Key', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'D' },
          { id: 'isDown', label: 'Is Down', dataType: 'boolean', color: '#f472b6', defaultValue: true }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `const key = inputs['Key'];
const isDown = inputs['Is Down'];

if (key) {
    const eventType = isDown ? 'keydown' : 'keyup';
    const keyCode = key.toUpperCase().charCodeAt(0);
    
    const event = new KeyboardEvent(eventType, {
        key: key,
        code: \`Key\${key.toUpperCase()}\`,
        keyCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true
    });
    
    window.dispatchEvent(event);
    if (context.game && context.game.canvas) {
        context.game.canvas.dispatchEvent(event);
    }
}

outputs['Out'] = true;
return;`
        }
      } 
    }
  ]
};
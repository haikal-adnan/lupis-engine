import { Zap } from 'lucide-vue-next';

/**
 * ============================================================================
 * BLUEPRINT: KEYBOARD EVENTS
 * ============================================================================
 */
export const BlueprintKeyboard = {
  id: 'keyboard_events',
  label: 'Keyboard Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    { 
      type: 'event_on_key', 
      label: 'On Key Event', 
      description: 'Triggers individual execution outputs automatically synced with configured key strings.',
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'On Key Event', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        inputs: [
          { id: 'keys', label: 'Keys', dataType: 'string', color: '#F48FB1', defaultValue: 'a, space' },
          { id: 'action', label: 'Action', dataType: 'string', color: '#F48FB1', defaultValue: 'pressed' }
        ],
        outputs: [
          { id: 'out_a', label: 'a', dataType: 'execution', color: '#FFFFFF' },
          { id: 'out_space', label: 'space', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            action: 'pressed'
          },
          options: {
            action: [
              { label: 'Pressed (Just Down)', value: 'pressed' },
              { label: 'Released (Just Up)', value: 'released' },
              { label: 'Hold (Is Down)', value: 'hold' }
            ]
          },
          code: 
`context.onTick(() => {
  const keyboard = context.game?.input?.keyboard;
  if (!keyboard) return;

  const rawKeys = inputs['Keys'] ?? inputs['keys'] ?? '';
  const action = String(inputs['Action'] ?? inputs['action'] ?? 'pressed').toLowerCase();

  const rawTokens = rawKeys.split(',').map(t => t.trim().toLowerCase());
  const parsedKeys = [];

  let i = 0;
  while (i < rawTokens.length) {
    const token = rawTokens[i];
    if (token.length > 0) {
      parsedKeys.push(token);
      i++;
    } else {
      if (i + 1 < rawTokens.length && rawTokens[i + 1] === '') {
        parsedKeys.push(',');
        i += 2;
      } else {
        i++;
      }
    }
  }

  const activeOutputs = node.outputs || [];

  activeOutputs.forEach((output, index) => {
    let keyName = parsedKeys[index] || output.label || output.id.replace(/^out_/, '');
    keyName = keyName.trim().toLowerCase();

    if (!keyName) return;

    let triggered = false;

    if (action === 'pressed' && keyboard.isPressed(keyName)) {
      triggered = true;
    } else if (action === 'released' && keyboard.isReleased(keyName)) {
      triggered = true;
    } else if (action === 'hold' && keyboard.isDown(keyName)) {
      triggered = true;
    }

    if (triggered) {
      context.triggerFlow(output.id);
    }
  });
});
return;`
        }
      } 
    },
    { 
      type: 'get_key_state', 
      label: 'Get Key State', 
      description: 'Returns true if the specified key is currently held down.',
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Get Key State', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        inputs: [
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1', defaultValue: 'space' }
        ], 
        outputs: [
          { id: 'isDown', label: 'Is Down', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            key: 'space'
          },
          code: 
`const rawKey = inputs['Key'] ?? inputs['key'] ?? '';
const keyboard = context.game?.input?.keyboard;
const formattedKey = rawKey === ' ' ? 'space' : String(rawKey).toLowerCase();

const result = Boolean(formattedKey && keyboard && keyboard.isDown(formattedKey));
outputs['Is Down'] = result;
outputs['isDown'] = result;
return;`
        }
      } 
    },
    { 
      type: 'calculate_axis_2d', 
      label: 'Calculate Axis 2D', 
      description: 'Calculates directional X and Y axes based on assigned key strings.',
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Calc Axis 2D', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        inputs: [
          { id: 'exec_tick', label: 'In (Tick)', dataType: 'execution', color: '#FFFFFF' },
          { id: 'upKey', label: 'Up Key', dataType: 'string', color: '#F48FB1', defaultValue: 'w' },
          { id: 'downKey', label: 'Down Key', dataType: 'string', color: '#F48FB1', defaultValue: 's' },
          { id: 'rightKey', label: 'Right Key', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'leftKey', label: 'Left Key', dataType: 'string', color: '#F48FB1', defaultValue: 'a' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'axis_x', label: 'Axis X', dataType: 'number', color: '#64B5F6' },
          { id: 'axis_y', label: 'Axis Y', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            upKey: 'w',
            downKey: 's',
            rightKey: 'd',
            leftKey: 'a'
          },
          code: 
`const keyboard = context.game?.input?.keyboard;
const upKey = inputs['Up Key'] ?? inputs['upKey'];
const downKey = inputs['Down Key'] ?? inputs['downKey'];
const rightKey = inputs['Right Key'] ?? inputs['rightKey'];
const leftKey = inputs['Left Key'] ?? inputs['leftKey'];

let x = 0;
let y = 0;

if (keyboard) {
  if (rightKey && keyboard.isDown(String(rightKey).toLowerCase())) x += 1;
  if (leftKey && keyboard.isDown(String(leftKey).toLowerCase())) x -= 1;
  if (upKey && keyboard.isDown(String(upKey).toLowerCase())) y += 1;
  if (downKey && keyboard.isDown(String(downKey).toLowerCase())) y -= 1;
}

outputs['Axis X'] = x;
outputs['axis_x'] = x;
outputs['Axis Y'] = y;
outputs['axis_y'] = y;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'simulate_key', 
      label: 'Simulate Key', 
      description: 'Dispatches synthetic keyboard events for UI interaction or virtual pads.',
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Simulate Key', 
          headerColor: '#C2185B', 
          category: 'Keyboard Events' 
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'isDown', label: 'Is Down', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            key: 'd',
            isDown: true
          },
          code: 
`const rawKey = inputs['Key'] ?? inputs['key'];
const isDownVal = inputs['Is Down'] ?? inputs['isDown'] ?? true;

if (rawKey) {
  const eventType = Boolean(isDownVal) ? 'keydown' : 'keyup';
  const formattedKey = rawKey === ' ' ? 'space' : String(rawKey);
  const keyCode = formattedKey.toUpperCase().charCodeAt(0);
  
  const event = new KeyboardEvent(eventType, {
    key: formattedKey,
    code: \`Key\${formattedKey.toUpperCase()}\`,
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
outputs['exec_out'] = true;
return;`
        }
      } 
    }
  ]
};

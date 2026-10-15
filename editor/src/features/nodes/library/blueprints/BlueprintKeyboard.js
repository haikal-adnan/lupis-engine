import { Zap } from 'lucide-vue-next';

export const BlueprintKeyboard = {
  id: 'keyboard_events',
  label: 'Keyboard Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    { 
      type: 'eventOnKey', 
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
          { id: 'keys', dataType: 'string', color: '#F48FB1', defaultValue: 'a, space' },
          { id: 'action', dataType: 'string', color: '#F48FB1', defaultValue: 'pressed' }
        ],
        outputs: [
          { id: 'onA', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onSpace', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            keys: 'a, space',
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
  const keyboard = context.input.keyboard;

  const rawKeys = inputs.keys;
  const action = inputs.action.toLowerCase();

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
    let keyName = parsedKeys[index] || output.id.replace(/^on/, '');
    keyName = keyName.trim().toLowerCase();

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
      type: 'getKeyState', 
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
          { id: 'key', dataType: 'string', color: '#F48FB1', defaultValue: 'space' }
        ], 
        outputs: [
          { id: 'isDown', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            key: 'space'
          },
          code: 
`const rawKey = inputs.key;
const keyboard = context.input.keyboard;
const formattedKey = rawKey === ' ' ? 'space' : rawKey.toLowerCase();

outputs.isDown = keyboard.isDown(formattedKey);
return;`
        }
      } 
    },
    { 
      type: 'calculateAxis2d', 
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'upKey', dataType: 'string', color: '#F48FB1', defaultValue: 'w' },
          { id: 'downKey', dataType: 'string', color: '#F48FB1', defaultValue: 's' },
          { id: 'rightKey', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'leftKey', dataType: 'string', color: '#F48FB1', defaultValue: 'a' }
        ], 
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'axisX', dataType: 'number', color: '#64B5F6' },
          { id: 'axisY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            upKey: 'w',
            downKey: 's',
            rightKey: 'd',
            leftKey: 'a'
          },
          code: 
`const keyboard = context.input.keyboard;
const upKey = inputs.upKey;
const downKey = inputs.downKey;
const rightKey = inputs.rightKey;
const leftKey = inputs.leftKey;

let x = 0;
let y = 0;

if (keyboard.isDown(rightKey.toLowerCase())) x += 1;
if (keyboard.isDown(leftKey.toLowerCase())) x -= 1;
if (keyboard.isDown(upKey.toLowerCase())) y += 1;
if (keyboard.isDown(downKey.toLowerCase())) y -= 1;

outputs.axisX = x;
outputs.axisY = y;
outputs.execOut = true;
return;`
        }
      } 
    },
    { 
      type: 'simulateKey', 
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'key', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'isDown', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            key: 'd',
            isDown: true
          },
          code: 
`const rawKey = inputs.key;
const isDownVal = inputs.isDown;

const eventType = isDownVal ? 'keydown' : 'keyup';
const formattedKey = rawKey === ' ' ? 'space' : rawKey;
const keyCode = formattedKey.toUpperCase().charCodeAt(0);

const event = new KeyboardEvent(eventType, {
  key: formattedKey,
  code: \`Key\${formattedKey.toUpperCase()}\`,
  keyCode: keyCode,
  which: keyCode,
  bubbles: true,
  cancelable: true
});

context.ui.dispatchEvent(event);

outputs.execOut = true;
return;`
        }
      } 
    }
  ]
};

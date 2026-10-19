import { Gamepad2 } from 'lucide-vue-next';

export const BlueprintInput = {
  id: 'input_controls',
  label: 'Input & Controls',
  color: '#4CAF50',
  icon: Gamepad2,
  items: [
{ 
      type: 'eventOnKey', 
      label: 'On Key Event', 
      description: 'Triggers individual execution outputs automatically synced with configured key strings.',
      dynamicMode: 'keyboard',
      defaultData: { 
        settings: { 
          headerTitle: 'On Key Event', 
          headerColor: '#C2185B', 
          category: 'Input & Controls' 
        },
        inputs: [
          { id: 'action', dataType: 'string', color: '#F48FB1', defaultValue: 'pressed' },
          { id: 'key0', dataType: 'string', color: '#F48FB1', defaultValue: 'a' },
          { id: 'key1', dataType: 'string', color: '#F48FB1', defaultValue: 'space' }
        ],
        outputs: [
          { id: 'onKey0', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onKey1', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            action: 'pressed',
            key0: 'a',
            key1: 'space'
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
  const action = inputs.action.toLowerCase();

  const keyKeys = Object.keys(inputs)
    .filter(k => k.startsWith('key'))
    .sort((a, b) => {
      const idxA = parseInt(a.replace('key', ''), 10) || 0;
      const idxB = parseInt(b.replace('key', ''), 10) || 0;
      return idxA - idxB;
    });

  for (let i = 0; i < keyKeys.length; i++) {
    const k = keyKeys[i];
    const rawVal = inputs[k];
    if (typeof rawVal !== 'string') continue;
    const keyName = rawVal.trim().toLowerCase();
    if (!keyName) continue;
    const keyIdx = k.replace('key', '');
    const outId = \`onKey\${keyIdx}\`;

    let triggered = false;
    if (action === 'pressed' && keyboard.isPressed(keyName)) {
      triggered = true;
    } else if (action === 'released' && keyboard.isReleased(keyName)) {
      triggered = true;
    } else if (action === 'hold' && keyboard.isDown(keyName)) {
      triggered = true;
    }

    if (triggered) {
      context.triggerFlow(outId);
    }
  }

  const legacyRaw = inputs.keys;
  if (typeof legacyRaw === 'string' && legacyRaw.length > 0) {
    const legacyTokens = legacyRaw.split(',').map(t => t.trim().toLowerCase());
    const activeOutputs = node.outputs || [];
    activeOutputs.forEach((output, index) => {
      const keyName = legacyTokens[index] || output.id.replace(/^on/, '').toLowerCase();
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
  }
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
          category: 'Input & Controls' 
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
          category: 'Input & Controls' 
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
          category: 'Input & Controls' 
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
    },
{
      type: 'eventPointerTap',
      label: 'On Click / Tap',
      description: 'Triggered when screen is clicked (PC) or tapped (Mobile)',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Click/Tap',
          headerColor: '#0097A7',
          category: 'Input & Controls'
        },
        inputs: [],
        outputs: [
          { id: 'onClick', dataType: 'execution', color: '#FFFFFF' },
          { id: 'x', dataType: 'number', color: '#64B5F6' },
          { id: 'y', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            button: 'left',
            trigger: 'press'
          },
          code: 
`context.onTick(() => {
  const pointer = context.input.getPointer();
  const mouse = context.input.mouse;
  const isTriggered = (mouse && mouse.isPressed('left')) || (pointer && pointer.down);

  if (isTriggered && pointer) {
    outputs.x = pointer.x;
    outputs.y = pointer.y;
    outputs.onClick = true;
    context.triggerFlow('onClick');
  }
});
return;`
        }
      }
    },
{
      type: 'eventPointerDrag',
      label: 'Global Mouse Drag',
      description: 'Triggered continuously while mouse is held down and moving.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Global Drag',
          headerColor: '#388E3C',
          category: 'Input & Controls'
        },
        inputs: [],
        outputs: [
          { id: 'onDrag', dataType: 'execution', color: '#FFFFFF' },
          { id: 'x', dataType: 'number', color: '#64B5F6' },
          { id: 'y', dataType: 'number', color: '#64B5F6' },
          { id: 'deltaX', dataType: 'number', color: '#64B5F6' },
          { id: 'deltaY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`context.onTick(() => {
  const pointer = context.input.getPointer();
  if (!pointer) return;
  const mouse = context.input.mouse;
  const isDown = (pointer && pointer.down) || (mouse && (mouse.isDown('left') || mouse.isPressed('left')));

  if (!context.state.dragState) {
    context.state.dragState = { lastX: pointer.x, lastY: pointer.y };
  }

  const deltaX = pointer.x - context.state.dragState.lastX;
  const deltaY = pointer.y - context.state.dragState.lastY;

  context.state.dragState.lastX = pointer.x;
  context.state.dragState.lastY = pointer.y;

  if (isDown && (deltaX !== 0 || deltaY !== 0)) {
    outputs.x = pointer.x;
    outputs.y = pointer.y;
    outputs.deltaX = deltaX;
    outputs.deltaY = deltaY;
    outputs.onDrag = true;
    context.triggerFlow('onDrag');
  }
});
return;`
        }
      }
    },
{
      type: 'mouseEntityInteract',
      label: 'Entity Mouse Event',
      description: 'Checks if the mouse is interacting with an entity. Can use Raycast (respects Z-Index/blocking) or Direct bounds check.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Entity Mouse Event',
          headerColor: '#2E7D32',
          category: 'Input & Controls'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'useRaycast', dataType: 'boolean', color: '#E57373', defaultValue: true },
          { id: 'useColliderBounds', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHover', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onDown', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHold', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onUp', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isHovering', dataType: 'boolean', color: '#E57373' },
          { id: 'isHolding', dataType: 'boolean', color: '#E57373' },
          { id: 'selfEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            useColliderBounds: false,
            useRaycast: true
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

if (!context.state.interactStates) {
  context.state.interactStates = new Map();
}

if (!context.state.interactStates.has(entity.scriptId)) {
  context.state.interactStates.set(entity.scriptId, { wasHovering: false, wasDown: false });
}
const state = context.state.interactStates.get(entity.scriptId);

outputs.selfEntity = entity.scriptId;
outputs.execOut = true;

const pointer = context.input.getPointer(entity) || context.input.getPointer();
const isLayerFrozen = Boolean(entity.layerId && context.layer && typeof context.layer.isInputFrozen === 'function' && context.layer.isInputFrozen(entity.layerId, 'pointer'));

if (!pointer || isLayerFrozen) {
  outputs.isHovering = false;
  outputs.isHolding = false;
  state.wasHovering = false;
  state.wasDown = false;
  context.state.interactStates.set(entity.scriptId, state);
  return;
}

const isPointerDown = Boolean(pointer.down);
const isHovering = Boolean(context.input.isPointerOver(entity, inputs.useRaycast));

outputs.isHovering = isHovering;
outputs.isHolding = isHovering && isPointerDown;

if (isHovering) {
  outputs.onHover = true;
}

if (isHovering && isPointerDown) {
  if (!state.wasDown) {
    outputs.onDown = true;
  } else {
    outputs.onHold = true;
  }
}

if (!isPointerDown && state.wasDown) {
  outputs.onUp = true;
}

state.wasHovering = isHovering;
state.wasDown = isPointerDown;
context.state.interactStates.set(entity.scriptId, state);

return;`
        }
      }
    },
    {
      type: 'freezeLayerInput',
      label: 'Freeze Layer Input',
      description: 'Freezes or unfreezes pointer, keyboard, or all inputs for all entities in a layer.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Freeze Layer Input',
          headerColor: '#4CAF50',
          category: 'Input & Controls'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'layer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'inputType', dataType: 'string', color: '#F48FB1', defaultValue: 'all' },
          { id: 'active', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            layer: 'self',
            inputType: 'all',
            active: true
          },
          options: {
            inputType: [
              { label: 'Pointer', value: 'pointer' },
              { label: 'Keyboard', value: 'keyboard' },
              { label: 'All', value: 'all' }
            ]
          },
          code: 
`const target = inputs.layer;
const layer = context.assert.exists(context.layer.get(target), 'Target layer must exist');
layer.freezeInput = Boolean(inputs.active);
layer.freezeInputType = inputs.inputType;
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};


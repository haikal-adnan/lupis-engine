import { MousePointer2 } from 'lucide-vue-next';

export const BlueprintMouse = {
  id: 'mouse_events',
  label: 'Mouse Events',
  color: '#4CAF50',
  icon: MousePointer2,
  items: [
    {
      type: 'eventPointerClick',
      label: 'Global Mouse Click',
      description: 'Triggered when a mouse button is clicked anywhere on the screen.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Global Click',
          headerColor: '#388E3C',
          category: 'Mouse Events'
        },
        inputs: [],
        outputs: [
          { id: 'onClick', dataType: 'execution', color: '#FFFFFF' },
          { id: 'x', dataType: 'number', color: '#64B5F6' },
          { id: 'y', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          button: 'left',
          code: 
`context.onTick(() => {
  const mouse = context.input.mouse;
  const pointer = context.input.getPointer();

  if ((mouse && (mouse.isPressed('left') || mouse.isDown('left'))) || (pointer && pointer.down)) {
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
          category: 'Mouse Events'
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
          category: 'Mouse Events'
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

const pointer = context.input.getPointer();
const isPointerDown = pointer.down;
const isHovering = context.input.isPointerOver(entity, inputs.useRaycast);

if (!context.state.interactStates) {
  context.state.interactStates = new Map();
}

if (!context.state.interactStates.has(entity.scriptId)) {
  context.state.interactStates.set(entity.scriptId, { wasHovering: false, wasDown: false });
}
const state = context.state.interactStates.get(entity.scriptId);

outputs.isHovering = isHovering;
outputs.isHolding = isHovering && isPointerDown;
outputs.selfEntity = entity.scriptId;
outputs.execOut = true;

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
    }
  ]
};
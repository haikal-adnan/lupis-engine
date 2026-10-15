import { MousePointer2 } from 'lucide-vue-next';

export const BlueprintPointer = {
  id: 'pointer_events',
  label: 'Pointer & Touch',
  color: '#00BCD4',
  icon: MousePointer2,
  items: [
    {
      type: 'eventPointerTap',
      label: 'On Click / Tap',
      description: 'Triggered when screen is clicked (PC) or tapped (Mobile)',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Click/Tap',
          headerColor: '#0097A7',
          category: 'Pointer & Touch'
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
  const isTriggered = (mouse && mouse.isPressed('left')) || pointer.down;

  if (isTriggered) {
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
      type: 'eventPointerSwipe',
      label: 'Drag / Swipe',
      description: 'Track pointer movement and delta values while held down',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Drag / Swipe',
          headerColor: '#0097A7',
          category: 'Pointer & Touch'
        },
        inputs: [],
        outputs: [
          { id: 'onDrag', dataType: 'execution', color: '#FFFFFF' },
          { id: 'deltaX', dataType: 'number', color: '#64B5F6' },
          { id: 'deltaY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            trigger: 'hold',
            threshold: 0,
            repeat: true
          },
          code: 
`context.onTick(() => {
  const pointer = context.input.getPointer();
  const mouse = context.input.mouse;
  const isDown = pointer.down || (mouse && mouse.isDown('left'));

  if (!context.state.dragState) {
    context.state.dragState = { lastX: pointer.x, lastY: pointer.y };
  }

  const deltaX = pointer.x - context.state.dragState.lastX;
  const deltaY = pointer.y - context.state.dragState.lastY;

  context.state.dragState.lastX = pointer.x;
  context.state.dragState.lastY = pointer.y;

  if (isDown && (deltaX !== 0 || deltaY !== 0)) {
    outputs.deltaX = deltaX;
    outputs.deltaY = deltaY;
    outputs.onDrag = true;
    context.triggerFlow('onDrag');
  }
});
return;`
        }
      }
    }
  ]
};
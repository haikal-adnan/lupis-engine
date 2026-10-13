import { MousePointer2 } from 'lucide-vue-next';

export const BlueprintPointer = {
  id: 'pointer_events',
  label: 'Pointer & Touch',
  color: '#00BCD4',
  icon: MousePointer2,
  items: [
    {
      type: 'event_pointer_click',
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
          { id: 'ptr_click_main', label: 'Trigger', dataType: 'execution', color: '#FFFFFF' },
          { id: 'pos_x', label: 'Screen X', dataType: 'number', color: '#64B5F6' },
          { id: 'pos_y', label: 'Screen Y', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            button: 'left',
            trigger: 'press'
          },
          code: 
`context.onTick(() => {
  const pointer = context.game?.input?.getPointer?.() || { x: 0, y: 0, down: false };
  const mouse = context.game?.input?.mouse;
  const isTriggered = (mouse && mouse.isPressed && mouse.isPressed('left')) || pointer.down;

  if (isTriggered) {
    outputs['Screen X'] = pointer.x;
    outputs['pos_x'] = pointer.x;
    outputs['Screen Y'] = pointer.y;
    outputs['pos_y'] = pointer.y;
    outputs['Trigger'] = true;
    outputs['ptr_click_main'] = true;
    context.triggerFlow('ptr_click_main');
  }
});
return;`
        }
      }
    },
    {
      type: 'event_pointer_drag',
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
          { id: 'drag_active', label: 'On Dragging', dataType: 'execution', color: '#FFFFFF' },
          { id: 'delta_x', label: 'Delta X', dataType: 'number', color: '#64B5F6' },
          { id: 'delta_y', label: 'Delta Y', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            trigger: 'hold',
            threshold: 0,
            repeat: true
          },
          code: 
`context.onTick(() => {
  const pointer = context.game?.input?.getPointer?.() || { x: 0, y: 0, down: false };
  const mouse = context.game?.input?.mouse;
  const isDown = pointer.down || (mouse && mouse.isDown && mouse.isDown('left'));

  if (!node._dragState) {
    node._dragState = { lastX: pointer.x, lastY: pointer.y };
  }

  const deltaX = pointer.x - node._dragState.lastX;
  const deltaY = pointer.y - node._dragState.lastY;

  node._dragState.lastX = pointer.x;
  node._dragState.lastY = pointer.y;

  if (isDown && (deltaX !== 0 || deltaY !== 0)) {
    outputs['Delta X'] = deltaX;
    outputs['delta_x'] = deltaX;
    outputs['Delta Y'] = deltaY;
    outputs['delta_y'] = deltaY;
    outputs['On Dragging'] = true;
    outputs['drag_active'] = true;
    context.triggerFlow('drag_active');
  }
});
return;`
        }
      }
    }
  ]
};
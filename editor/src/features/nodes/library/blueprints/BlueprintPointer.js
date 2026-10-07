import { MousePointer2, Move } from 'lucide-vue-next';

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
      icon: MousePointer2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { 
          headerTitle: 'On Click/Tap', 
          headerColor: '#0097A7', 
          category: 'Pointer' 
        },
        data: [
          { 
            id: 'ptr_click_main', 
            button: 'left', 
            trigger: 'press' 
          }
        ],
        inputs: [],
        outputs: [
          { id: 'ptr_click_main', label: 'Trigger', dataType: 'execution', color: '#ffffff' },
          { id: 'pos_x', label: 'Screen X', dataType: 'number', color: '#B2FF59' },
          { id: 'pos_y', label: 'Screen Y', dataType: 'number', color: '#B2FF59' }
        ]
      }
    },

    {
      type: 'event_pointer_drag',
      label: 'Drag / Swipe',
      description: 'Track pointer movement and delta values while held down',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: true, 
      defaultData: {
        settings: { 
          headerTitle: 'Drag / Swipe', 
          headerColor: '#0097A7', 
          category: 'Pointer' 
        },
        data: [
          { 
            id: 'drag_active', 
            trigger: 'hold', 
            threshold: 0, 
            repeat: true 
          }
        ],
        inputs: [],
        outputs: [
          { id: 'drag_active', label: 'On Dragging', dataType: 'execution', color: '#ffffff' },
          { id: 'delta_x', label: 'Delta X', dataType: 'number', color: '#B2FF59' },
          { id: 'delta_y', label: 'Delta Y', dataType: 'number', color: '#B2FF59' }
        ]
      }
    }
  ]
};
import { MousePointer2, Move, MousePointerClick, Target } from 'lucide-vue-next';

export const BlueprintMouse = {
  _id: 'mouse_events',
  label: 'Mouse Events',
  color: '#4CAF50',
  icon: MousePointer2,
  items: [
    { 
      type: 'event_pointer_click', 
      label: 'Global Mouse Click', 
      description: 'Triggered when a mouse button is clicked anywhere on the screen',
      icon: MousePointer2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Global Click', headerColor: '#388E3C', category: 'Mouse Events' },
        data: { button: 'left' }, 
        inputs: [],
        outputs: [
          { _id: 'ptr_click_main', label: 'On Click', dataType: 'execution', color: '#ffffff' },
          { _id: 'pos_x', label: 'X Position', dataType: 'number', color: '#4CAF50' },
          { _id: 'pos_y', label: 'Y Position', dataType: 'number', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'event_pointer_drag', 
      label: 'Global Mouse Drag', 
      description: 'Triggered continuously while mouse is held down and moving',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Global Drag', headerColor: '#388E3C', category: 'Mouse Events' },
        data: {}, 
        inputs: [],
        outputs: [
          { _id: 'drag_active', label: 'On Drag', dataType: 'execution', color: '#ffffff' },
          { _id: 'pos_x', label: 'X', dataType: 'number', color: '#4CAF50' },
          { _id: 'pos_y', label: 'Y', dataType: 'number', color: '#4CAF50' },
          { _id: 'delta_x', label: 'Delta X', dataType: 'number', color: '#4CAF50' },
          { _id: 'delta_y', label: 'Delta Y', dataType: 'number', color: '#4CAF50' }
        ]
      } 
    },
    {
      type: 'mouse_entity_interact',
      label: 'Entity Mouse Event',
      description: 'Checks if the mouse is hovering, clicking, or holding a specific entity.',
      icon: MousePointerClick,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Entity Interact', headerColor: '#2E7D32', category: 'Mouse Events' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', value: 'self', icon: Target },
          { _id: 'based_collider', label: 'Use Collider Bounds?', dataType: 'boolean', value: false }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution' },
          
          { _id: 'on_hover', label: 'On Hover', dataType: 'execution', color: '#FFEB3B' },
          { _id: 'on_down', label: 'On Mouse Down', dataType: 'execution', color: '#69F0AE' },
          { _id: 'on_hold', label: 'On Mouse Hold', dataType: 'execution', color: '#4FC3F7' },
          { _id: 'on_up', label: 'On Mouse Up', dataType: 'execution', color: '#FFAB91' },
          
          { _id: 'is_hovering', label: 'Is Hovering?', dataType: 'boolean', color: '#FFEB3B' },
          { _id: 'is_holding', label: 'Is Holding?', dataType: 'boolean', color: '#4FC3F7' }
        ]
      }
    }
  ]
};
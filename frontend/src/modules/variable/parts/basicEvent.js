import { Zap } from 'lucide-vue-next';

export const basicEvent = {
  id: 'events',
  label: 'Basic Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    { 
      type: 'event_on_interact', 
      label: 'On Interact', 
      description: 'Trigger when clicked',
      defaultData: { 
        settings: { headerTitle: 'On Interact', headerColor: '#C2185B', category: 'Events' },
        data: {}, 
        inputs: [],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' }
        ]
      } 
    },
    { 
      type: 'event_key_press', 
      label: 'Keyboard Input', 
      description: 'Key press trigger',
      defaultData: { 
        settings: { headerTitle: 'Keyboard Input', headerColor: '#C2185B', category: 'Events' },
        data: { key: 'Space' }, 
        inputs: [],
        outputs: [
          { _id: 'out', label: 'Pressed', dataType: 'execution', color: '#fff' }
        ]
      } 
    },
  ]
};
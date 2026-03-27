import { MonitorPlay } from 'lucide-vue-next';

export const BlueprintTransition = {
  _id: 'category_transition',
  label: 'Transition',
  color: '#8B5CF6', 
  icon: MonitorPlay,
  items: [
    {
      type: 'action_fade_screen',
      label: 'Fade Screen',
      description: 'Fades the screen to black (or any color) and vice versa.',
      icon: MonitorPlay,
      defaultData: {
        settings: { 
          headerTitle: 'Fade Screen', 
          headerColor: '#7C3AED', 
          category: 'Transition' 
        },
        data: {
          values: {
            type: 'fade_out',
            duration: 1000 
          },
          options: {
            type: [
              { label: 'Fade Out', value: 'fade_out' },
              { label: 'Fade In', value: 'fade_in' },
              { label: 'Fade In & Out', value: 'fade' }
            ]
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'type', label: 'Mode', dataType: 'string', color: '#FFEE58' },
          { _id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#69F0AE' }, 
          { _id: 'color', label: 'Color Hex', dataType: 'string', value: '#000000' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution' },
          { _id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#69F0AE' }
        ]
      }
    }
  ]
};
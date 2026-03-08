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
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          // UPDATE: Tambahkan keterangan opsi 'fade' pada label
          { _id: 'type', label: 'Mode (fade_in/fade_out/fade)', dataType: 'string', value: 'fade_out' },
          { _id: 'duration', label: 'Duration (s)', dataType: 'number', value: 1.0 },
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
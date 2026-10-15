import { MonitorPlay } from 'lucide-vue-next';

export const BlueprintTransition = {
  id: 'category_transition',
  label: 'Transition',
  color: '#8B5CF6',
  icon: MonitorPlay,
  items: [
    {
      type: 'actionFadeScreen',
      label: 'Fade Screen',
      description: 'Fades the screen to black (or any color) and vice versa.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Fade Screen',
          headerColor: '#7C3AED',
          category: 'Transition'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'mode', dataType: 'string', color: '#F48FB1', defaultValue: 'fade_out' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 1000 },
          { id: 'color', dataType: 'string', color: '#F48FB1', defaultValue: '#000000' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            mode: 'fade_out',
            duration: 1000,
            color: '#000000'
          },
          options: {
            mode: [
              { label: 'Fade Out', value: 'fade_out' },
              { label: 'Fade In', value: 'fade_in' },
              { label: 'Fade In & Out', value: 'fade' }
            ]
          },
          code: 
`outputs.execOut = true;

context.transition.fade(inputs.mode, inputs.duration, inputs.color, () => {
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
});
return;`
        }
      }
    }
  ]
};
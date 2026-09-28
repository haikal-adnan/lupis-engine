import { MonitorPlay } from 'lucide-vue-next';

export const BlueprintTransition = {
  id: 'category_transition',
  label: 'Transition',
  color: '#8B5CF6', 
  icon: MonitorPlay,
  items: [
    {
      type: 'action_fade_screen',
      label: 'Fade Screen',
      description: 'Fades the screen to black (or any color) and vice versa.',
      icon: MonitorPlay,
      allowDynamicInputs: false,
      allowDynamicOutputs: false, 
      defaultData: {
        settings: { 
          headerTitle: 'Fade Screen', 
          headerColor: '#7C3AED', 
          category: 'Transition' 
        },
        data: {
          values: {
            type: 'fade_out',
            duration: 1000,
            color: '#000000'
          },
          options: {
            type: [
              { label: 'Fade Out', value: 'fade_out' },
              { label: 'Fade In', value: 'fade_in' },
              { label: 'Fade In & Out', value: 'fade' }
            ]
          },
          code: `const type = inputs.type || 'fade_out';
const duration = Number(inputs.duration ?? 1000);
const color = inputs.color || '#000000';

outputs.exec_out = true;

const transitionSystem = context.game?.transitionSystem;
if (!transitionSystem) return;

const onCompleteCallback = () => {
  const runner = context.game?.scriptSystem?.runners?.find(r => r.nodeMap.has(context.node.id));
  if (runner) {
    runner.executeFlow(context.node.id, 'on_complete');
  }
};

if (type === 'fade_out') {
  transitionSystem.fadeOut(duration, color, onCompleteCallback);
} else if (type === 'fade_in') {
  transitionSystem.fadeIn(duration, color, onCompleteCallback);
} else if (type === 'fade') {
  const halfDuration = duration / 2;
  transitionSystem.fadeOut(halfDuration, color, () => {
    transitionSystem.fadeIn(halfDuration, color, onCompleteCallback);
  });
}
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution' },
          { id: 'type', label: 'Mode', dataType: 'string', color: '#FFEE58', defaultValue: 'fade_out' },
          { id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#69F0AE', defaultValue: 1000 }, 
          { id: 'color', label: 'Color Hex', dataType: 'string', color: '#FFFFFF', defaultValue: '#000000' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution' },
          { id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#69F0AE' }
        ]
      }
    }
  ]
};  
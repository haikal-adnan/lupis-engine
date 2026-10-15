import { Zap } from 'lucide-vue-next';

export const BlueprintEvent = {
  id: 'category_events',
  label: 'Events & Signals',
  color: '#FF9800',
  icon: Zap,
  items: [
    {
      type: 'actionEmitSignal',
      label: 'Emit Signal',
      description: 'Broadcasts a message to the entire system listening for this signal.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Emit Signal',
          headerColor: '#0288D1',
          category: 'Events & Signals'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'signalName', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { signalName: '' },
          code: 
`context.signal.emit(inputs.signalName);
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'eventOnSignal',
      label: 'On Signal Received',
      description: 'Triggers the flow when a matching global signal is received.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Signal',
          headerColor: '#0288D1',
          category: 'Events & Signals'
        },
        inputs: [
          { id: 'signalName', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { signalName: '' },
          code: 
`if (!context.state.signalRegistered) {
  context.state.signalRegistered = true;
  context.signal.on(inputs.signalName, () => {
    outputs.execOut = true;
    context.triggerFlow('execOut');
  });
}
return;`
        }
      }
    }
  ]
};
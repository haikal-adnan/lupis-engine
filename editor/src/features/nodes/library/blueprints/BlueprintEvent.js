import { Zap } from 'lucide-vue-next';

export const BlueprintEvent = {
  id: 'category_events',
  label: 'Events & Signals',
  color: '#FF9800',
  icon: Zap,
  items: [
    {
      type: 'action_emit_signal',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sig_name', label: 'Signal Name', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { sig_name: '' },
          code: 
`const sigName = inputs['Signal Name'] ?? inputs['sig_name'] ?? node.data?.values?.sig_name;

if (sigName && context.game?.signalSystem && typeof context.game.signalSystem.emit === 'function') {
  context.game.signalSystem.emit(sigName);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'event_on_signal',
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
          { id: 'sig_name', label: 'Signal Name', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { sig_name: '' },
          code: 
`outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};


import { 
  Zap, 
  Radio, 
  BellRing, 
} from 'lucide-vue-next';

export const BlueprintEvent = {
  _id: 'category_events',
  label: 'Events & Signals',
  color: '#FF9800',
  icon: Zap,
  items: [
    {
      type: 'action_emit_signal',
      label: 'Emit Signal',
      description: 'Menyiarkan pesan ke seluruh sistem yang mendengarkan sinyal ini.',
      icon: Radio,
      defaultData: {
        settings: { headerTitle: 'Emit Signal', headerColor: '#0288D1', category: 'Signals' },
        data: {
          values: {
            sig_name: "",
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'sig_name', label: 'Signal Name', dataType: 'string', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    },
    {
      type: 'event_on_signal',
      label: 'On Signal Received',
      description: 'Memicu aliran saat sinyal global yang cocok diterima.',
      icon: BellRing,
      defaultData: {
        settings: { headerTitle: 'On Signal', headerColor: '#0288D1', category: 'Signals' },
        data: {
          values: {
            sig_name: "",
          }
        },
        inputs: [
          { _id: 'sig_name', label: 'Signal Name', dataType: 'string', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    },
  ]
};
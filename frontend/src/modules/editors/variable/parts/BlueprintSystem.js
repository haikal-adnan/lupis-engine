import { MessageSquare, Bell } from 'lucide-vue-next';

export const BlueprintSystem = {
  _id: 'system_interface',
  label: 'Interface',
  color: '#607D8B',
  icon: MessageSquare,
  items: [
    { 
      type: 'ui_notification', 
      label: 'Notification', 
      description: 'Display a UI notification toast to the player and print to console',
      icon: Bell,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Notification', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        data: { 
          values: {
            in_source: 'Custom',
            in_msg: 'Hello World'
          }
        }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_source', label: 'Source', dataType: 'string', color: '#4FC3F7' },
          { _id: 'in_msg', label: 'Message', dataType: 'string', color: '#FFB74D' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};
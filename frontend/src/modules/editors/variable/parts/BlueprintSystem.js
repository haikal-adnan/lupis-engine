import { MessageSquare, Terminal, Bell } from 'lucide-vue-next';

export const BlueprintSystem = {
  _id: 'system_interface',
  label: 'Interface',
  color: '#607D8B',
  icon: MessageSquare,
  items: [
    { 
      type: 'ui_notification', 
      label: 'Notification', 
      description: 'Display a UI notification toast to the player',
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
            in_msg: 'Hello World'
          }
        }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_msg', label: 'Message', dataType: 'string', color: '#FFB74D' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },

    { 
      type: 'system_log', 
      label: 'Debug Log', 
      description: 'Print a message to the system console',
      icon: Terminal,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Debug Log', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        data: { 
          prefix: 'LOG: ',
          values: {
            in_value: '' 
          }
        }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_value', label: 'Value', dataType: 'any', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};
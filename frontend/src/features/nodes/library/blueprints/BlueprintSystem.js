import { MessageSquare, Bell } from 'lucide-vue-next';

export const BlueprintSystem = {
  id: 'system_interface',
  label: 'Interface',
  color: '#607D8B',
  icon: MessageSquare,
  items: [
    { 
      type: 'ui_notification', 
      label: 'Notification', 
      description: 'Display a UI notification toast to the player when triggered by execution flow',
      icon: Bell,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Notification', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'in_source', label: 'Source', dataType: 'string', color: '#4FC3F7', defaultValue: 'Notification' },
          { id: 'in_msg', label: 'Message', dataType: 'string', color: '#FFB74D', defaultValue: 'Hello World' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: { 
          values: {
            in_source: 'Notification',
            in_msg: 'Hello World'
          },
          code: `const source = inputs['in_source'] ?? inputs['Source'] ?? 'Notification';
const message = inputs['in_msg'] ?? inputs['Message'] ?? '';

context.game.events.emit('console:log', {
  type: 'log',
  time: Date.now(),
  message: message, 
  source: source    
});

outputs['exec_out'] = true;
return;`
        }
      } 
    },

    { 
      type: 'debug_notification', 
      label: 'Debug Notification', 
      description: 'Automatically evaluates and displays notification on tick update loop without execution pin',
      icon: Bell,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Debug Notification', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        inputs: [
          { id: 'in_source', label: 'Source', dataType: 'string', color: '#4FC3F7', defaultValue: 'Debug' },
          { id: 'in_data', label: 'Data', dataType: 'any', color: '#ffffff' }
        ],
        outputs: [
          { id: 'res_out', label: 'Result', dataType: 'string', color: '#FFB74D' }
        ],
        data: { 
          values: {
            in_source: 'Debug',
            in_data: null
          },
          code: `context.onTick(() => {
  const source = inputs['in_source'] ?? inputs['Source'] ?? 'Debug';
  const dataVal = inputs['in_data'] ?? inputs['Data'];

  let formattedMsg = '';
  if (dataVal !== undefined && dataVal !== null) {
    formattedMsg = typeof dataVal === 'object' ? JSON.stringify(dataVal, null, 2) : String(dataVal);
  } else {
    formattedMsg = String(dataVal ?? '');
  }

  context.game.events.emit('console:log', {
    type: 'log',
    time: Date.now(),
    message: formattedMsg, 
    source: source    
  });

  outputs['Result'] = formattedMsg;
  outputs['res_out'] = formattedMsg;
});
return;`
        }
      } 
    }
  ]
};
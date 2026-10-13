import { MessageSquare } from 'lucide-vue-next';

/**
 * ============================================================================
 * BLUEPRINT: SYSTEM INTERFACE
 * ============================================================================
 */
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
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Notification', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'in_source', label: 'Source', dataType: 'string', color: '#F48FB1', defaultValue: 'Notification' },
          { id: 'in_msg', label: 'Message', dataType: 'string', color: '#F48FB1', defaultValue: 'Hello World' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: { 
          values: {
            in_source: 'Notification',
            in_msg: 'Hello World'
          },
          code: 
`const source = inputs['Source'] ?? inputs['in_source'] ?? 'Notification';
const message = inputs['Message'] ?? inputs['in_msg'] ?? '';

if (context.game?.events) {
  context.game.events.emit('console:log', {
    type: 'log',
    time: Date.now(),
    message: message, 
    source: source    
  });
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      } 
    },

    { 
      type: 'debug_notification', 
      label: 'Debug Notification', 
      description: 'Automatically evaluates and displays notification on tick update loop without execution pin',
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Debug Notification', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        inputs: [
          { id: 'in_source', label: 'Source', dataType: 'string', color: '#F48FB1', defaultValue: 'Debug' },
          { id: 'in_data', label: 'Data', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'res_out', label: 'Result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            in_source: 'Debug',
            in_data: null
          },
          code: 
`context.onTick(() => {
  const source = inputs['Source'] ?? inputs['in_source'] ?? 'Debug';
  const dataVal = inputs['Data'] ?? inputs['in_data'];

  let formattedMsg = '';
  if (dataVal !== undefined && dataVal !== null) {
    formattedMsg = typeof dataVal === 'object' ? JSON.stringify(dataVal, null, 2) : String(dataVal);
  } else {
    formattedMsg = String(dataVal ?? '');
  }

  if (context.game?.events) {
    context.game.events.emit('console:log', {
      type: 'log',
      time: Date.now(),
      message: formattedMsg, 
      source: source    
    });
  }

  outputs['Result'] = formattedMsg;
  outputs['res_out'] = formattedMsg;
});
return;`
        }
      } 
    }
  ]
};
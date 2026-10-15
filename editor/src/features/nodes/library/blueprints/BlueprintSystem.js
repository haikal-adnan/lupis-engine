import { MessageSquare } from 'lucide-vue-next';

export const BlueprintSystem = {
  id: 'system_interface',
  label: 'Interface',
  color: '#607D8B',
  icon: MessageSquare,
  items: [
    { 
      type: 'uiNotification', 
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'source', dataType: 'string', color: '#F48FB1', defaultValue: 'Notification' },
          { id: 'message', dataType: 'string', color: '#F48FB1', defaultValue: 'Hello World' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: { 
          values: {
            source: 'Notification',
            message: 'Hello World'
          },
          code: 
`context.ui.notify(inputs.message, inputs.source);
outputs.execOut = true;
return;`
        }
      } 
    },

    { 
      type: 'debugNotification', 
      label: 'Debug Notification', 
      description: 'Automatically evaluates and displays notification on tick update loop without execution pin',
      dynamicMode: 'none',
      defaultData: { 
        role: 'event',
        settings: { 
          headerTitle: 'Debug Notification', 
          headerColor: '#37474F', 
          category: 'Interface' 
        },
        inputs: [
          { id: 'source', dataType: 'string', color: '#F48FB1', defaultValue: 'Debug' },
          { id: 'data', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            source: 'Debug',
            data: ''
          },
          code: 
`context.onTick(() => {
  context.ui.notify(inputs.data, inputs.source);
  outputs.result = typeof inputs.data === 'object' ? JSON.stringify(inputs.data) : ('' + inputs.data);
});
return;`
        }
      } 
    }
  ]
};
import { Sliders } from 'lucide-vue-next';

export const BlueprintSystem = {
  id: 'system_utilities',
  label: 'Audio & System',
  color: '#06B6D4',
  icon: Sliders,
  items: [
{
      type: 'playAudio',
      label: 'Play Audio',
      description: 'Plays audio on the specified entity with an Audio component.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Play Audio',
          headerColor: '#06B6D4',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Entity not found');
context.assert.hasComponent(entity, 'Audio', 'Entity does not have Audio component');
context.audio.play(entity);
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'stopAudio',
      label: 'Stop Audio',
      description: 'Stops audio playback on the specified entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Stop Audio',
          headerColor: '#06B6D4',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Entity not found');
context.audio.stop(entity);
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'setAudioVolume',
      label: 'Set Volume',
      description: 'Sets volume for an audio channel (master, background, sfx, or voice) in range 0 - 100.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Volume',
          headerColor: '#06B6D4',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'audioType', dataType: 'string', color: '#F48FB1', defaultValue: 'master' },
          { id: 'volume', dataType: 'number', color: '#64B5F6', defaultValue: 100 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            audioType: 'master',
            volume: 100
          },
          options: {
            audioType: [
              { label: 'Master', value: 'master' },
              { label: 'Background', value: 'background' },
              { label: 'SFX', value: 'sfx' },
              { label: 'Voice', value: 'voice' }
            ]
          },
          code: 
`const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setVolume(channel, vol);
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getAudioVolume',
      label: 'Get Volume',
      description: 'Retrieves current volume of an audio channel (master, background, sfx, or voice) in range 0 - 100.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Volume',
          headerColor: '#06B6D4',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'audioType', dataType: 'string', color: '#F48FB1', defaultValue: 'master' }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            audioType: 'master'
          },
          code: 
`const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
outputs.result = context.audio.getVolume(channel);
return;`
        }
      }
    },
{
      type: 'setAudioMute',
      label: 'Set Channel Mute',
      description: 'Mutes or unmutes a specific audio channel (master, background, sfx, or voice).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Channel Mute',
          headerColor: '#06B6D4',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'audioType', dataType: 'string', color: '#F48FB1', defaultValue: 'master' },
          { id: 'isMute', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            audioType: 'master',
            isMute: true
          },
          code: 
`const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
const mute = context.assert.isBoolean(inputs.isMute, 'isMute must be boolean');
context.audio.setMute(channel, mute);
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'variableGet',
      label: 'Get Variable',
      description: 'Membaca nilai dari variabel lokal atau global.',
      dynamicMode: 'none',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'Get Variable',
          headerColor: '#B0BEC5',
          category: 'Audio & System'
        },

        inputs: [],

        outputs: [
          {
            id: 'value',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        data: {
          scope: 'Local',
          variableId: null,
          items: [
            {
              variableId: null,
              value: null,
              dataType: 'any'
            }
          ],
          code: 
`outputs.value = null;
return;`
        }
      }
    },
{
      type: 'variableSet',
      label: 'Set Variable',
      description: 'Menetapkan nilai ke variabel lokal atau global.',
      dynamicMode: 'none',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'Set Variable',
          headerColor: '#B0BEC5',
          category: 'Audio & System'
        },

        inputs: [
          {
            id: 'execIn',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'value',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        outputs: [
          {
            id: 'execOut',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'valueOut',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        data: {
          scope: 'Local',
          variableId: null,
          items: [
            {
              variableId: null,
              value: null,
              dataType: 'any'
            }
          ],
          code: 
`const val = inputs.value;
outputs.valueOut = val;
outputs.execOut = true;
return;`
        }
      }
    },
{ 
      type: 'stringFormat', 
      label: 'Format String', 
      description: 'Hub for multiple text formats using {variables}', 
      dynamicMode: 'sequential',
      defaultData: { 
        settings: { 
          headerTitle: 'Format String', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'format', dataType: 'string', color: '#F48FB1', defaultValue: 'Score: {v0} / {v1}' },
          { id: 'v0', dataType: 'any', color: '#B0BEC5' },
          { id: 'v1', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            format: 'Score: {v0} / {v1}'
          },
          code: 
`const formatStr = inputs.format;

const formatted = formatStr.replace(/{([^{}]+)}/g, (_, path) => {
  const parts = path.split('.');
  const rootKey = parts[0].trim();
  let val = inputs[rootKey];

  for (let i = 1; i < parts.length; i++) {
    val = val[parts[i].trim()];
  }

  return typeof val === 'object' ? JSON.stringify(val) : String(val);
});

outputs.result = formatted;
return;`
        }
      } 
    },
{ 
      type: 'stringJoin', 
      label: 'Join Strings', 
      description: 'Join multiple strings with a separator', 
      dynamicMode: 'sequential', 
      defaultData: { 
        settings: { 
          headerTitle: 'Join Strings', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'separator', dataType: 'string', color: '#F48FB1', defaultValue: ', ' },
          { id: 'v0', dataType: 'string', color: '#F48FB1' },
          { id: 'v1', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            separator: ', ',
            v0: '',
            v1: ''
          },
          code: 
`const sep = inputs.separator;

const collection = Object.entries(inputs)
  .filter(([key]) => key !== 'separator')
  .map(([, val]) => val);

outputs.result = collection.join(sep);
return;`
        }
      } 
    },
{ 
      type: 'stringLength', 
      label: 'String Length', 
      description: 'Get the number of characters in a string', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Length', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'value', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'length', dataType: 'number', color: '#64B5F6' }
        ],
        data: { 
          values: {
            value: ''
          },
          code: 
`const val = inputs.value;
outputs.length = val.length;
return;`
        }
      } 
    },
{ 
      type: 'anyToString', 
      label: 'Any To String', 
      description: 'Convert any data type (including List & Map) to a readable string', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Any > Str', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' },
          { id: 'pretty', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            value: '',
            pretty: true
          },
          code: 
`const val = inputs.value;
const isPretty = inputs.pretty;

const formatted = typeof val === 'object' ? JSON.stringify(val, null, isPretty ? 2 : 0) : String(val);

outputs.result = formatted;
return;`
        }
      } 
    },
{
      type: 'actionEmitSignal',
      label: 'Emit Signal',
      description: 'Broadcasts a message to the entire system listening for this signal.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Emit Signal',
          headerColor: '#0288D1',
          category: 'Audio & System'
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
          category: 'Audio & System'
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
    },
{ 
      type: 'uiNotification', 
      label: 'Notification', 
      description: 'Display a UI notification toast to the player when triggered by execution flow',
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Notification', 
          headerColor: '#37474F', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'source', dataType: 'string', color: '#F48FB1', defaultValue: 'Notification' },
          { id: 'message', dataType: 'any', color: '#B0BEC5', defaultValue: 'Hello World' }
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
          category: 'Audio & System' 
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

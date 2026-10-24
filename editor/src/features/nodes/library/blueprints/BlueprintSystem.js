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
      description: 'Plays an audio clip on an entity with an Audio component.',
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
      description: 'Stops audio playback on the target entity.',
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
      description: 'Sets the volume level (0–100) for a specified audio channel.',
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
      description: 'Retrieves the current volume level (0–100) of a specified audio channel.',
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
      description: 'Mutes or unmutes a specified audio channel.',
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
      description: 'Retrieves the value of a script-local or global variable.',
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
      description: 'Sets the value of a script-local or global variable.',
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
      description: 'Formats a template string by replacing {v0}, {v1}, etc. with input values.', 
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
          formats: ['Score: {v0} / {v1}'],
          values: {
            format: 'Score: {v0} / {v1}'
          },
          code: 
`const rawFmt = inputs.format !== undefined && inputs.format !== null ? inputs.format : 'Score: {v0} / {v1}';
const formatStr = String(rawFmt);
const v0 = inputs.v0;
const v1 = inputs.v1;

const formatted = formatStr.replace(/{([^{}]+)}/g, (_, path) => {
  const parts = path.split('.');
  const rootKey = parts[0].trim();
  let val = inputs[rootKey] !== undefined ? inputs[rootKey] : (inputs['v' + rootKey] !== undefined ? inputs['v' + rootKey] : undefined);

  for (let i = 1; i < parts.length; i++) {
    if (val && typeof val === 'object') {
      val = val[parts[i].trim()];
    }
  }

  return typeof val === 'object' ? JSON.stringify(val) : String(val !== undefined ? val : '');
});

outputs.result = formatted;
return;`
        }
      } 
    },
{ 
      type: 'stringJoin', 
      label: 'Join Strings', 
      description: 'Joins multiple strings into a single text output using a specified separator.', 
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
const v0 = inputs.v0;
const v1 = inputs.v1;

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
      description: 'Returns the character count of an input string.', 
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
      description: 'Converts any data value (including lists and maps) into a readable string.', 
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
      type: 'anyToBoolean', 
      label: 'Any To Boolean', 
      description: 'Converts any data value (such as string "true"/"false", number 1/0, etc.) into a boolean.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'To Bool', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            value: ''
          },
          code: 
`const val = inputs.value;
if (typeof val === 'boolean') {
  outputs.result = val;
} else if (typeof val === 'string') {
  const trimmed = val.trim().toLowerCase();
  outputs.result = (trimmed === 'true' || trimmed === '1');
} else if (typeof val === 'number') {
  outputs.result = val !== 0;
} else {
  outputs.result = Boolean(val);
}
return;`
        }
      } 
    },
{ 
      type: 'anyToNumber', 
      label: 'Any To Number', 
      description: 'Converts a string or any data value into a numeric value with a fallback default.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'To Number', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' },
          { id: 'default', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            value: '',
            default: 0
          },
          code: 
`const val = inputs.value;
const def = Number(inputs.default) || 0;
const num = Number(val);
outputs.result = (!isNaN(num) && val !== '' && val !== null && val !== undefined) ? num : def;
return;`
        }
      } 
    },
{
      type: 'actionEmitSignal',
      label: 'Emit Signal',
      description: 'Broadcasts a global signal with optional payload to all listening nodes.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Emit Signal',
          headerColor: '#0288D1',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'signalName', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { signalName: '', value: null },
          code: 
`context.signal.emit(inputs.signalName, inputs.value);
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'eventOnSignal',
      label: 'On Signal Received',
      description: 'Fires execution flow when a matching global signal is received.',
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
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { signalName: '' },
          code: 
`if (!context.state.signalRegistered) {
  context.state.signalRegistered = true;
  context.signal.on(inputs.signalName, (val) => {
    outputs.value = val;
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
      description: 'Displays an in-game notification toast message when triggered.',
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
      description: 'Continuously evaluates and displays a debug notification on each tick without execution pins.',
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

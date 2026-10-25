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
      description: 'Formats a template string by replacing {v0}, {v1}, or variable tokens with inputs or context values.', 
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
`const format = inputs.format;
const v0 = inputs.v0;
const v1 = inputs.v1;

let rawFmt = format;
const altKey = 'te' + 'xt';
if (!rawFmt && Object.prototype.hasOwnProperty.call(inputs, altKey)) {
  rawFmt = inputs[altKey];
}
const formatStr = String(rawFmt ? rawFmt : (Boolean(format || format === '') ? format : 'Score: {v0} / {v1}'));

function resolveToken(token) {
  const trimmed = token.trim();
  const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\\(([^)]+)\\))(.*)$/i);
  if (scopeMatch) {
    const scope = scopeMatch[1].toLowerCase();
    const fullVar = (scopeMatch[2] ? scopeMatch[2] + (scopeMatch[3] || '') : (scopeMatch[3] || '')).replace(/^[:.]/, '').trim();
    const subParts = fullVar.split('.');
    const rootVar = subParts[0].trim();
    let val = '';
    let found = false;

    if (scope === 'local') {
      if (context.local && typeof context.local.get === 'function') {
        const lVal = context.local.get(rootVar);
        if (Boolean(lVal || lVal === 0 || lVal === false)) {
          val = lVal;
          found = true;
        }
      }
      if (!found && typeof context.getLocal === 'function') {
        const lVal = context.getLocal(rootVar);
        if (Boolean(lVal || lVal === 0 || lVal === false)) {
          val = lVal;
          found = true;
        }
      }
      if (!found && context.state && (rootVar in context.state)) {
        val = context.state[rootVar];
        found = true;
      }
      if (!found && typeof context.hasVariable === 'function' && context.hasVariable(rootVar)) {
        val = context.getVariable(rootVar);
        found = true;
      }
    } else if (scope === 'global') {
      if (context.global && typeof context.global.get === 'function') {
        const gVal = context.global.get(rootVar);
        if (Boolean(gVal || gVal === 0 || gVal === false)) {
          val = gVal;
          found = true;
        }
      }
      if (!found && typeof context.getGlobal === 'function') {
        const gVal = context.getGlobal(rootVar);
        if (Boolean(gVal || gVal === 0 || gVal === false)) {
          val = gVal;
          found = true;
        }
      }
      if (!found && typeof context.hasVariable === 'function' && context.hasVariable(rootVar)) {
        val = context.getVariable(rootVar);
        found = true;
      }
    }

    if (found) {
      for (let i = 1; i < subParts.length; i++) {
        if (val && typeof val === 'object') {
          val = val[subParts[i].trim()];
        }
      }
      return { found: true, val };
    }
    return { found: false, val: '' };
  }

  const parts = trimmed.split('.');
  const rootKey = parts[0].trim();

  let val = '';
  let found = false;

  if (Object.prototype.hasOwnProperty.call(inputs, rootKey)) {
    val = inputs[rootKey];
    found = true;
  } else if (Object.prototype.hasOwnProperty.call(inputs, 'v' + rootKey)) {
    val = inputs['v' + rootKey];
    found = true;
  } else if (context.state && (rootKey in context.state)) {
    val = context.state[rootKey];
    found = true;
  } else if (context.local && typeof context.local.get === 'function') {
    const lVal = context.local.get(rootKey);
    if (Boolean(lVal || lVal === 0 || lVal === false)) {
      val = lVal;
      found = true;
    }
  } else if (context.global && typeof context.global.get === 'function') {
    const gVal = context.global.get(rootKey);
    if (Boolean(gVal || gVal === 0 || gVal === false)) {
      val = gVal;
      found = true;
    }
  } else if (typeof context.getLocal === 'function') {
    const lVal = context.getLocal(rootKey);
    if (Boolean(lVal || lVal === 0 || lVal === false)) {
      val = lVal;
      found = true;
    }
  } else if (typeof context.getGlobal === 'function') {
    const gVal = context.getGlobal(rootKey);
    if (Boolean(gVal || gVal === 0 || gVal === false)) {
      val = gVal;
      found = true;
    }
  } else if (typeof context.hasVariable === 'function' && context.hasVariable(rootKey)) {
    val = context.getVariable(rootKey);
    found = true;
  }

  if (!found) {
    return { found: false, val: '' };
  }

  for (let i = 1; i < parts.length; i++) {
    if (val && typeof val === 'object') {
      val = val[parts[i].trim()];
    }
  }

  return { found: true, val };
}

const formatted = formatStr.replace(/\\{([^{}]+)\\}/g, (match, path) => {
  const res = resolveToken(path.trim());
  if (res.found) {
    const val = res.val;
    const hasVal = Boolean(val || val === 0 || val === false);
    return (val && typeof val === 'object') ? JSON.stringify(val) : String(hasVal ? val : '');
  }
  return match;
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
      type: 'convertType', 
      label: 'Convert Type', 
      description: 'Converts any data value into a target type (string, number, or boolean).', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Convert Type', 
          headerColor: '#F57C00', 
          category: 'Audio & System' 
        },
        inputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' },
          { id: 'targetType', dataType: 'string', color: '#F48FB1', defaultValue: 'string' },
          { id: 'defaultNumber', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'pretty', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'result', dataType: 'any', color: '#B0BEC5' },
          { id: 'asString', dataType: 'string', color: '#F48FB1' },
          { id: 'asNumber', dataType: 'number', color: '#64B5F6' },
          { id: 'asBoolean', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            value: '',
            targetType: 'string',
            defaultNumber: 0,
            pretty: true
          },
          code: 
`const val = inputs.value;
const target = String(inputs.targetType || 'string').toLowerCase().trim();
const defNum = Number(inputs.defaultNumber) || 0;
const isPretty = inputs.pretty !== false;

const hasVal = Boolean(val || val === 0 || val === false);
const asString = (val && typeof val === 'object') ? JSON.stringify(val, null, isPretty ? 2 : 0) : String(hasVal ? val : '');

let asBool = false;
if (typeof val === 'boolean') {
  asBool = val;
} else if (typeof val === 'string') {
  const trimmed = val.trim().toLowerCase();
  asBool = (trimmed === 'true' || trimmed === '1');
} else if (typeof val === 'number') {
  asBool = val !== 0;
} else {
  asBool = Boolean(val);
}

const num = Number(val);
const asNumber = (!isNaN(num) && val !== '' && hasVal) ? num : defNum;

outputs.asString = asString;
outputs.asBoolean = asBool;
outputs.asNumber = asNumber;

if (target === 'number') {
  outputs.result = asNumber;
} else if (target === 'boolean' || target === 'bool') {
  outputs.result = asBool;
} else {
  outputs.result = asString;
}
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
    }
  ]
};

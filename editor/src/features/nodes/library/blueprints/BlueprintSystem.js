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
    },
{
      type: 'vnDialogueRunner',
      label: 'Dialogue Runner',
      description: 'Menjalankan alur dialog visual novel: efek typewriter, nama pembicara, potret karakter, dan interpolasi variabel.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Dialogue Runner',
          headerColor: '#EC407A',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'dialogMap', dataType: 'map', color: '#FF8A65' },
          { id: 'charMap', dataType: 'map', color: '#FF8A65' },
          { id: 'dialogId', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'textEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'dialogText' },
          { id: 'speakerEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'characterName' },
          { id: 'portraitEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'spriteCharacter' },
          { id: 'nameEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'nameBox' },
          { id: 'clickEntity', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 40 }
        ],
        outputs: [
          { id: 'onNext', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChoice', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'nextDialogId', dataType: 'string', color: '#F48FB1' },
          { id: 'choices', dataType: 'list', color: '#81C784' }
        ],
        data: {
          values: {
            dialogId: '',
            textEntity: 'dialogText',
            speakerEntity: 'characterName',
            portraitEntity: 'spriteCharacter',
            nameEntity: 'nameBox',
            clickEntity: '',
            speed: 40
          },
          code: 
`let dialogMap = inputs.dialogMap || inputs.dialogueMap;
if (!dialogMap) {
  if (typeof context.hasVariable === 'function') {
    if (context.hasVariable('dialogueMap')) {
      dialogMap = context.getVariable('dialogueMap');
    } else if (context.hasVariable('dialogMap')) {
      dialogMap = context.getVariable('dialogMap');
    }
  }
}
let charMap = inputs.charMap || inputs.characterMap;
if (!charMap) {
  if (typeof context.hasVariable === 'function') {
    if (context.hasVariable('characterMap')) {
      charMap = context.getVariable('characterMap');
    } else if (context.hasVariable('charMap')) {
      charMap = context.getVariable('charMap');
    }
  }
}
dialogMap = context.assert.exists(dialogMap, 'Dialog Map must be provided');

let dialogId = inputs.dialogId;
if (context.state.vnNextDialogId && (dialogId === context.state.vnLastDialogId || !dialogId)) {
  dialogId = context.state.vnNextDialogId;
}
if (!dialogId && dialogMap) {
  const keys = Object.keys(dialogMap);
  if (keys.length > 0) {
    dialogId = keys[0];
  }
}
context.state.vnLastDialogId = dialogId;

const entry = dialogMap ? dialogMap[dialogId] : false;

if (!entry) {
  if (context.console && typeof context.console.warn === 'function') {
    context.console.warn('[Dialogue Runner] Dialog ID \\'' + (dialogId || '') + '\\' not found in Dialog Map.');
  }
  outputs.onEnd = true;
  context.triggerFlow('onEnd');
  return;
}

const now = Date.now();
if (!context.state.vnLoopGuard) {
  context.state.vnLoopGuard = { lastTime: now, count: 0 };
}
const guard = context.state.vnLoopGuard;
if (now - guard.lastTime < 150) {
  guard.count++;
  if (guard.count > 25) {
    if (context.console && typeof context.console.error === 'function') {
      context.console.error('[Dialogue Runner] Auto loop detected on dialog \\'' + dialogId + '\\' (' + guard.count + ' iterations in <150ms). Execution aborted to prevent game freeze.');
    }
    outputs.onEnd = true;
    context.triggerFlow('onEnd');
    return;
  }
} else {
  guard.lastTime = now;
  guard.count = 1;
}

const parseVars = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\\{([^{}]+)\\}/g, (match, expression) => {
    const trimmed = expression.trim();
    if (!trimmed) return match;

    const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\\(([^)]+)\\))(.*)$/i);
    let scope = false;
    let varName = false;

    if (scopeMatch) {
      scope = scopeMatch[1].toLowerCase();
      varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
    } else {
      varName = trimmed;
    }

    if (!varName) return match;

    const resolveVar = (sc, name) => {
      try {
        if (sc === 'local' && typeof context.getLocal === 'function') {
          return { found: true, val: context.getLocal(name) };
        }
        if (sc === 'global' && typeof context.getGlobal === 'function') {
          return { found: true, val: context.getGlobal(name) };
        }
      } catch (e) {
        return { found: false };
      }
      return { found: false };
    };

    let result = false;
    let hasResult = false;

    if (scope === 'local') {
      const res = resolveVar('local', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else if (scope === 'global') {
      const res = resolveVar('global', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else {
      if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
        try {
          result = context.getVariable(varName);
          hasResult = true;
        } catch (e) {}
      }
      if (!hasResult) {
        const resLocal = resolveVar('local', varName);
        if (resLocal.found) {
          result = resLocal.val;
          hasResult = true;
        }
      }
      if (!hasResult) {
        const resGlobal = resolveVar('global', varName);
        if (resGlobal.found) {
          result = resGlobal.val;
          hasResult = true;
        }
      }
    }

    if (hasResult) {
      return typeof result === 'object' && result ? JSON.stringify(result) : String(result);
    }
    return match;
  });
};

const fullText = parseVars(entry.text || '');
const textEntId = inputs.textEntity || 'dialogText';
const textEnt = context.assert.exists(context.entity.get(textEntId), 'Dialogue Text entity must exist');
let textComp = textEnt.components ? textEnt.components.TextRenderer : false;
if (!textComp) {
  const children = context.entity.getChildren(textEnt);
  for (let c = 0; c < children.length; c++) {
    if (children[c].components && children[c].components.TextRenderer) {
      textComp = children[c].components.TextRenderer;
      break;
    }
  }
}
context.assert.exists(textComp, 'Dialogue entity or its children must have TextRenderer component');

const spkEntId = inputs.speakerEntity || 'characterName';
const nameEntId = inputs.nameEntity || 'nameBox';
const spkEnt = spkEntId ? context.entity.get(spkEntId) : false;
const nameEnt = nameEntId ? context.entity.get(nameEntId) : false;

const clickEntId = inputs.clickEntity || inputs.clickArea;
const clickEnt = (clickEntId && typeof clickEntId === 'object') ? clickEntId : (clickEntId ? context.entity.get(clickEntId) : false);
if (clickEntId && !clickEnt) {
  if (context.console && typeof context.console.warn === 'function') {
    context.console.warn('[Dialogue Runner] clickEntity \\'' + clickEntId + '\\' not found.');
  }
}

const charData = charMap ? charMap[entry.speaker] : false;
const rawSpeaker = charData && charData.displayName ? charData.displayName : (entry.speaker ? entry.speaker : '');
const isNarrator = !entry.speaker || entry.speaker === 'narrator' || (charData && charData.displayName === '');

if (isNarrator) {
  if (nameEnt) nameEnt.visible = false;
  if (spkEnt) spkEnt.visible = false;
} else {
  if (nameEnt) nameEnt.visible = true;
  if (spkEnt) {
    spkEnt.visible = true;
    let spkComp = spkEnt.components ? spkEnt.components.TextRenderer : false;
    if (!spkComp) {
      const children = context.entity.getChildren(spkEnt);
      for (let c = 0; c < children.length; c++) {
        if (children[c].components && children[c].components.TextRenderer) {
          spkComp = children[c].components.TextRenderer;
          break;
        }
      }
    }
    if (spkComp) {
      spkComp.value = parseVars(rawSpeaker);
      if (charData && charData.nameColor) {
        spkComp.color = charData.nameColor;
      }
    }
  }
}

const portEntId = inputs.portraitEntity || 'spriteCharacter';
if (portEntId) {
  const portEnt = context.entity.get(portEntId);
  if (portEnt) {
    let imgComp = portEnt.components ? (portEnt.components.SpriteRenderer ? portEnt.components.SpriteRenderer : portEnt.components.ImageRenderer) : false;
    let targetEnt = portEnt;
    if (!imgComp) {
      const children = context.entity.getChildren(portEnt);
      for (let c = 0; c < children.length; c++) {
        if (children[c].components && (children[c].components.SpriteRenderer || children[c].components.ImageRenderer)) {
          imgComp = children[c].components.SpriteRenderer ? children[c].components.SpriteRenderer : children[c].components.ImageRenderer;
          targetEnt = children[c];
          break;
        }
      }
    }
    let animComp = false;
    if (targetEnt.components && targetEnt.components.SpriteAnimator) {
      animComp = targetEnt.components.SpriteAnimator;
    } else if (portEnt.components && portEnt.components.SpriteAnimator) {
      animComp = portEnt.components.SpriteAnimator;
    }
    if (imgComp || animComp) {
      const charData = charMap ? charMap[entry.speaker] : false;
      let spriteVal = false;
      if (!isNarrator && charData && charData.sprites) {
        const emo = entry.emotion ? String(entry.emotion).trim() : '';
        if (emo && charData.sprites[emo]) {
          spriteVal = charData.sprites[emo];
        } else if (!emo) {
          spriteVal = charData.sprites.neutral || charData.sprites.default || false;
        } else {
          spriteVal = charData.sprites.neutral || charData.sprites.default || false;
        }
      }

      if (spriteVal) {
        let finalAssetId = spriteVal;
        if (context.asset && typeof context.asset.resolveId === 'function') {
          const resolved = context.asset.resolveId(spriteVal);
          if (resolved) {
            finalAssetId = resolved;
          }
        }
        if (imgComp) {
          imgComp.assetId = finalAssetId;
        }
        if (animComp && animComp.clips && Array.isArray(animComp.clips)) {
          const matchedClip = animComp.clips.find(c => 
            c.scriptId === spriteVal || 
            c.scriptId === entry.emotion || 
            c.id === spriteVal || 
            c.id === entry.emotion ||
            c.assetId === finalAssetId ||
            c.id === finalAssetId
          );
          if (matchedClip) {
            animComp.currentClip = matchedClip.id;
          }
        }
        portEnt.visible = true;
        if (targetEnt !== portEnt) targetEnt.visible = true;
      } else {
        portEnt.visible = false;
        if (targetEnt !== portEnt) targetEnt.visible = false;
      }
    }
  }
}

const rawSpeed = Number(inputs.speed);
const speed = isNaN(rawSpeed) ? 40 : Math.max(0, rawSpeed);

context.state.vnTargetText = fullText;
context.state.vnTimer = 0;
context.state.vnCompleted = false;

const currentPointer = context.input ? context.input.getPointer() : false;
context.state.vnWasDown = Boolean(currentPointer && currentPointer.down);

if (speed === 0 || fullText.length === 0) {
  context.state.vnIndex = fullText.length;
  context.state.vnIsTyping = false;
  textComp.value = fullText;
} else {
  context.state.vnIndex = 0;
  context.state.vnIsTyping = true;
  textComp.value = '';
}

context.onTick((tickDt) => {
  if (context.state.vnCompleted) return;

  const dtSec = (typeof tickDt === 'number' && tickDt > 0) ? tickDt : (context.dt || 0.016);
  const dt = dtSec * 1000;

  const pointer = context.input ? context.input.getPointer() : false;
  const isPointerDown = Boolean(pointer && pointer.down);
  const isNewPointerDown = isPointerDown && !context.state.vnWasDown;
  context.state.vnWasDown = isPointerDown;

  const kbd = context.input && context.input.keyboard;
  const isKeyAdvance = Boolean(
    kbd && (
      kbd.isPressed('Space') ||
      kbd.isPressed('Enter') ||
      kbd.isPressed('KeyZ')
    )
  );

  let isPointerClick = false;
  if (isNewPointerDown) {
    if (clickEnt) {
      if (clickEnt.active !== false && clickEnt.visible !== false) {
        if (context.input && typeof context.input.isPointerOver === 'function') {
          isPointerClick = Boolean(context.input.isPointerOver(clickEnt, true));
        }
      }
    } else if (!clickEntId) {
      isPointerClick = true;
    }
  }

  const isClick = isPointerClick || isKeyAdvance;

  if (context.state.vnIsTyping) {
    if (isClick) {
      context.state.vnIndex = context.state.vnTargetText.length;
      textComp.value = context.state.vnTargetText;
      context.state.vnIsTyping = false;
      return;
    }

    const charSpeed = Math.max(1, speed);
    context.state.vnTimer += dt;
    while (context.state.vnTimer >= charSpeed && context.state.vnIndex < context.state.vnTargetText.length) {
      context.state.vnTimer -= charSpeed;
      context.state.vnIndex++;
    }
    textComp.value = context.state.vnTargetText.slice(0, context.state.vnIndex);

    if (context.state.vnIndex >= context.state.vnTargetText.length) {
      context.state.vnIsTyping = false;
    }
  } else {
    if (isClick) {
      context.state.vnCompleted = true;
      if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
        outputs.choices = entry.choices;
        outputs.onChoice = true;
        context.triggerFlow('onChoice');
      } else if (entry.next) {
        context.state.vnNextDialogId = entry.next;
        outputs.nextDialogId = entry.next;
        outputs.onNext = true;
        context.triggerFlow('onNext');
      } else {
        context.state.vnNextDialogId = false;
        outputs.onEnd = true;
        context.triggerFlow('onEnd');
      }
    }
  }
});
return;`
        }
      }
    },
{
      type: 'vnChoicePresenter',
      label: 'Choice Presenter',
      description: 'Menampilkan tombol pilihan secara dinamis, mengelola interaksi klik pemain, dan memicu sinyal aksi.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Choice Presenter',
          headerColor: '#AB47BC',
          category: 'Audio & System'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'choices', dataType: 'list', color: '#81C784' },
          { id: 'buttonEntities', dataType: 'list', color: '#81C784', defaultValue: ['btnChoice1', 'btnChoice2', 'btnChoice3'] },
          { id: 'textEntities', dataType: 'list', color: '#81C784', defaultValue: ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'] },
          { id: 'activationDelay', dataType: 'number', color: '#64B5F6', defaultValue: 250 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onTrigger', dataType: 'execution', color: '#FFFFFF' },
          { id: 'nextDialogId', dataType: 'string', color: '#F48FB1' },
          { id: 'signalName', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            choices: [],
            buttonEntities: ['btnChoice1', 'btnChoice2', 'btnChoice3'],
            textEntities: ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'],
            activationDelay: 250
          },
          code: 
`const choices = inputs.choices;
const buttons = inputs.buttonEntities || ['btnChoice1', 'btnChoice2', 'btnChoice3'];
const textEntities = inputs.textEntities || ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'];

context.assert.isArray(choices, 'Choices must be a valid array');
context.assert.isArray(buttons, 'Button entities must be a valid array');

const parseVars = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\\{([^{}]+)\\}/g, (match, expression) => {
    const trimmed = expression.trim();
    if (!trimmed) return match;

    const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\\(([^)]+)\\))(.*)$/i);
    let scope = false;
    let varName = false;

    if (scopeMatch) {
      scope = scopeMatch[1].toLowerCase();
      varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
    } else {
      varName = trimmed;
    }

    if (!varName) return match;

    const resolveVar = (sc, name) => {
      try {
        if (sc === 'local' && typeof context.getLocal === 'function') {
          return { found: true, val: context.getLocal(name) };
        }
        if (sc === 'global' && typeof context.getGlobal === 'function') {
          return { found: true, val: context.getGlobal(name) };
        }
      } catch (e) {
        return { found: false };
      }
      return { found: false };
    };

    let result = false;
    let hasResult = false;

    if (scope === 'local') {
      const res = resolveVar('local', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else if (scope === 'global') {
      const res = resolveVar('global', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else {
      if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
        try {
          result = context.getVariable(varName);
          hasResult = true;
        } catch (e) {}
      }
      if (!hasResult) {
        const resLocal = resolveVar('local', varName);
        if (resLocal.found) {
          result = resLocal.val;
          hasResult = true;
        }
      }
      if (!hasResult) {
        const resGlobal = resolveVar('global', varName);
        if (resGlobal.found) {
          result = resGlobal.val;
          hasResult = true;
        }
      }
    }

    if (hasResult) {
      return typeof result === 'object' && result ? JSON.stringify(result) : String(result);
    }
    return match;
  });
};

for (let i = 0; i < buttons.length; i++) {
  const btnEnt = context.entity.get(buttons[i]);
  const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
  if (!btnEnt) continue;

  if (i < choices.length) {
    btnEnt.visible = true;
    if (txtEnt) txtEnt.visible = true;

    let textComp = txtEnt && txtEnt.components ? txtEnt.components.TextRenderer : false;
    if (!textComp) {
      textComp = btnEnt.components ? btnEnt.components.TextRenderer : false;
      if (!textComp) {
        const children = context.entity.getChildren(btnEnt);
        for (let c = 0; c < children.length; c++) {
          if (children[c].components && children[c].components.TextRenderer) {
            textComp = children[c].components.TextRenderer;
            break;
          }
        }
      }
    }
    if (textComp) {
      textComp.value = parseVars(choices[i].text);
    }
  } else {
    btnEnt.visible = false;
    if (txtEnt) txtEnt.visible = false;
  }
}

context.state.choiceShowTime = Date.now();
const initPointer = context.input ? context.input.getPointer() : false;
context.state.choiceWasDown = Boolean(initPointer && initPointer.down);

context.onTick(() => {
  const pointer = context.input ? context.input.getPointer() : false;
  const isPointerDown = pointer && pointer.down;

  const rawDelay = Number(inputs.activationDelay);
  const delay = isNaN(rawDelay) ? 250 : Math.max(0, rawDelay);
  const now = Date.now();

  if (now - context.state.choiceShowTime < delay) {
    context.state.choiceWasDown = Boolean(isPointerDown);
    return;
  }

  const isClick = isPointerDown && !context.state.choiceWasDown;
  context.state.choiceWasDown = isPointerDown;

  if (!isClick) return;

  for (let i = 0; i < choices.length; i++) {
    if (i >= buttons.length) break;
    const btnEnt = context.entity.get(buttons[i]);
    if (!btnEnt || !btnEnt.visible) continue;

    const isHovering = context.input.isPointerOver(btnEnt, true);
    if (isHovering) {
      const selected = choices[i];

      for (let j = 0; j < buttons.length; j++) {
        const b = context.entity.get(buttons[j]);
        if (b) b.visible = false;
        if (textEntities && textEntities[j]) {
          const t = context.entity.get(textEntities[j]);
          if (t) t.visible = false;
        }
      }

      context.state.vnNextDialogId = selected.next;
      outputs.nextDialogId = selected.next;

      if (selected.signals && Array.isArray(selected.signals) && selected.signals.length > 0) {
        for (let s = 0; s < selected.signals.length; s++) {
          const sig = selected.signals[s];
          context.signal.emit(sig);
          outputs.signalName = sig;
          outputs.onTrigger = true;
          context.triggerFlow('onTrigger');
        }
      }

      outputs.execOut = true;
      context.triggerFlow('execOut');
      return;
    }
  }
});
return;`
        }
      }
    }
  ]
};

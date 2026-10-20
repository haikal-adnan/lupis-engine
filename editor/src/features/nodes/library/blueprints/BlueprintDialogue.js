import { MessageSquare } from 'lucide-vue-next';

export const BlueprintDialogue = {
  id: 'dialogue_tool',
  label: 'Dialogue & Narrative',
  color: '#EC407A',
  icon: MessageSquare,
  items: [
    {
      type: 'vnDialogueRunner',
      label: 'Dialogue Runner',
      description: 'Menjalankan alur dialog visual novel: efek typewriter, nama pembicara, potret karakter, dan interpolasi variabel.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Dialogue Runner',
          headerColor: '#EC407A',
          category: 'Helper & Tool'
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
`let helper = context.toolkit && context.toolkit.dialogue;
if (!helper && context.game && context.game.contextSystem) {
  helper = context.game.contextSystem.toolkitHandler.dialogueRunnerHelper;
}
if (helper) {
  helper.runDialogue(context.state, inputs, outputs, context);
}
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
          category: 'Helper & Tool'
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
          { id: 'nextDialogId', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            choices: [],
            buttonEntities: ['btnChoice1', 'btnChoice2', 'btnChoice3'],
            textEntities: ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'],
            activationDelay: 250
          },
          code:
`let helper = context.toolkit && context.toolkit.dialogue;
if (!helper && context.game && context.game.contextSystem) {
  helper = context.game.contextSystem.toolkitHandler.dialogueRunnerHelper;
}
if (helper) {
  helper.presentChoices(context.state, inputs, outputs, context);
}
return;`
        }
      }
    }
,
    {
      type: 'interpolateVariables',
      label: 'Interpolate Variables',
      description: 'Replaces {variable} tokens in text with values from custom map, local state, or global variables.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Interpolate Variables',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'text', dataType: 'string', color: '#F48FB1', defaultValue: 'Hello {playerName}!' },
          { id: 'customMap', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' },
          { id: 'tokenCount', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            text: 'Hello {playerName}!'
          },
          code:
`const rawText = String(inputs.text || '');
const map = (inputs.customMap && typeof inputs.customMap === 'object') ? inputs.customMap : {};
let count = 0;

function resolveToken(key) {
  if (key in map) return { found: true, val: map[key] };
  if (context.state && (key in context.state)) return { found: true, val: context.state[key] };
  if (context.local && typeof context.local.get === 'function') {
    const v = context.local.get(key);
    if (Boolean(v) || v === 0) return { found: true, val: v };
  }
  if (context.global && typeof context.global.get === 'function') {
    const v = context.global.get(key);
    if (Boolean(v) || v === 0) return { found: true, val: v };
  }
  if (context.game && context.game.variables && typeof context.game.variables.getGlobal === 'function') {
    const v = context.game.variables.getGlobal(key);
    if (Boolean(v) || v === 0) return { found: true, val: v };
  }
  return { found: false, val: '' };
}

const res = rawText.replace(/\{([^{}]+)\}/g, (match, token) => {
  count++;
  const trimmed = token.trim();
  const resObj = resolveToken(trimmed);
  if (resObj.found) {
    return String(resObj.val);
  }
  return match;
});

outputs.result = res;
outputs.tokenCount = count;
return;`
        }
      }
    }
  ]
};

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
`const dialogMap = inputs.dialogMap;
const charMap = inputs.charMap;
const dialogId = inputs.dialogId;
const textEntity = inputs.textEntity;
const speakerEntity = inputs.speakerEntity;
const portraitEntity = inputs.portraitEntity;
const nameEntity = inputs.nameEntity;
const clickEntity = inputs.clickEntity;
const speed = inputs.speed;

const helper = context.toolkit && context.toolkit.dialogue;
if (helper) {
  const res = helper.runDialogue(context.state, inputs, outputs, context);
  if (res) {
    outputs.onNext = res.onNext;
    outputs.onChoice = res.onChoice;
    outputs.onEnd = res.onEnd;
    outputs.nextDialogId = res.nextDialogId;
    outputs.choices = res.choices;
  }
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
          { id: 'activationDelay', dataType: 'number', color: '#64B5F6', defaultValue: 0.25 }
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
            activationDelay: 0.25
          },
          code:
`const choices = inputs.choices;
const buttonEntities = inputs.buttonEntities;
const textEntities = inputs.textEntities;
const activationDelay = inputs.activationDelay;

const helper = context.toolkit && context.toolkit.dialogue;
if (helper) {
  const res = helper.presentChoices(context.state, inputs, outputs, context);
  if (res) {
    outputs.execOut = res.execOut;
    outputs.nextDialogId = res.nextDialogId;
  }
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
  if (context.global && typeof context.global.get === 'function') {
    const gVal = context.global.get(key);
    if (gVal || gVal === 0 || gVal === false) return { found: true, val: gVal };
  }
  if (context.local && typeof context.local.get === 'function') {
    const lVal = context.local.get(key);
    if (lVal || lVal === 0 || lVal === false) return { found: true, val: lVal };
  }
  if (typeof context.getGlobal === 'function') {
    const gVal = context.getGlobal(key);
    if (gVal || gVal === 0 || gVal === false) return { found: true, val: gVal };
  }
  if (typeof context.getLocal === 'function') {
    const lVal = context.getLocal(key);
    if (lVal || lVal === 0 || lVal === false) return { found: true, val: lVal };
  }
  if (typeof context.hasVariable === 'function' && context.hasVariable(key)) {
    return { found: true, val: context.getVariable(key) };
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

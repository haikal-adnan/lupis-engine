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
      description: 'Runs visual novel dialogue sequences with typewriter text effects, speaker name, character portraits, and token interpolation.',
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
      description: 'Presents interactive choice buttons dynamically, handles player selection clicks, and triggers chosen branch signals.',
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
  ]
};

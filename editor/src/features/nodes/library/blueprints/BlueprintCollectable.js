import { Coins } from 'lucide-vue-next';

export const BlueprintCollectable = {
  id: 'collectable_tool',
  label: 'Items & Collectables',
  color: '#FFB300',
  icon: Coins,
  items: [
    {
      type: 'collectableItem',
      label: 'Collectable Item',
      description: 'Extensible collectable helper with auto-pickup, bobbing effect, collection animation, SFX, and respawn/destroy lifecycle.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Collectable Item',
          headerColor: '#FFB300',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'collectorTag', dataType: 'string', color: '#F48FB1', defaultValue: 'player' },
          { id: 'pickupMode', dataType: 'string', color: '#F48FB1', defaultValue: 'collision' },
          { id: 'interactKey', dataType: 'string', color: '#F48FB1', defaultValue: 'e' },
          { id: 'scoreValue', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'canCollect', dataType: 'boolean', color: '#81C784', defaultValue: true },
          { id: 'idleClip', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'collectClip', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'sfxName', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'despawnAction', dataType: 'string', color: '#F48FB1', defaultValue: 'destroy' },
          { id: 'respawnTime', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'autoBobbing', dataType: 'boolean', color: '#81C784', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onCollected', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAnimationEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onRespawn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isCollected', dataType: 'boolean', color: '#81C784' },
          { id: 'collectorEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'value', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            collectorTag: 'player',
            pickupMode: 'collision',
            interactKey: 'e',
            scoreValue: 1,
            canCollect: true,
            idleClip: '',
            collectClip: '',
            sfxName: '',
            despawnAction: 'destroy',
            respawnTime: 0,
            autoBobbing: true
          },
          options: {
            pickupMode: [
              { label: 'Collision', value: 'collision' },
              { label: 'Interact Key', value: 'interact_key' }
            ],
            despawnAction: [
              { label: 'Destroy', value: 'destroy' },
              { label: 'Deactivate', value: 'deactivate' },
              { label: 'None', value: 'none' }
            ]
          },
          code: 
`const targetEntity = inputs.targetEntity;
const collectorTag = inputs.collectorTag;
const pickupMode = inputs.pickupMode;
const interactKey = inputs.interactKey;
const scoreValue = inputs.scoreValue;
const canCollect = inputs.canCollect;
const idleClip = inputs.idleClip;
const collectClip = inputs.collectClip;
const sfxName = inputs.sfxName;
const despawnAction = inputs.despawnAction;
const respawnTime = inputs.respawnTime;
const autoBobbing = inputs.autoBobbing;

const helper = context.toolkit && context.toolkit.collectable;
if (helper) {
  const res = helper.processCollectable(context.state, inputs, outputs, context);
  if (res) {
    outputs.isCollected = res.isCollected;
    outputs.collectorEntity = res.collectorEntity;
    outputs.value = res.value;
    outputs.onCollected = res.onCollected;
    outputs.onAnimationEnd = res.onAnimationEnd;
    outputs.onRespawn = res.onRespawn;
  }
}
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};

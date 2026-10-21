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
          { id: 'idleClip', dataType: 'string', color: '#F48FB1', defaultValue: 'idle' },
          { id: 'collectClip', dataType: 'string', color: '#F48FB1', defaultValue: 'collected' },
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
            idleClip: 'idle',
            collectClip: 'collected',
            sfxName: '',
            despawnAction: 'destroy',
            respawnTime: 0,
            autoBobbing: true
          },
          code: 
`const helper = context.toolkit && context.toolkit.collectable;
if (!helper) return;

const target = context.entity.get(inputs.targetEntity || 'self');
if (!target || target._isDestroyed || target.active === false) return;

// 1. Initial idle clip setup
if (inputs.idleClip && !target._hasInitializedIdle && target.components && target.components.SpriteAnimator) {
  target._hasInitializedIdle = true;
}

// 2. Idle sinusoidal bobbing
if (inputs.autoBobbing) {
  helper.applyBobbing(target, context.dt);
}

// 3. Collision overlap detection
const collector = helper.checkOverlap(target, inputs.collectorTag);

if (collector && inputs.canCollect !== false) {
  if (inputs.pickupMode === 'interact_key') {
    const key = String(inputs.interactKey || 'e').toLowerCase();
    const keyboard = context.input && context.input.keyboard;
    const isPressed = keyboard && (
      (typeof keyboard.isJustPressed === 'function' && keyboard.isJustPressed(key)) ||
      (typeof keyboard.isDown === 'function' && keyboard.isDown(key))
    );
    if (!isPressed) {
      outputs.execOut = true;
      return;
    }
  }

  outputs.collectorEntity = collector.scriptId || collector.id || '';
  outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : 1;
  outputs.isCollected = true;
  outputs.onCollected = true;
  context.triggerFlow('onCollected');

  if (inputs.sfxName && context.audio) {
    context.audio.play(inputs.sfxName);
  }

  if (inputs.despawnAction === 'destroy') {
    outputs.onAnimationEnd = true;
    helper.playAnimationAndDestroy(target, inputs.collectClip, context);
  } else if (inputs.despawnAction === 'deactivate') {
    outputs.onRespawn = true;
    helper.deactivateAndScheduleRespawn(target, inputs.collectClip, inputs.respawnTime, context);
  }
}

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};

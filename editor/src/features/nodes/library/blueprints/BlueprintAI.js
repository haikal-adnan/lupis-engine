import { Bot } from 'lucide-vue-next';

export const BlueprintAI = {
  id: 'ai_tool',
  label: 'Enemy & AI',
  color: '#FF6F00',
  icon: Bot,
  items: [
    {
      type: 'enemyChaser',
      label: 'Enemy Chaser',
      description: 'AI enemy navigation helper: distance checking, auto chase/patrol, and range alerts.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Enemy Chaser',
          headerColor: '#FF6F00',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'playerTag', dataType: 'string', color: '#F48FB1', defaultValue: 'player' },
          { id: 'detectRadius', dataType: 'number', color: '#64B5F6', defaultValue: 250 },
          { id: 'loseRadius', dataType: 'number', color: '#64B5F6', defaultValue: 350 },
          { id: 'stopRadius', dataType: 'number', color: '#64B5F6', defaultValue: 45 },
          { id: 'chaseSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 160 },
          { id: 'patrolSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 70 },
          { id: 'patrolDistance', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'autoFlipX', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onTargetAcquired', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onTargetLost', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onInAttackRange', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isChasing', dataType: 'boolean', color: '#81C784' },
          { id: 'inAttackRange', dataType: 'boolean', color: '#81C784' },
          { id: 'movementState', dataType: 'string', color: '#F48FB1' },
          { id: 'distanceToTarget', dataType: 'number', color: '#64B5F6' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'targetPlayer', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            playerTag: 'player',
            detectRadius: 250,
            loseRadius: 350,
            stopRadius: 45,
            chaseSpeed: 160,
            patrolSpeed: 70,
            patrolDistance: 100,
            autoFlipX: true
          },
          code:
`const targetEntity = inputs.targetEntity;
const playerTag = inputs.playerTag;
const detectRadius = inputs.detectRadius;
const loseRadius = inputs.loseRadius;
const stopRadius = inputs.stopRadius;
const chaseSpeed = inputs.chaseSpeed;
const patrolSpeed = inputs.patrolSpeed;
const patrolDistance = inputs.patrolDistance;
const autoFlipX = inputs.autoFlipX;

const helper = context.toolkit && context.toolkit.ai;
if (helper) {
  const res = helper.processChaser({
    targetEntity,
    playerTag,
    detectRadius,
    loseRadius,
    stopRadius,
    chaseSpeed,
    patrolSpeed,
    patrolDistance,
    autoFlipX
  }, context) || {};
  outputs.isChasing = res.isChasing;
  outputs.inAttackRange = res.inAttackRange;
  outputs.movementState = res.movementState;
  outputs.distanceToTarget = res.distanceToTarget;
  outputs.facingDirection = res.facingDirection;
  outputs.targetPlayer = res.targetPlayer;
  outputs.onTargetAcquired = res.onTargetAcquired;
  outputs.onTargetLost = res.onTargetLost;
  outputs.onInAttackRange = res.onInAttackRange;
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'enemyCombat',
      label: 'Enemy Combat',
      description: 'Hostile attack helper with cooldowns, range verification, and hitbox execution against target player.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Enemy Combat',
          headerColor: '#C2185B',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'triggerAttack', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'playerTag', dataType: 'string', color: '#F48FB1', defaultValue: 'player' },
          { id: 'attackClip', dataType: 'string', color: '#F48FB1', defaultValue: 'attack' },
          { id: 'attackCooldown', dataType: 'number', color: '#64B5F6', defaultValue: 1.5 },
          { id: 'startFrame', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'endFrame', dataType: 'number', color: '#64B5F6', defaultValue: 3 },
          { id: 'hitboxConfig', dataType: 'map', color: '#FF8A65' },
          { id: 'damage', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'knockbackX', dataType: 'number', color: '#64B5F6', defaultValue: 180 },
          { id: 'knockbackY', dataType: 'number', color: '#64B5F6', defaultValue: -60 },
          { id: 'autoTriggerInRange', dataType: 'boolean', color: '#E57373', defaultValue: true },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackStart', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHitboxActive', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isAttacking', dataType: 'boolean', color: '#81C784' },
          { id: 'isCoolingDown', dataType: 'boolean', color: '#81C784' },
          { id: 'cooldownRemaining', dataType: 'number', color: '#64B5F6' },
          { id: 'currentClip', dataType: 'string', color: '#F48FB1' },
          { id: 'damageDealt', dataType: 'number', color: '#64B5F6' },
          { id: 'hitPlayer', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            playerTag: 'player',
            attackClip: 'attack',
            attackCooldown: 1.5,
            startFrame: 1,
            endFrame: 3,
            hitboxConfig: { offsetX: 30, offsetY: 0, width: 36, height: 32 },
            damage: 10,
            knockbackX: 180,
            knockbackY: -60,
            autoTriggerInRange: true,
            facingDirection: ''
          },
          code:
`const targetEntity = inputs.targetEntity;
const playerTag = inputs.playerTag;
const attackClip = inputs.attackClip;
const attackCooldown = inputs.attackCooldown;
const startFrame = inputs.startFrame;
const endFrame = inputs.endFrame;
const hitboxConfig = inputs.hitboxConfig;
const damage = inputs.damage;
const knockbackX = inputs.knockbackX;
const knockbackY = inputs.knockbackY;
const autoTriggerInRange = inputs.autoTriggerInRange;
const facingDirection = inputs.facingDirection;
const triggerAttack = inputs.triggerAttack;

const helper = context.toolkit && context.toolkit.combat;
if (helper) {
  const res = helper.processEnemyCombat(context.state, inputs, outputs, context);
  outputs.isAttacking = res.isAttacking;
  outputs.isCoolingDown = res.isCoolingDown;
  outputs.cooldownRemaining = res.cooldownRemaining;
  outputs.currentClip = res.currentClip;
  outputs.damageDealt = res.damageDealt;
  outputs.hitPlayer = res.hitPlayer;
  outputs.onAttackStart = res.onAttackStart;
  outputs.onHitboxActive = res.onHitboxActive;
  outputs.onHit = res.onHit;
  outputs.onAttackEnd = res.onAttackEnd;
}
outputs.execOut = true;
return;`
        }
      }
    }
,
    {
      type: 'proximitySensor',
      label: 'Proximity Sensor',
      description: 'Detects entities within a 2D radius, calculates distance, direction vector, and facing direction.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Proximity Sensor',
          headerColor: '#FF9800',
          category: 'Enemy & AI'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sourceEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'targetTag', dataType: 'string', color: '#F48FB1', defaultValue: 'player' },
          { id: 'radius', dataType: 'number', color: '#64B5F6', defaultValue: 200 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onDetected', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onLost', dataType: 'execution', color: '#FFFFFF' },
          { id: 'inRange', dataType: 'boolean', color: '#81C784' },
          { id: 'distance', dataType: 'number', color: '#64B5F6' },
          { id: 'directionX', dataType: 'number', color: '#64B5F6' },
          { id: 'directionY', dataType: 'number', color: '#64B5F6' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'detectedEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            sourceEntity: 'self',
            targetEntity: '',
            targetTag: 'player',
            radius: 200
          },
          code:
`const srcId = inputs.sourceEntity || 'self';
const source = context.assert.exists(context.entity.get(srcId), 'Source entity must exist');
const st = source.components && (source.components.Transform || source.components.UITransform);
const sx = st && typeof st.x === 'number' ? st.x : 0;
const sy = st && typeof st.y === 'number' ? st.y : 0;

let target = false;
const targetId = inputs.targetEntity;
if (targetId) {
  target = context.entity.get(targetId);
}
if (!target && inputs.targetTag) {
  target = context.entity.findClosestByTag(inputs.targetTag, source);
}

if (!target) {
  outputs.inRange = false;
  outputs.distance = 999999;
  outputs.directionX = 0;
  outputs.directionY = 0;
  outputs.facingDirection = '';
  outputs.detectedEntity = '';
  outputs.execOut = true;
  return;
}

const tt = target.components && (target.components.Transform || target.components.UITransform);
const tx = tt && typeof tt.x === 'number' ? tt.x : 0;
const ty = tt && typeof tt.y === 'number' ? tt.y : 0;
const dx = tx - sx;
const dy = ty - sy;
const dist = Math.sqrt(dx * dx + dy * dy);
const radius = Math.max(0, Number(inputs.radius) || 200);
const isInside = dist <= radius;

const dirX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
const dirY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
let facing = 'right';
if (Math.abs(dx) >= Math.abs(dy)) {
  facing = dx < 0 ? 'left' : 'right';
} else {
  facing = dy < 0 ? 'up' : 'down';
}

outputs.inRange = isInside;
outputs.distance = Math.round(dist * 100) / 100;
outputs.directionX = dirX;
outputs.directionY = dirY;
outputs.facingDirection = facing;
outputs.detectedEntity = target.id || target.scriptId || '';

const stateKey = '_prox_' + (source.id || srcId);
const wasInside = Boolean(context.state[stateKey]);
context.state[stateKey] = isInside;

if (isInside && !wasInside) {
  outputs.onDetected = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onDetected');
}
if (!isInside && wasInside) {
  outputs.onLost = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onLost');
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'pingPongStepper',
      label: 'Ping Pong Stepper',
      description: 'Steps an entity position or value back and forth between min and max limits, triggering onBounce.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Ping Pong Stepper',
          headerColor: '#FF8F00',
          category: 'Enemy & AI'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'currentPos', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'minPos', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'maxPos', dataType: 'number', color: '#64B5F6', defaultValue: 200 },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 2 },
          { id: 'direction', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'axis', dataType: 'string', color: '#F48FB1', defaultValue: 'x' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onBounce', dataType: 'execution', color: '#FFFFFF' },
          { id: 'nextPos', dataType: 'number', color: '#64B5F6' },
          { id: 'nextDirection', dataType: 'number', color: '#64B5F6' },
          { id: 'isAtBoundary', dataType: 'boolean', color: '#81C784' }
        ],
        data: {
          values: {
            currentPos: 0,
            minPos: 0,
            maxPos: 200,
            speed: 2,
            direction: 1,
            targetEntity: '',
            axis: 'x'
          },
          options: {
            axis: [
              { label: 'X Axis (Horizontal)', value: 'x' },
              { label: 'Y Axis (Vertical)', value: 'y' }
            ]
          },
          code:
`let pos = Number(inputs.currentPos) || 0;
let entity = false;
if (inputs.targetEntity) {
  entity = context.entity.get(inputs.targetEntity);
  if (entity && entity.components && entity.components.Transform) {
    pos = inputs.axis === 'y' ? entity.components.Transform.y : entity.components.Transform.x;
  }
}
const min = Number(inputs.minPos) || 0;
const max = Number(inputs.maxPos) || 100;
let dir = Number(inputs.direction);
if (dir === 0 || isNaN(dir)) dir = 1;
dir = dir > 0 ? 1 : -1;
const spd = Math.abs(Number(inputs.speed) || 1);

let next = pos + dir * spd;
let bounced = false;

if (next >= max) {
  next = max;
  dir = -1;
  bounced = true;
} else if (next <= min) {
  next = min;
  dir = 1;
  bounced = true;
}

if (entity && entity.components && entity.components.Transform) {
  if (inputs.axis === 'y') {
    entity.components.Transform.y = next;
  } else {
    entity.components.Transform.x = next;
  }
}

outputs.nextPos = next;
outputs.nextDirection = dir;
outputs.isAtBoundary = bounced;

if (bounced) {
  outputs.onBounce = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onBounce');
}
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};

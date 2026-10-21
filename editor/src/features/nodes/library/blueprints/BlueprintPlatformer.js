import { Gamepad2 } from 'lucide-vue-next';

export const BlueprintPlatformer = {
  id: 'platformer_tool',
  label: 'Platformer Kit',
  color: '#2E7D32',
  icon: Gamepad2,
  items: [
    {
      type: 'platformerController',
      label: 'Platformer Controller',
      description: 'All-in-one platformer movement helper (Left, Right, Jump, Drop-Through Platform, Land Detection).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Platformer Controller',
          headerColor: '#2E7D32',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 260 },
          { id: 'jumpForce', dataType: 'number', color: '#64B5F6', defaultValue: 520 },
          { id: 'keyLeft', dataType: 'string', color: '#F48FB1', defaultValue: 'a' },
          { id: 'keyRight', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'keyJump', dataType: 'string', color: '#F48FB1', defaultValue: 'space' },
          { id: 'keyDown', dataType: 'string', color: '#F48FB1', defaultValue: 's' },
          { id: 'oneWayTag', dataType: 'string', color: '#F48FB1', defaultValue: 'platform' },
          { id: 'dropNudge', dataType: 'number', color: '#64B5F6', defaultValue: 6 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onJump', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onLand', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onDrop', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isGrounded', dataType: 'boolean', color: '#81C784' },
          { id: 'isGroundedOnOneWay', dataType: 'boolean', color: '#81C784' },
          { id: 'groundType', dataType: 'string', color: '#F48FB1' },
          { id: 'movementState', dataType: 'string', color: '#F48FB1' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'velocityX', dataType: 'number', color: '#64B5F6' },
          { id: 'velocityY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            speed: 260,
            jumpForce: 520,
            keyLeft: 'a',
            keyRight: 'd',
            keyJump: 'space',
            keyDown: 's',
            oneWayTag: 'platform',
            dropNudge: 6
          },
          code: 
`const targetEntity = inputs.targetEntity;
const speed = inputs.speed;
const jumpForce = inputs.jumpForce;
const keyLeft = inputs.keyLeft;
const keyRight = inputs.keyRight;
const keyJump = inputs.keyJump;
const keyDown = inputs.keyDown;
const oneWayTag = inputs.oneWayTag;
const dropNudge = inputs.dropNudge;

const helper = context.toolkit && context.toolkit.platformer;
if (helper) {
  const res = helper.processController({
    targetEntity,
    speed,
    jumpForce,
    keyLeft,
    keyRight,
    keyJump,
    keyDown,
    oneWayTag,
    dropNudge
  }, context);
  outputs.isGrounded = res.isGrounded;
  outputs.isGroundedOnOneWay = res.isGroundedOnOneWay;
  outputs.groundType = res.groundType;
  outputs.movementState = res.movementState;
  outputs.facingDirection = res.facingDirection;
  outputs.velocityX = res.velocityX;
  outputs.velocityY = res.velocityY;
  outputs.onJump = res.onJump;
  outputs.onLand = res.onLand;
  outputs.onDrop = res.onDrop;
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'platformerAnimator',
      label: 'Platformer Animator',
      description: 'Smart platformer animator helper (idle, run, jump, fall, auto left/right orientation and auto-flip).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Platformer Animator',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'idleClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'walkClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'runClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'jumpClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'fallClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'hitClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'isHit', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'movementState', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'autoFlipX', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onClipChanged', dataType: 'execution', color: '#FFFFFF' },
          { id: 'currentClip', dataType: 'string', color: '#F48FB1' },
          { id: 'activeState', dataType: 'string', color: '#F48FB1' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'isFlipped', dataType: 'boolean', color: '#81C784' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            idleClips: '',
            walkClips: '',
            runClips: '',
            jumpClips: '',
            fallClips: '',
            hitClips: '',
            isHit: false,
            movementState: '',
            facingDirection: '',
            autoFlipX: true
          },
          code: 
`const targetEntity = inputs.targetEntity;
const idleClips = inputs.idleClips;
const walkClips = inputs.walkClips;
const runClips = inputs.runClips;
const jumpClips = inputs.jumpClips;
const fallClips = inputs.fallClips;
const hitClips = inputs.hitClips;
const isHit = inputs.isHit;
const movementState = inputs.movementState;
const facingDirection = inputs.facingDirection;
const autoFlipX = inputs.autoFlipX;

const helper = context.toolkit && context.toolkit.platformer;
if (helper) {
  const res = helper.processAnimator(context.state, inputs, outputs, context);
  outputs.currentClip = res.currentClip;
  outputs.activeState = res.activeState;
  outputs.facingDirection = res.facingDirection;
  outputs.isFlipped = res.isFlipped;
  outputs.onClipChanged = res.onClipChanged;
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'platformerCombat',
      label: 'Platformer Combat',
      description: 'Robust melee combo attack manager with buffer window, cooldowns, and automatic hitbox overlaps.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Platformer Combat',
          headerColor: '#D32F2F',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'triggerAttack', dataType: 'boolean', color: '#81C784', defaultValue: false },
          { id: 'keyAttack', dataType: 'string', color: '#F48FB1', defaultValue: 'j' },
          { id: 'targetTag', dataType: 'string', color: '#F48FB1', defaultValue: 'enemy' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'isGrounded', dataType: 'boolean', color: '#81C784', defaultValue: true },
          { id: 'attacksConfig', dataType: 'map', color: '#FF8A65' },
          { id: 'attackCooldown', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'comboBufferTime', dataType: 'number', color: '#64B5F6', defaultValue: 0.35 },
          { id: 'autoLockMovement', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackStart', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHitboxActive', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isAttacking', dataType: 'boolean', color: '#81C784' },
          { id: 'canMove', dataType: 'boolean', color: '#81C784' },
          { id: 'isCoolingDown', dataType: 'boolean', color: '#81C784' },
          { id: 'cooldownRemaining', dataType: 'number', color: '#64B5F6' },
          { id: 'currentCombo', dataType: 'number', color: '#64B5F6' },
          { id: 'currentClip', dataType: 'string', color: '#F48FB1' },
          { id: 'hitTarget', dataType: 'string', color: '#F48FB1' },
          { id: 'damage', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            triggerAttack: false,
            keyAttack: 'j',
            targetTag: 'enemy',
            facingDirection: '',
            isGrounded: true,
            attackCooldown: 0,
            comboBufferTime: 0.35,
            autoLockMovement: true,
            attacksConfig: {
              ground: [
                {
                  clip: 'attack1',
                  startFrame: 1,
                  endFrame: 3,
                  hitbox: { offsetX: 32, offsetY: 0, width: 40, height: 32 },
                  damage: 10,
                  knockbackX: 150,
                  knockbackY: -50,
                  forwardStep: 20
                },
                {
                  clip: 'attack2',
                  startFrame: 2,
                  endFrame: 4,
                  hitbox: { offsetX: 36, offsetY: 0, width: 44, height: 32 },
                  damage: 15,
                  knockbackX: 250,
                  knockbackY: -80,
                  forwardStep: 30
                }
              ],
              air: [
                {
                  clip: 'airAttack',
                  startFrame: 1,
                  endFrame: 4,
                  hitbox: { offsetX: 25, offsetY: 5, width: 44, height: 44 },
                  damage: 12,
                  knockbackX: 120,
                  knockbackY: 80,
                  forwardStep: 0
                }
              ]
            }
          },
          code: 
`const targetEntity = inputs.targetEntity;
const triggerAttack = inputs.triggerAttack;
const keyAttack = inputs.keyAttack;
const targetTag = inputs.targetTag;
const facingDirection = inputs.facingDirection;
const isGrounded = inputs.isGrounded;
const attacksConfig = inputs.attacksConfig;
const attackCooldown = inputs.attackCooldown;
const comboBufferTime = inputs.comboBufferTime;
const autoLockMovement = inputs.autoLockMovement;

const helper = context.toolkit && context.toolkit.combat;
if (helper) {
  const res = helper.processPlatformerCombat(context.state, inputs, outputs, context);
  outputs.isAttacking = res.isAttacking;
  outputs.canMove = res.canMove;
  outputs.isCoolingDown = res.isCoolingDown;
  outputs.cooldownRemaining = res.cooldownRemaining;
  outputs.currentCombo = res.currentCombo;
  outputs.currentClip = res.currentClip;
  outputs.hitTarget = res.hitTarget;
  outputs.damage = res.damage;
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
  ]
};

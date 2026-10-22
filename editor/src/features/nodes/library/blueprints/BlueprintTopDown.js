import { Compass } from 'lucide-vue-next';

export const BlueprintTopDown = {
  id: 'topdown_tool',
  label: 'Top-Down Kit',
  color: '#00897B',
  icon: Compass,
  items: [
    {
      type: 'topDownController',
      label: 'Top-Down Controller',
      description: 'Keyboard-driven top-down movement controller with diagonal normalization, sprint, and direction facing.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Top-Down Controller',
          headerColor: '#00897B',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 200 },
          { id: 'sprintMultiplier', dataType: 'number', color: '#64B5F6', defaultValue: 1.5 },
          { id: 'keyUp', dataType: 'string', color: '#F48FB1', defaultValue: 'w' },
          { id: 'keyDown', dataType: 'string', color: '#F48FB1', defaultValue: 's' },
          { id: 'keyLeft', dataType: 'string', color: '#F48FB1', defaultValue: 'a' },
          { id: 'keyRight', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'keySprint', dataType: 'string', color: '#F48FB1', defaultValue: 'shift' },
          { id: 'normalizeDiagonal', dataType: 'boolean', color: '#81C784', defaultValue: true },
          { id: 'faceMouse', dataType: 'boolean', color: '#81C784', defaultValue: false }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onMove', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onStop', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onSprint', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isMoving', dataType: 'boolean', color: '#81C784' },
          { id: 'isSprinting', dataType: 'boolean', color: '#81C784' },
          { id: 'movementState', dataType: 'string', color: '#F48FB1' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'facingAngle', dataType: 'number', color: '#64B5F6' },
          { id: 'velocityX', dataType: 'number', color: '#64B5F6' },
          { id: 'velocityY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            speed: 200,
            sprintMultiplier: 1.5,
            keyUp: 'w',
            keyDown: 's',
            keyLeft: 'a',
            keyRight: 'd',
            keySprint: 'shift',
            normalizeDiagonal: true,
            faceMouse: false
          },
          code:
`const targetEntity = inputs.targetEntity;
const speed = inputs.speed;
const sprintMultiplier = inputs.sprintMultiplier;
const keyUp = inputs.keyUp;
const keyDown = inputs.keyDown;
const keyLeft = inputs.keyLeft;
const keyRight = inputs.keyRight;
const keySprint = inputs.keySprint;
const normalizeDiagonal = inputs.normalizeDiagonal;
const faceMouse = inputs.faceMouse;

const helper = context.toolkit && context.toolkit.topdown;
if (helper) {
  const res = helper.processController({
    targetEntity,
    speed,
    sprintMultiplier,
    keyUp,
    keyDown,
    keyLeft,
    keyRight,
    keySprint,
    normalizeDiagonal,
    faceMouse
  }, context);
  outputs.isMoving = res.isMoving;
  outputs.isSprinting = res.isSprinting;
  outputs.movementState = res.movementState;
  outputs.facingDirection = res.facingDirection;
  outputs.facingAngle = res.facingAngle;
  outputs.velocityX = res.velocityX;
  outputs.velocityY = res.velocityY;
  outputs.onMove = res.onMove;
  outputs.onStop = res.onStop;
  outputs.onSprint = res.onSprint;
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'topDownAnimator',
      label: 'Top-Down Animator',
      description: 'Smart 4-way, 8-way, and angle-based animator helper for top-down characters.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Top-Down Animator',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'movementState', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'facingAngle', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'idleClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'walkClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'runClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'hitClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'isHit', dataType: 'boolean', color: '#81C784', defaultValue: false },
          { id: 'directionMode', dataType: 'string', color: '#F48FB1', defaultValue: '4way' },
          { id: 'autoFlipX', dataType: 'boolean', color: '#81C784', defaultValue: true }
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
            movementState: '',
            facingDirection: '',
            facingAngle: 0,
            idleClips: '',
            walkClips: '',
            runClips: '',
            hitClips: '',
            isHit: false,
            directionMode: '4way',
            autoFlipX: true
          },
          options: {
            directionMode: [
              { label: '4-Way (Cardinal)', value: '4way' },
              { label: '8-Way (Cardinal + Diagonals)', value: '8way' },
              { label: 'Rotation (Angle-Based)', value: 'rotation' }
            ]
          },
          code:
`const targetEntity = inputs.targetEntity;
const movementState = inputs.movementState;
const facingDirection = inputs.facingDirection;
const facingAngle = inputs.facingAngle;
const idleClips = inputs.idleClips;
const walkClips = inputs.walkClips;
const runClips = inputs.runClips;
const hitClips = inputs.hitClips;
const isHit = inputs.isHit;
const directionMode = inputs.directionMode;
const autoFlipX = inputs.autoFlipX;

const helper = context.toolkit && context.toolkit.topdown;
if (helper) {
  const res = helper.processAnimator(context.state, {
    targetEntity,
    movementState,
    facingDirection,
    facingAngle,
    idleClips,
    walkClips,
    runClips,
    hitClips,
    isHit,
    directionMode,
    autoFlipX
  }, outputs, context);
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
    }
  ]
};

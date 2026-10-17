import { Activity } from 'lucide-vue-next';

export const BlueprintPhysics = {
  id: 'game_physics',
  label: 'Physics & Collision',
  color: '#8BC34A',
  icon: Activity,
  items: [
{
      type: 'moveAndSlide',
      label: 'Move and Slide',
      description: 'Move character with collision handling (For Kinematic Bodies)',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Move and Slide',
          headerColor: '#2E7D32',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'velocityX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'velocityY', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            velocityX: 0,
            velocityY: 0
          },
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const phys = entity.components && entity.components.Physics;

if (phys && phys.isFrozen) {
  outputs.execOut = true;
  return;
}

const velX = inputs.velocityX;
const velY = inputs.velocityY;
const dt = context.dt;
const hasPhysics = phys && phys.enabled;

if (hasPhysics) {
  phys.velocityX = velX;
  if (phys.gravityScale === 0 || velY !== 0) {
    phys.velocityY = velY;
  }
  phys._isIntentionalMove = Math.abs(velX) > 10 || Math.abs(velY) > 10;
} else {
  const moveX = velX * dt;
  const moveY = velY * dt;
  context.collider.moveAndSlide(entity, moveX, moveY);
}

outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'solidCollision',
      label: 'Solid Collision',
      description: 'Check if an object is hitting a solid wall or obstacle.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Solid Collision',
          headerColor: '#D32F2F',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isColliding', dataType: 'boolean', color: '#E57373' },
          { id: 'selfEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'otherEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            tag: ''
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity));
let hitObject = context.collider.checkSolid(entity);

if (hitObject && inputs.tag && inputs.tag.trim() !== '') {
  const objTag = hitObject.tag || (hitObject.components && hitObject.components.Tags && hitObject.components.Tags.value);
  if (objTag !== inputs.tag) {
    hitObject = null;
  }
}

const selfScriptId = entity.scriptId;
const hitScriptId = hitObject ? hitObject.scriptId : '';
const isColliding = Boolean(hitObject);

outputs.selfEntity = selfScriptId;
outputs.otherEntity = hitScriptId;
outputs.isColliding = isColliding;
outputs.execOut = true;

if (isColliding) {
  outputs.onHit = true;
}
return;`
        }
      }
    },
{
      type: 'triggerZone',
      label: 'Trigger Zone',
      description: 'Detects when an object enters, stays, or exits an area.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Trigger Zone',
          headerColor: '#0097A7',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onEnter', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onExit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isInside', dataType: 'boolean', color: '#E57373' },
          { id: 'selfEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'otherEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            tag: ''
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity));

if (!context.state.triggerStates) {
  context.state.triggerStates = {};
}

const entityScriptId = entity.scriptId;
let myState = context.state.triggerStates[entityScriptId];
if (!myState) {
  myState = { isOverlapping: false, lastId: '' };
  context.state.triggerStates[entityScriptId] = myState;
}

const overlapObject = context.collider.checkOverlap(entity, inputs.tag);

const currentId = overlapObject ? overlapObject.scriptId : '';

const previousId = myState.lastId;
const isCurrentlyOverlapping = Boolean(currentId);

outputs.selfEntity = entityScriptId;
outputs.otherEntity = currentId || previousId;
outputs.isInside = isCurrentlyOverlapping;

if (!previousId && currentId) {
  myState.lastId = currentId;
  outputs.onEnter = true;
} else if (previousId && currentId && previousId !== currentId) {
  myState.lastId = currentId;
  outputs.onEnter = true;
} else if (previousId && !currentId) {
  myState.lastId = '';
  outputs.otherEntity = previousId;
  outputs.isInside = false;
  outputs.onExit = true;
}

myState.isOverlapping = isCurrentlyOverlapping;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getPhysics',
      label: 'Get Physics Info',
      description: 'Get physics component properties like Velocity, Grounded, Mass, etc.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Physics',
          headerColor: '#2E7D32',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            targetEntity: 'self'
          },
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#64B5F6' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#64B5F6' },
            { value: 'isGrounded', label: 'Is Grounded', type: 'boolean', color: '#E57373' },
            { value: 'movementState', label: 'Movement State', type: 'string', color: '#F48FB1' },
            { value: 'facingDirection', label: 'Facing Direction', type: 'string', color: '#F48FB1' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#64B5F6' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#64B5F6' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#64B5F6' },
            { value: 'enabled', label: 'Enabled', type: 'boolean', color: '#E57373' },
            { value: 'isFrozen', label: 'Is Frozen', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const phys = context.assert.hasComponent(entity, 'Physics');

outputs.velocityX = phys.velocityX;
outputs.velocityY = phys.velocityY;
outputs.isGrounded = phys.isGrounded;
outputs.movementState = phys.movementState;
outputs.facingDirection = phys.facingDirection;
outputs.mass = phys.mass;
outputs.gravityScale = phys.gravityScale;
outputs.drag = phys.drag;
outputs.enabled = phys.enabled;
outputs.isFrozen = phys.isFrozen;
return;`
        }
      }
    },
{
      type: 'setPhysics',
      label: 'Set Physics Info',
      description: 'Set physics component properties like Velocity, Mass, etc.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Physics',
          headerColor: '#2E7D32',
          category: 'Physics & Collision'
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
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#64B5F6' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#64B5F6' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#64B5F6' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#64B5F6' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#64B5F6' },
            { value: 'enabled', label: 'Enabled', type: 'boolean', color: '#E57373' },
            { value: 'isFrozen', label: 'Is Frozen', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const phys = context.assert.hasComponent(entity, 'Physics');

const numericKeys = ['velocityX', 'velocityY', 'mass', 'gravityScale', 'drag'];
for (const key of numericKeys) {
  if (key in inputs && inputs[key] !== '' && !Number.isNaN(Number(inputs[key]))) {
    phys[key] = Number(inputs[key]);
  }
}

if ('velocityX' in inputs && inputs.velocityX !== '' && !Number.isNaN(Number(inputs.velocityX))) {
  phys._isIntentionalMove = Math.abs(Number(inputs.velocityX)) > 10;
}
if ('velocityY' in inputs && inputs.velocityY !== '' && !Number.isNaN(Number(inputs.velocityY))) {
  phys._isIntentionalMove = Math.abs(Number(inputs.velocityY)) > 10;
}
if ('enabled' in inputs && inputs.enabled !== '') {
  phys.enabled = Boolean(inputs.enabled);
}
if ('isFrozen' in inputs && inputs.isFrozen !== '') {
  phys.isFrozen = Boolean(inputs.isFrozen);
}

outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'setFaceDirection',
      label: 'Set Face Direction',
      description: 'Automatically sets the entity facing direction based on 2D Axis inputs',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Face Direction',
          headerColor: '#2E7D32',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'axisX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'axisY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'mode', dataType: 'string', color: '#F48FB1', defaultValue: 'horizontal' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            axisX: 0,
            axisY: 0,
            mode: 'horizontal'
          },
          options: {
            mode: [
              { label: 'Horizontal Only', value: 'horizontal' },
              { label: 'Vertical Only', value: 'vertical' },
              { label: '4-Direction (Top/Side)', value: '4-way' },
              { label: '8-Direction (Diagonal)', value: '8-way' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const target = context.assert.exists(context.entity.get(targetId));
const phys = context.assert.hasComponent(target, 'Physics');
const axisX = inputs.axisX;
const axisY = inputs.axisY;
const mode = inputs.mode;

phys.customFacing = true;

if (mode === 'horizontal') {
  if (axisX > 0) phys.facingDirection = 'right';
  else if (axisX < 0) phys.facingDirection = 'left';
} else if (mode === 'vertical') {
  if (axisY > 0) phys.facingDirection = 'down';
  else if (axisY < 0) phys.facingDirection = 'up';
} else if (mode === '4-way') {
  if (Math.abs(axisX) > Math.abs(axisY)) {
    phys.facingDirection = axisX > 0 ? 'right' : 'left';
  } else if (Math.abs(axisY) > 0) {
    phys.facingDirection = axisY > 0 ? 'down' : 'up';
  }
} else if (mode === '8-way') {
  if (axisX > 0 && axisY < 0) phys.facingDirection = 'up-right';
  else if (axisX > 0 && axisY > 0) phys.facingDirection = 'down-right';
  else if (axisX < 0 && axisY < 0) phys.facingDirection = 'up-left';
  else if (axisX < 0 && axisY > 0) phys.facingDirection = 'down-left';
  else if (axisX > 0) phys.facingDirection = 'right';
  else if (axisX < 0) phys.facingDirection = 'left';
  else if (axisY < 0) phys.facingDirection = 'up';
  else if (axisY > 0) phys.facingDirection = 'down';
}

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};

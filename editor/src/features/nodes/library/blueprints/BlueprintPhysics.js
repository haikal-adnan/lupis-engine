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
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isColliding', dataType: 'boolean', color: '#E57373' },
          { id: 'hitX', dataType: 'boolean', color: '#E57373' },
          { id: 'hitY', dataType: 'boolean', color: '#E57373' },
          { id: 'isGrounded', dataType: 'boolean', color: '#81C784' },
          { id: 'realVelocityX', dataType: 'number', color: '#64B5F6' },
          { id: 'realVelocityY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            velocityX: 0,
            velocityY: 0
          },
          code: 
`const targetId = inputs.targetEntity || 'self';
const entity = context.assert.exists(context.entity.get(targetId));
const phys = entity.components && entity.components.Physics;

if (phys && phys.isFrozen) {
  outputs.execOut = true;
  outputs.isColliding = false;
  outputs.hitX = false;
  outputs.hitY = false;
  outputs.isGrounded = Boolean(phys.isGrounded);
  outputs.realVelocityX = 0;
  outputs.realVelocityY = 0;
  return;
}

const velX = Number(inputs.velocityX) || 0;
const velY = Number(inputs.velocityY) || 0;
const dt = Number(context.dt || context.deltaTime || 0.016);
const hasPhysics = Boolean(phys && phys.enabled);

if (hasPhysics) {
  phys.velocityX = velX;
  if (phys.gravityScale === 0 || velY !== 0) {
    phys.velocityY = velY;
  }
  phys._isIntentionalMove = Math.abs(velX) > 10 || Math.abs(velY) > 10;

  outputs.isGrounded = Boolean(phys.isGrounded);
  outputs.isColliding = Boolean(phys.collisionInfo && phys.collisionInfo.hitSolid);
  outputs.hitX = Boolean(phys.collisionInfo && phys.collisionInfo.hitSolidX);
  outputs.hitY = Boolean(phys.collisionInfo && phys.collisionInfo.hitSolidY);
  outputs.realVelocityX = phys.velocityX;
  outputs.realVelocityY = phys.velocityY;
} else {
  const moveX = velX * dt;
  const moveY = velY * dt;
  const hitResult = context.collider.moveAndSlide(entity, moveX, moveY);

  const hasHit = Boolean(hitResult);
  outputs.isColliding = hasHit;
  outputs.hitX = Boolean(hitResult && hitResult.x);
  outputs.hitY = Boolean(hitResult && hitResult.y);
  outputs.isGrounded = Boolean(hitResult && hitResult.y && moveY >= 0);
  outputs.realVelocityX = hitResult && hitResult.x ? 0 : velX;
  outputs.realVelocityY = hitResult && hitResult.y ? 0 : velY;
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
  const targetLower = inputs.tag.trim().toLowerCase();
  const match = typeof hitObject.hasTag === 'function' ? hitObject.hasTag(targetLower) : (Array.isArray(hitObject.tags) ? hitObject.tags.some(t => String(t).trim().toLowerCase() === targetLower) : String(hitObject.tag || (hitObject.components && hitObject.components.Tags && hitObject.components.Tags.value) || '').trim().toLowerCase() === targetLower);
  if (!match) {
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
,
    {
      type: 'applyKnockback',
      label: 'Apply Knockback',
      description: 'Applies impulse knockback force to an entity with deceleration friction over time.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Apply Knockback',
          headerColor: '#EF5350',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'forceX', dataType: 'number', color: '#64B5F6', defaultValue: 200 },
          { id: 'forceY', dataType: 'number', color: '#64B5F6', defaultValue: -100 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 300 },
          { id: 'friction', dataType: 'number', color: '#64B5F6', defaultValue: 0.9 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onFinished', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isKnocked', dataType: 'boolean', color: '#81C784' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            forceX: 200,
            forceY: -100,
            duration: 300,
            friction: 0.9
          },
          code:
`const targetId = inputs.targetEntity || 'self';
const entity = context.assert.exists(context.entity.get(targetId));
const phys = entity.components && entity.components.Physics;

const forceX = Number(inputs.forceX) || 0;
const forceY = Number(inputs.forceY) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 300 : Math.max(0, rawDuration);
const friction = Number(inputs.friction) || 0.9;

if (phys) {
  phys.velocityX = forceX;
  phys.velocityY = forceY;
  phys._knockbackActive = true;
}

outputs.isKnocked = true;
outputs.execOut = true;

if (duration <= 0) {
  outputs.isKnocked = false;
  outputs.onFinished = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFinished');
  return;
}

context.state.knockbackRemaining = duration;
context.state.knockbackVx = forceX;
context.state.knockbackVy = forceY;
context.state.isKnocked = true;

if (typeof context.onTick === 'function') {
  context.onTick((dt) => {
    if (!context.state.isKnocked) return;
    const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
    const deltaMs = deltaSec * 1000;
    context.state.knockbackRemaining -= deltaMs;
    context.state.knockbackVx *= friction;
    context.state.knockbackVy *= friction;

    if (phys) {
      phys.velocityX = context.state.knockbackVx;
      phys.velocityY = context.state.knockbackVy;
    }

    if (context.state.knockbackRemaining <= 0) {
      context.state.isKnocked = false;
      if (phys) {
        phys._knockbackActive = false;
      }
      outputs.isKnocked = false;
      outputs.onFinished = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onFinished');
    }
  });
}
return;`
        }
      }
    },
    {
      type: 'raycast2D',
      label: 'Raycast 2D',
      description: 'Projects a 2D ray in a direction to detect obstacles, colliders, or entities with line of sight.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Raycast 2D',
          headerColor: '#26A69A',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sourceEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'useEntityOrigin', dataType: 'boolean', color: '#E57373', defaultValue: true },
          { id: 'originX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'originY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'dirX', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'dirY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'distance', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'stepSize', dataType: 'number', color: '#64B5F6', defaultValue: 8 },
          { id: 'targetTag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onMiss', dataType: 'execution', color: '#FFFFFF' },
          { id: 'hasHit', dataType: 'boolean', color: '#81C784' },
          { id: 'hitX', dataType: 'number', color: '#64B5F6' },
          { id: 'hitY', dataType: 'number', color: '#64B5F6' },
          { id: 'hitDistance', dataType: 'number', color: '#64B5F6' },
          { id: 'hitEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            sourceEntity: 'self',
            useEntityOrigin: true,
            originX: 0,
            originY: 0,
            dirX: 1,
            dirY: 0,
            distance: 100,
            stepSize: 8,
            targetTag: ''
          },
          code:
`const srcId = inputs.sourceEntity || 'self';
const source = (context.entity && typeof context.entity.get === 'function') ? context.entity.get(srcId) : false;
let startX = Number(inputs.originX) || 0;
let startY = Number(inputs.originY) || 0;

if (inputs.useEntityOrigin && source) {
  const tr = source.components && (source.components.Transform || source.components.UITransform);
  if (tr) {
    startX += (typeof tr.x === 'number' ? tr.x : 0);
    startY += (typeof tr.y === 'number' ? tr.y : 0);
  }
}

const rawDx = Number(inputs.dirX) || 0;
const rawDy = Number(inputs.dirY) || 0;
const len = Math.sqrt(rawDx * rawDx + rawDy * rawDy) || 1;
const ndx = rawDx / len;
const ndy = rawDy / len;

const maxDist = Math.max(0, Number(inputs.distance) || 100);
const step = Math.max(1, Number(inputs.stepSize) || 8);
const filterTag = String(inputs.targetTag || '').trim();

let candidates = [];
if (filterTag && context.entity && typeof context.entity.getAllByTag === 'function') {
  candidates = context.entity.getAllByTag(filterTag);
} else if (context.entity && typeof context.entity.getAll === 'function') {
  candidates = context.entity.getAll();
}

let hitFound = false;
let hitDist = maxDist;
let hitPx = startX + ndx * maxDist;
let hitPy = startY + ndy * maxDist;
let hitTarget = '';

for (let d = 0; d <= maxDist; d += step) {
  const px = startX + ndx * d;
  const py = startY + ndy * d;

  for (let i = 0; i < candidates.length; i++) {
    const other = candidates[i];
    if (other.active === false) continue;
    if (source && (other === source || (source.id && other.id === source.id))) continue;
    if (filterTag) {
      const targetLower = String(filterTag).trim().toLowerCase();
      const match = typeof other.hasTag === 'function' ? other.hasTag(targetLower) : (Array.isArray(other.tags) ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower) : String(other.tag || (other.components && other.components.Tags && other.components.Tags.value) || '').trim().toLowerCase() === targetLower);
      if (!match) continue;
    }

    const t = other.components && (other.components.Transform || other.components.UITransform);
    if (!t) continue;

    const shapes = other.components && other.components.Collider && Array.isArray(other.components.Collider.data) ? other.components.Collider.data : false;
    let inside = false;

    if (shapes && shapes.length > 0) {
      for (let s = 0; s < shapes.length; s++) {
        const shape = shapes[s];
        if (!shape.enabled) continue;
        const bw = shape.width || t.width || 32;
        const bh = shape.height || t.height || 32;
        const bx = (t.x || 0) + (shape.offsetX || 0) - bw * 0.5;
        const by = (t.y || 0) + (shape.offsetY || 0) - bh * 0.5;
        if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
          inside = true;
          break;
        }
      }
    } else {
      const bw = t.width || 32;
      const bh = t.height || 32;
      const bx = (t.x || 0) - bw * 0.5;
      const by = (t.y || 0) - bh * 0.5;
      if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
        inside = true;
      }
    }

    if (inside) {
      hitFound = true;
      hitDist = d;
      hitPx = px;
      hitPy = py;
      hitTarget = other.id || other.scriptId || '';
      break;
    }
  }

  if (hitFound) break;
}

outputs.hasHit = hitFound;
outputs.hitX = Number(hitPx.toFixed(2));
outputs.hitY = Number(hitPy.toFixed(2));
outputs.hitDistance = Number(hitDist.toFixed(2));
outputs.hitEntity = hitTarget;

if (hitFound) {
  outputs.onHit = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onHit');
} else {
  outputs.onMiss = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onMiss');
}

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'manageCollider',
      label: 'Manage Collider',
      description: 'Dynamically modify, add, remove, or toggle entity colliders and shapes.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Manage Collider',
          headerColor: '#689F38',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'operation', dataType: 'string', color: '#F48FB1', defaultValue: 'modify' },
          { id: 'shapeId', dataType: 'string', color: '#F48FB1', defaultValue: 'default' },
          { id: 'shapeType', dataType: 'string', color: '#F48FB1', defaultValue: 'box' },
          { id: 'offsetX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'offsetY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'width', dataType: 'number', color: '#64B5F6', defaultValue: 32 },
          { id: 'height', dataType: 'number', color: '#64B5F6', defaultValue: 32 },
          { id: 'isTrigger', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'enabled', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'success', dataType: 'boolean', color: '#81C784' },
          { id: 'shapeCount', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            operation: 'modify',
            shapeId: 'default',
            shapeType: 'box',
            offsetX: 0,
            offsetY: 0,
            width: 32,
            height: 32,
            isTrigger: false,
            enabled: true
          },
          options: {
            operation: [
              { label: 'Modify Shape', value: 'modify' },
              { label: 'Add Shape', value: 'add' },
              { label: 'Remove Shape', value: 'remove' },
              { label: 'Toggle Collider', value: 'toggle' }
            ],
            shapeType: [
              { label: 'Box / Rectangle', value: 'box' },
              { label: 'Circle', value: 'circle' }
            ]
          },
          code:
`const targetId = inputs.targetEntity || 'self';
const entity = context.assert.exists(context.entity.get(targetId));

if (!entity.components) {
  entity.components = {};
}
if (!entity.components.Collider) {
  entity.components.Collider = { enabled: true, data: [] };
}
if (!Array.isArray(entity.components.Collider.data)) {
  entity.components.Collider.data = [];
}

const colComp = entity.components.Collider;
const op = String(inputs.operation || 'modify').toLowerCase();
const rawShapeId = inputs.shapeId;
const sId = typeof rawShapeId === 'string' ? rawShapeId.trim() : '';
let success = false;

if (op === 'add') {
  const newShape = {
    id: sId || ('shape_' + Date.now()),
    scriptId: sId || 'shape',
    type: inputs.shapeType || 'box',
    offsetX: Number(inputs.offsetX) || 0,
    offsetY: Number(inputs.offsetY) || 0,
    width: Number(inputs.width) || 32,
    height: Number(inputs.height) || 32,
    radius: (Number(inputs.width) || 32) / 2,
    isTrigger: Boolean(inputs.isTrigger),
    enabled: typeof inputs.enabled === 'boolean' ? inputs.enabled : true,
    autoFit: false
  };
  colComp.data.push(newShape);
  success = true;
} else if (op === 'remove') {
  const prevCount = colComp.data.length;
  if (sId) {
    colComp.data = colComp.data.filter(s => s.id !== sId && s.scriptId !== sId);
  } else {
    colComp.data.pop();
  }
  success = colComp.data.length < prevCount;
} else if (op === 'modify') {
  let targetShape = false;
  if (sId) {
    for (let i = 0; i < colComp.data.length; i++) {
      if (colComp.data[i].id === sId || colComp.data[i].scriptId === sId) {
        targetShape = colComp.data[i];
        break;
      }
    }
  }
  if (!targetShape && colComp.data.length > 0) {
    targetShape = colComp.data[0];
  }
  if (targetShape) {
    if (typeof inputs.width === 'number' && !isNaN(inputs.width)) targetShape.width = inputs.width;
    if (typeof inputs.height === 'number' && !isNaN(inputs.height)) targetShape.height = inputs.height;
    if (typeof inputs.offsetX === 'number' && !isNaN(inputs.offsetX)) targetShape.offsetX = inputs.offsetX;
    if (typeof inputs.offsetY === 'number' && !isNaN(inputs.offsetY)) targetShape.offsetY = inputs.offsetY;
    if (inputs.shapeType) targetShape.type = inputs.shapeType;
    if (typeof inputs.isTrigger === 'boolean') targetShape.isTrigger = inputs.isTrigger;
    if (typeof inputs.enabled === 'boolean') targetShape.enabled = inputs.enabled;
    targetShape.radius = (targetShape.width || 32) / 2;
    success = true;
  }
} else if (op === 'toggle') {
  if (sId) {
    let s = false;
    for (let i = 0; i < colComp.data.length; i++) {
      if (colComp.data[i].id === sId || colComp.data[i].scriptId === sId) {
        s = colComp.data[i];
        break;
      }
    }
    if (s) {
      s.enabled = !s.enabled;
      success = true;
    }
  } else {
    colComp.enabled = !colComp.enabled;
    success = true;
  }
}

outputs.success = success;
outputs.shapeCount = colComp.data.length;
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};

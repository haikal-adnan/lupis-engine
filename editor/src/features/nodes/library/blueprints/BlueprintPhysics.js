import { Activity } from 'lucide-vue-next';

export const BlueprintPhysics = {
  id: 'game_physics',
  label: 'Physics & Collision',
  color: '#7C4DFF',
  icon: Activity,
  items: [
    {
      type: 'get_physics',
      label: 'Get Physics',
      description: 'Get physics state (velocity, grounded, etc)',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Physics',
          headerColor: '#5E35B1',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#64B5F6' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#64B5F6' },
            { value: 'isGrounded', label: 'Is Grounded?', type: 'boolean', color: '#E57373' },
            { value: 'movementState', label: 'Movement State', type: 'string', color: '#F48FB1' },
            { value: 'facingDirection', label: 'Facing Direction', type: 'string', color: '#F48FB1' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#64B5F6' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#64B5F6' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#64B5F6' },
            { value: 'enabled', label: 'Is Enabled?', type: 'boolean', color: '#E57373' },
            { value: 'isFrozen', label: 'Is Frozen?', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const target = context.entity.get(targetId);

if (target && target.components && target.components.Physics) {
  const phys = target.components.Physics;
  const velX = phys.velocityX ?? 0;
  const velY = phys.velocityY ?? 0;
  const grounded = Boolean(phys.isGrounded);
  const moveState = phys.movementState || 'idle';
  const facing = phys.facingDirection || 'right';
  const massVal = phys.mass ?? 1;
  const grav = phys.gravityScale ?? 1;
  const dragVal = phys.drag ?? 0;
  const isEnabled = Boolean(phys.enabled);
  const isFrozen = Boolean(phys.isFrozen);

  outputs['Velocity X'] = velX;
  outputs['velocityX'] = velX;
  outputs['Velocity Y'] = velY;
  outputs['velocityY'] = velY;
  outputs['Is Grounded?'] = grounded;
  outputs['isGrounded'] = grounded;
  outputs['Movement State'] = moveState;
  outputs['movementState'] = moveState;
  outputs['Facing Direction'] = facing;
  outputs['facingDirection'] = facing;
  outputs['Mass'] = massVal;
  outputs['mass'] = massVal;
  outputs['Gravity Scale'] = grav;
  outputs['gravityScale'] = grav;
  outputs['Drag'] = dragVal;
  outputs['drag'] = dragVal;
  outputs['Is Enabled?'] = isEnabled;
  outputs['enabled'] = isEnabled;
  outputs['Is Frozen?'] = isFrozen;
  outputs['isFrozen'] = isFrozen;
}
return;`
        }
      }
    },
    {
      type: 'set_physics',
      label: 'Set Physics',
      description: 'Modify physics properties (velocity, mass, drag, gravity)',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Physics',
          headerColor: '#5E35B1',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#64B5F6' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#64B5F6' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#64B5F6' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#64B5F6' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#64B5F6' },
            { value: 'enabled', label: 'Enabled?', type: 'boolean', color: '#E57373' },
            { value: 'isFrozen', label: 'Is Frozen?', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.Physics) {
  const phys = entity.components.Physics;

  const velX = inputs['Velocity X'] ?? inputs['velocityX'];
  const velY = inputs['Velocity Y'] ?? inputs['velocityY'];
  const mass = inputs['Mass'] ?? inputs['mass'];
  const gravityScale = inputs['Gravity Scale'] ?? inputs['gravityScale'];
  const drag = inputs['Drag'] ?? inputs['drag'];
  const enabled = inputs['Enabled?'] ?? inputs['enabled'];
  const isFrozen = inputs['Is Frozen?'] ?? inputs['isFrozen'];

  if (velX !== undefined && velX !== null && velX !== '') {
    const val = Number(velX);
    phys.velocityX = val;
    phys._isIntentionalMove = Math.abs(val) > 10;
  }
  if (velY !== undefined && velY !== null && velY !== '') {
    const val = Number(velY);
    phys.velocityY = val;
    phys._isIntentionalMove = Math.abs(val) > 10;
  }
  if (mass !== undefined && mass !== null && mass !== '') {
    phys.mass = Number(mass);
  }
  if (gravityScale !== undefined && gravityScale !== null && gravityScale !== '') {
    phys.gravityScale = Number(gravityScale);
  }
  if (drag !== undefined && drag !== null && drag !== '') {
    phys.drag = Number(drag);
  }
  if (enabled !== undefined && enabled !== null) {
    phys.enabled = Boolean(enabled === 'true' || enabled === true);
  }
  if (isFrozen !== undefined && isFrozen !== null) {
    const frozenVal = Boolean(isFrozen === 'true' || isFrozen === true);
    phys.isFrozen = frozenVal;
    if (frozenVal) {
      phys.velocityX = 0;
      phys.velocityY = 0;
    }
  }
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'set_face_direction',
      label: 'Set Face Direction',
      description: 'Atur arah hadap karakter',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Face Direction',
          headerColor: '#FF4081',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'axisX', label: 'Axis X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'axisY', label: 'Axis Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'mode', label: 'Mode', dataType: 'string', color: '#F48FB1', defaultValue: '4-way' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { axisX: 0, axisY: 0, mode: '4-way', target_in: 'self' },
          options: {
            mode: [
              { label: 'Horizontal Only', value: 'horizontal' },
              { label: 'Vertical Only', value: 'vertical' },
              { label: '4-Direction (Top/Side)', value: '4-way' },
              { label: '8-Direction (Diagonal)', value: '8-way' }
            ]
          },
          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const target = context.entity.get(targetId);

if (target && target.components && target.components.Physics) {
  const phys = target.components.Physics;
  const axisX = Number(inputs['Axis X'] ?? inputs['axisX'] ?? 0);
  const axisY = Number(inputs['Axis Y'] ?? inputs['axisY'] ?? 0);
  const mode = inputs['Mode'] ?? inputs['mode'] ?? '4-way';

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
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'move_and_slide',
      label: 'Move and Slide',
      description: 'Move character with collision handling (For Kinematic Bodies)',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Move and Slide',
          headerColor: '#5E35B1',
          category: 'Physics & Collision'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'vel_x', label: 'Velocity X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'vel_y', label: 'Velocity Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { target_in: 'self', vel_x: 0, vel_y: 0 },
          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.entity.get(targetId);
const phys = entity?.components?.Physics;

if (phys && phys.isFrozen) {
  outputs['Out'] = true;
  outputs['exec_out'] = true;
  return;
}

const t = entity?.components?.UITransform || entity?.components?.Transform;

if (t) {
  const velX = Number(inputs['Velocity X'] ?? inputs['vel_x'] ?? 0);
  const velY = Number(inputs['Velocity Y'] ?? inputs['vel_y'] ?? 0);
  const dt = context.runner?.currentDt || 0.016;
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

    if (context.game && context.game.colliderSystem) {
      context.game.colliderSystem.moveAndSlide(entity, moveX, moveY);
    } else {
      t.x += moveX;
      t.y += moveY;
    }
  }
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};
import { MoveRight, Gauge, Activity, Footprints } from 'lucide-vue-next';

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
      icon: Gauge,
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      defaultData: {
        settings: { headerTitle: 'Get Physics', headerColor: '#5E35B1', category: 'Physics' },
        inputs: [
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#B2FF59' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#B2FF59' },
            { value: 'isGrounded', label: 'Is Grounded?', type: 'boolean', color: '#f472b6' },
            { value: 'movementState', label: 'Movement State', type: 'string', color: '#FFB74D' },
            { value: 'facingDirection', label: 'Facing Direction', type: 'string', color: '#FFB74D' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#B2FF59' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#B2FF59' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#B2FF59' },
            { value: 'enabled', label: 'Is Enabled?', type: 'boolean', color: '#f472b6' },
            { value: 'isFrozen', label: 'Is Frozen?', type: 'boolean', color: '#f472b6' }
          ],
          code: `const targetId = inputs['Target Entity'];
const target = context.entity.get(targetId);

if (target && target.components && target.components.Physics) {
    const phys = target.components.Physics;
    outputs['Velocity X'] = phys.velocityX ?? 0;
    outputs['Velocity Y'] = phys.velocityY ?? 0;
    outputs['Is Grounded?'] = Boolean(phys.isGrounded);
    outputs['Movement State'] = phys.movementState || 'idle';
    outputs['Facing Direction'] = phys.facingDirection || 'right';
    outputs['Mass'] = phys.mass ?? 1;
    outputs['Gravity Scale'] = phys.gravityScale ?? 1;
    outputs['Drag'] = phys.drag ?? 0;
    outputs['Is Enabled?'] = Boolean(phys.enabled);
    outputs['Is Frozen?'] = Boolean(phys.isFrozen);
}
return;`
        }
      }
    },

    {
      type: 'set_physics',
      label: 'Set Physics',
      description: 'Modify physics properties (velocity, mass, drag, gravity)',
      icon: MoveRight,
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Set Physics', headerColor: '#5E35B1', category: 'Physics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#B2FF59' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#B2FF59' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#B2FF59' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#B2FF59' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#B2FF59' },
            { value: 'enabled', label: 'Enabled?', type: 'boolean', color: '#f472b6' },
            { value: 'isFrozen', label: 'Is Frozen?', type: 'boolean', color: '#f472b6' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.Physics) {
    const phys = entity.components.Physics;

    const velX = inputs['Velocity X'];
    const velY = inputs['Velocity Y'];
    const mass = inputs['Mass'];
    const gravityScale = inputs['Gravity Scale'];
    const drag = inputs['Drag'];
    const enabled = inputs['Enabled?'];
    const isFrozen = inputs['Is Frozen?'];

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
return;`
        }
      }
    },

    {
      type: 'set_face_direction',
      label: 'Set Face Direction',
      description: 'Atur arah hadap karakter',
      icon: Footprints,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Face Direction', headerColor: '#FF4081', category: 'Physics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' },
          { id: 'axisX', label: 'Axis X', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'axisY', label: 'Axis Y', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'mode', label: 'Mode', dataType: 'string', color: '#FFB74D', defaultValue: '4-way' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
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
          code: `const targetId = inputs['Target Entity'];
const target = context.entity.get(targetId);

if (target && target.components && target.components.Physics) {
    const phys = target.components.Physics;
    const axisX = Number(inputs['Axis X']) || 0;
    const axisY = Number(inputs['Axis Y']) || 0;
    const mode = inputs['Mode'] || '4-way';

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
return;`
        }
      }
    },

    { 
      type: 'move_and_slide', 
      label: 'Move and Slide', 
      description: 'Move character with collision handling (For Kinematic Bodies)', 
      icon: Footprints, 
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Move and Slide', headerColor: '#5E35B1', category: 'Physics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' },
          { id: 'vel_x', label: 'Velocity X', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'vel_y', label: 'Velocity Y', dataType: 'number', color: '#B2FF59', defaultValue: 0 }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: { 
          values: { target_in: 'self', vel_x: 0, vel_y: 0 },
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);
const phys = entity?.components?.Physics;

if (phys && phys.isFrozen) {
    outputs['Out'] = true;
    return;
}

const t = entity?.components?.UITransform || entity?.components?.Transform;

if (t) {
    const velX = Number(inputs['Velocity X']) || 0;
    const velY = Number(inputs['Velocity Y']) || 0;
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
return;`
        }
      } 
    }
  ]
};
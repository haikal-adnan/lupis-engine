export function processEnemyChaser(state, inputs, outputs, context) {
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!target._ai) {
    target._ai = {
      spawnX: transform ? transform.x : 0,
      patrolDir: 1,
      isChasing: false,
      inAttackRange: false,
      facing: 'right',
      targetId: null
    };
  }
  const ai = target._ai;

  const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
  if (isKnockedBack) {
    target._knockback.duration -= dt;
    if (phys) phys.movementState = 'hit';
    outputs.execOut = true;
    outputs.movementState = 'hit';
    return;
  }

  const isCombatAttacking = Boolean(target._combat && target._combat.isAttacking);
  if (isCombatAttacking) {
    if (phys) {
      phys.velocityX = 0;
      phys.movementState = 'attack';
    }
    outputs.execOut = true;
    outputs.isChasing = ai.isChasing;
    outputs.inAttackRange = true;
    outputs.movementState = 'attack';
    outputs.facingDirection = ai.facing;
    outputs.targetPlayer = ai.targetId || '';
    return;
  }

  const playerTag = String(inputs.playerTag || 'player').trim();
  const detectRadius = typeof inputs.detectRadius === 'number' ? inputs.detectRadius : 250;
  const loseRadius = typeof inputs.loseRadius === 'number' ? inputs.loseRadius : 350;
  const stopRadius = typeof inputs.stopRadius === 'number' ? inputs.stopRadius : 45;
  const chaseSpeed = typeof inputs.chaseSpeed === 'number' ? inputs.chaseSpeed : 160;
  const patrolSpeed = typeof inputs.patrolSpeed === 'number' ? inputs.patrolSpeed : 70;
  const patrolDistance = typeof inputs.patrolDistance === 'number' ? inputs.patrolDistance : 100;
  const autoFlipX = inputs.autoFlipX !== false && inputs.autoFlipX !== 'false';

  let closestPlayer = null;
  let minDistance = Infinity;
  let playerDeltaX = 0;

  let players = [];
  if (context.entity && typeof context.entity.getAllByTag === 'function') {
    players = context.entity.getAllByTag(playerTag) || [];
    if (players.length === 0 && playerTag.toLowerCase() !== playerTag) {
      players = context.entity.getAllByTag(playerTag.toLowerCase()) || [];
    }
  }
  if (players.length === 0 && context.entity && typeof context.entity.get === 'function') {
    const byName = context.entity.get(playerTag) || context.entity.get(playerTag.toLowerCase());
    if (byName) players = [byName];
  }

  const selfX = transform ? transform.x : 0;
  const selfY = transform ? transform.y : 0;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p || p.active === false || p.id === target.id) continue;
    const pT = p.components && (p.components.Transform || p.components.UITransform);
    if (!pT) continue;
    const dx = pT.x - selfX;
    const dy = pT.y - selfY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDistance) {
      minDistance = dist;
      closestPlayer = p;
      playerDeltaX = dx;
    }
  }

  let wasChasing = ai.isChasing;
  let isChasing = false;
  let inAttackRange = false;
  let moveVelX = 0;
  let movementState = 'idle';

  if (closestPlayer) {
    ai.targetId = closestPlayer.id || closestPlayer.scriptId;
    const currentThreshold = wasChasing ? loseRadius : detectRadius;
    if (minDistance <= currentThreshold) {
      isChasing = true;
      if (minDistance <= stopRadius) {
        inAttackRange = true;
        moveVelX = 0;
        movementState = 'idle';
        ai.facing = playerDeltaX < 0 ? 'left' : 'right';
        outputs.onInAttackRange = true;
      } else {
        const dirX = playerDeltaX < 0 ? -1 : 1;
        ai.facing = dirX < 0 ? 'left' : 'right';
        moveVelX = dirX * chaseSpeed;
        movementState = 'run';
      }
    }
  }

  if (!isChasing) {
    ai.targetId = null;
    const leftLimit = ai.spawnX - patrolDistance;
    const rightLimit = ai.spawnX + patrolDistance;

    if (selfX <= leftLimit) {
      ai.patrolDir = 1;
    } else if (selfX >= rightLimit) {
      ai.patrolDir = -1;
    }

    ai.facing = ai.patrolDir < 0 ? 'left' : 'right';
    moveVelX = ai.patrolDir * patrolSpeed;
    movementState = 'walk';
  }

  if (!wasChasing && isChasing) {
    outputs.onTargetAcquired = true;
  } else if (wasChasing && !isChasing) {
    outputs.onTargetLost = true;
  }
  ai.isChasing = isChasing;
  ai.inAttackRange = inAttackRange;

  if (phys) {
    phys.velocityX = moveVelX;
    phys.facingDirection = ai.facing;
    phys.movementState = movementState;
    phys._isIntentionalMove = Math.abs(moveVelX) > 5;
  } else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
    context.collider.moveAndSlide(target, moveVelX * dt, 0);
  }

  if (transform && autoFlipX) {
    transform.flipX = (ai.facing === 'left');
  }

  outputs.execOut = true;
  outputs.isChasing = isChasing;
  outputs.inAttackRange = inAttackRange;
  outputs.movementState = movementState;
  outputs.distanceToTarget = closestPlayer ? Number(minDistance.toFixed(2)) : -1;
  outputs.facingDirection = ai.facing;
  outputs.targetPlayer = ai.targetId || '';
}

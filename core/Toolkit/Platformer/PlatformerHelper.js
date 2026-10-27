function isEntityOneWay(entity, oneWayTag) {
  if (!entity || !oneWayTag) return false;
  if (entity.components?.Tilemap?.isOneWay || entity.components?.Tilemap?.oneWay) return true;
  if (entity.components?.Collider?.isOneWay || entity.components?.Collider?.oneWay) return true;
  const tag = entity.tag || entity.components?.Tags?.value || entity.components?.Tilemap?.tag || '';
  if (!tag || typeof tag !== 'string') return false;
  const targets = oneWayTag.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  if (targets.length === 0) return false;
  const tags = tag.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  return targets.some(target => tags.includes(target));
}

function getBoxCorners(b) {
  if (b.vertices) return b.vertices;
  const cx = b.x, cy = b.y;
  const cos = Math.cos(b.rotation || 0), sin = Math.sin(b.rotation || 0);
  const left = -b.w * (b.pivotX ?? 0.5);
  const right = b.w * (1 - (b.pivotX ?? 0.5));
  const top = -b.h * (b.pivotY ?? 0.5);
  const bottom = b.h * (1 - (b.pivotY ?? 0.5));
  return [
    { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },
    { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },
    { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos },
    { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }
  ];
}

function isStandingOnOneWayPlatform(target, oneWayTag, context) {
  if (!oneWayTag) return false;
  const phys = target.components && target.components.Physics;
  if (phys) {
    if (phys.isGroundedOnOneWay) return true;
    if (phys.groundEntity && isEntityOneWay(phys.groundEntity, oneWayTag)) return true;
  }
  const colliderSys = (context.game && context.game.colliderSystem) || context.colliderSystem;
  if (!colliderSys || typeof colliderSys.getBounds !== 'function') return false;
  const entities = context.game?.world?.entities || [];
  const boundsList = colliderSys.getBounds(target).filter(b => b.type === 'solid');
  if (boundsList.length === 0) return false;

  const getCorners = typeof colliderSys._getObbCorners === 'function' ? (b) => colliderSys._getObbCorners(b) : getBoxCorners;

  for (const bA of boundsList) {
    const corners = getCorners(bA);
    const bottomY = Math.max(...corners.map(c => c.y));
    const minX = Math.min(...corners.map(c => c.x));
    const maxX = Math.max(...corners.map(c => c.x));
    const sensor = {
      x: minX + 2,
      y: bottomY,
      w: Math.max(1, (maxX - minX) - 4),
      h: 6,
      rotation: 0,
      pivotX: 0,
      pivotY: 0
    };
    for (const other of entities) {
      if (other === target || other.active === false) continue;
      if (!isEntityOneWay(other, oneWayTag)) continue;
      if (other.components?.Tilemap && other.components.Tilemap.isSolid) {
        if (colliderSys._getTilemapHitBounds && colliderSys._getTilemapHitBounds(sensor, other)) return true;
      } else if (other.components?.Collider || other.components?.ShapeRenderer) {
        const oBounds = colliderSys.getBounds(other).filter(b => b.type === 'solid');
        for (const bB of oBounds) {
          if (colliderSys._obbIntersect && colliderSys._obbIntersect(sensor, bB)) return true;
        }
      }
    }
  }
  return false;
}

export function processPlatformerController(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const keyboard = context.input.keyboard;

  const oneWayTag = String(inputs.oneWayTag !== undefined ? inputs.oneWayTag : 'platform').trim();
  target._oneWayTag = oneWayTag;
  if (phys) phys._oneWayTag = oneWayTag;

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!context.game || !context.game.physicsSystem) {
    if (typeof target._dropThroughTimer === 'number' && target._dropThroughTimer > 0) {
      target._dropThroughTimer = Math.max(0, target._dropThroughTimer - dt);
    }
    if (phys && typeof phys._dropThroughTimer === 'number' && phys._dropThroughTimer > 0) {
      phys._dropThroughTimer = Math.max(0, phys._dropThroughTimer - dt);
    }
  }

  if (!state.platformer) {
    state.platformer = { wasGrounded: false };
  }
  const pState = state.platformer;

  const keyLeft = String(inputs.keyLeft || 'a').trim().toLowerCase();
  const keyRight = String(inputs.keyRight || 'd').trim().toLowerCase();
  const keyJump = String(inputs.keyJump || 'space').trim().toLowerCase();
  const keyDown = String(inputs.keyDown || 's').trim().toLowerCase();

  const speed = typeof inputs.speed === 'number' ? inputs.speed : 260;
  const jumpForce = typeof inputs.jumpForce === 'number' ? inputs.jumpForce : 520;
  const dropNudge = typeof inputs.dropNudge === 'number' ? inputs.dropNudge : 6;
  const combatState = target._combat;
  const isCombatAttacking = Boolean(combatState && combatState.isAttacking);

  const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
  if (isKnockedBack) {
    target._knockback.duration -= dt;
  }

  let moveDirX = 0;
  if (!isCombatAttacking && !isKnockedBack && keyboard) {
    if (keyboard.isDown(keyRight)) moveDirX += 1;
    if (keyboard.isDown(keyLeft)) moveDirX -= 1;
  }

  const isGrounded = Boolean(phys ? phys.isGrounded : true);
  const isDownPressed = keyboard ? keyboard.isDown(keyDown) : false;
  const isJumpTriggered = !isCombatAttacking && !isKnockedBack && keyboard && keyboard.isPressed(keyJump);
  const isDownTriggered = !isCombatAttacking && !isKnockedBack && keyboard && keyboard.isPressed(keyDown);

  let didDrop = false;
  let didJump = false;

  const onOneWay = isGrounded && isStandingOnOneWayPlatform(target, oneWayTag, context);
  const wantsDrop = (isDownPressed && isJumpTriggered) || (isDownTriggered && keyboard && keyboard.isDown(keyJump));

  if (onOneWay && wantsDrop) {
    const dropDuration = 0.25;
    target._dropThroughTimer = dropDuration;
    target._dropThroughEntity = phys ? phys.groundEntity : null;
    if (phys) {
      phys._dropThroughTimer = dropDuration;
      phys._dropThroughEntity = phys.groundEntity;
      phys.velocityY = Math.max(120, (phys.velocityY || 0) + 120);
      phys.isGrounded = false;
      phys.isGroundedOnOneWay = false;
      phys.groundEntity = null;
    }
    if (target.components && target.components.Transform) {
      target.components.Transform.y += dropNudge;
    }
    didDrop = true;
    outputs.onDrop = true;
  } else if (isGrounded && isJumpTriggered) {
    if (phys) {
      phys.velocityY = -Math.abs(jumpForce);
      phys.isGrounded = false;
      phys.isGroundedOnOneWay = false;
    }
    didJump = true;
    outputs.onJump = true;
  }

  if (phys) {
    if (!isKnockedBack) {
      phys.velocityX = moveDirX * speed;
      phys._isIntentionalMove = Math.abs(phys.velocityX) > 10;
    }
    if (moveDirX > 0) {
      phys.facingDirection = 'right';
      phys.customFacing = true;
    } else if (moveDirX < 0) {
      phys.facingDirection = 'left';
      phys.customFacing = true;
    }
  } else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
    const moveX = moveDirX * speed * dt;
    context.collider.moveAndSlide(target, moveX, 0);
  }

  if (!pState.wasGrounded && isGrounded && !didDrop && !didJump) {
    outputs.onLand = true;
  }
  pState.wasGrounded = isGrounded;

  outputs.isGrounded = isGrounded;
  outputs.isGroundedOnOneWay = Boolean(onOneWay);
  outputs.groundType = phys ? (phys.groundType || (onOneWay ? 'entity' : null)) : null;
  outputs.movementState = isCombatAttacking ? 'attack' : (phys ? phys.movementState : (moveDirX !== 0 ? 'running' : 'idle'));
  outputs.facingDirection = phys ? (phys.facingDirection || 'right') : (moveDirX < 0 ? 'left' : 'right');
  outputs.velocityX = phys ? (phys.velocityX || 0) : (moveDirX * speed);
  outputs.velocityY = phys ? (phys.velocityY || 0) : 0;
  outputs.execOut = true;
  const result = {
    isGrounded,
    isGroundedOnOneWay: Boolean(onOneWay),
    groundType: phys ? (phys.groundType || (onOneWay ? 'entity' : null)) : null,
    movementState: isCombatAttacking ? 'attack' : (phys ? phys.movementState : (moveDirX !== 0 ? 'running' : 'idle')),
    facingDirection: phys ? (phys.facingDirection || 'right') : (moveDirX < 0 ? 'left' : 'right'),
    velocityX: phys ? (phys.velocityX || 0) : (moveDirX * speed),
    velocityY: phys ? (phys.velocityY || 0) : 0,
    onJump: didJump,
    onLand: Boolean(outputs.onLand),
    onDrop: didDrop,
    execOut: true
  };
  Object.assign(outputs, result);
  return result;
}

export function processPlatformerAnimator(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = context.assert.hasComponent(target, 'SpriteAnimator');
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;

  if (!state.platformerAnim) {
    state.platformerAnim = {
      lastState: 'idle',
      lastFacing: 'right',
      lastClip: '',
      prevX: transform ? transform.x : 0,
      prevY: transform ? transform.y : 0
    };
  }
  const pState = state.platformerAnim;

  function parseClips(raw) {
    if (!raw || typeof raw !== 'string') return false;
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return false;
    if (parts.length === 1) {
      return { left: parts[0], right: parts[0], isSingle: true };
    }
    const p0 = parts[0].toLowerCase();
    const p1 = parts[1].toLowerCase();
    if (p0.includes('left') || p0.endsWith('_l') || p0.endsWith('-l')) {
      return { left: parts[0], right: parts[1], isSingle: false };
    }
    if (p1.includes('left') || p1.endsWith('_l') || p1.endsWith('-l')) {
      return { left: parts[1], right: parts[0], isSingle: false };
    }
    if (p0.includes('right') || p0.endsWith('_r') || p0.endsWith('-r')) {
      return { left: parts[1], right: parts[0], isSingle: false };
    }
    if (p1.includes('right') || p1.endsWith('_r') || p1.endsWith('-r')) {
      return { left: parts[0], right: parts[1], isSingle: false };
    }
    return { left: parts[0], right: parts[1], isSingle: false };
  }

  const idleInput = String(inputs.idleClips || (node && node.data && node.data.values && node.data.values.idleClips) || '');
  const walkInput = String(inputs.walkClips || (node && node.data && node.data.values && node.data.values.walkClips) || '');
  const runInput = String(inputs.runClips || (node && node.data && node.data.values && node.data.values.runClips) || '');
  const jumpInput = String(inputs.jumpClips || (node && node.data && node.data.values && node.data.values.jumpClips) || '');
  const fallInput = String(inputs.fallClips || (node && node.data && node.data.values && node.data.values.fallClips) || '');
  const hitInput = String(inputs.hitClips || (node && node.data && node.data.values && node.data.values.hitClips) || '');

  const idleCfg = parseClips(idleInput);
  const walkCfg = parseClips(walkInput);
  const runCfg = parseClips(runInput);
  const jumpCfg = parseClips(jumpInput);
  const fallCfg = parseClips(fallInput);
  const hitCfg = parseClips(hitInput);

  let facing = '';
  const inputFacing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (inputFacing === 'left' || inputFacing === 'right') {
    facing = inputFacing;
  } else if (phys && (phys.facingDirection === 'left' || phys.facingDirection === 'right')) {
    facing = phys.facingDirection;
  } else if (phys && typeof phys.velocityX === 'number' && Math.abs(phys.velocityX) > 5) {
    facing = phys.velocityX < 0 ? 'left' : 'right';
  } else if (transform && typeof transform.x === 'number') {
    const dx = transform.x - pState.prevX;
    if (dx < -0.2) facing = 'left';
    else if (dx > 0.2) facing = 'right';
  }

  if (!facing) {
    facing = pState.lastFacing || 'right';
  }
  pState.lastFacing = facing;

  let moveState = '';
  const inputState = String(inputs.movementState || '').trim().toLowerCase();
  if (inputState) {
    if (inputState === 'idle' || inputState === 'stand') moveState = 'idle';
    else if (inputState === 'walk' || inputState === 'walking' || inputState === 'patrol') moveState = 'walk';
    else if (inputState === 'running' || inputState === 'run' || inputState === 'moving') moveState = 'run';
    else if (inputState === 'jumping' || inputState === 'jump') moveState = 'jump';
    else if (inputState === 'falling' || inputState === 'fall') moveState = 'fall';
    else if (inputState === 'air' || inputState === 'inair') moveState = 'jump';
    else if (inputState === 'attack' || inputState === 'attacking') moveState = 'attack';
    else if (inputState === 'hit' || inputState === 'hurt' || inputState === 'damaged') moveState = 'hit';
    else moveState = inputState;
  }

  const isHitInput = Boolean(inputs.isHit === true || inputs.isHit === 'true');
  const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
  const isEntityHit = Boolean(target._isHit || (target._hit && target._hit.duration > 0));
  const isHitMoveState = (moveState === 'hit');
  let isHit = isHitInput || isKnockedBack || isEntityHit || isHitMoveState;

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  if (isKnockedBack && !target._ai && (!phys || phys._isIntentionalMove === undefined)) {
    target._knockback.duration -= dt;
  }

  if (!isHit && pState.lastState === 'hit' && hitCfg) {
    const currentClipId = animator.currentClip || pState.lastClip;
    const rawClips = animator.clips;
    const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
    const activeClip = clips.find(c => c.id === currentClipId || c.scriptId === currentClipId || c.name === currentClipId);
    if (activeClip && activeClip.isLooping === false && animator.isPlaying) {
      const totalFrames = Array.isArray(activeClip.frames) ? activeClip.frames.length : 1;
      const currentFrame = typeof activeClip.frameIndex === 'number' ? activeClip.frameIndex : 0;
      if (currentFrame < totalFrames - 1) {
        isHit = true;
      }
    }
  }

  if (inputs.enabled === false) {
    outputs.execOut = true;
    return;
  }

  if (isHit && hitCfg) {
    const combatState = target._combat || state.platformerCombat;
    if (combatState) {
      combatState.isAttacking = false;
      combatState.bufferAttack = false;
    }

    let autoFlipX = true;
    if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
      autoFlipX = false;
    }
    const isSingle = Boolean(hitCfg.isSingle);
    const targetClipName = (facing === 'left') ? hitCfg.left : hitCfg.right;
    let shouldFlip = false;
    if (isSingle && autoFlipX) {
      shouldFlip = (facing === 'left');
    }
    if (transform) {
      transform.flipX = shouldFlip;
      pState.prevX = transform.x;
      pState.prevY = transform.y;
    }

    const rawClips = animator.clips;
    const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

    let matchedClip = false;
    if (targetClipName) {
      const targetLower = targetClipName.toLowerCase();
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        if (c.scriptId === targetClipName || c.id === targetClipName || c.name === targetClipName) {
          matchedClip = c;
          break;
        }
        if (String(c.scriptId || '').toLowerCase() === targetLower ||
            String(c.id || '').toLowerCase() === targetLower ||
            String(c.name || '').toLowerCase() === targetLower) {
          matchedClip = c;
          break;
        }
      }
    }

    const resolvedClipId = matchedClip ? matchedClip.id : targetClipName;

    let clipChanged = false;
    if (resolvedClipId && animator.currentClip !== resolvedClipId) {
      animator.currentClip = resolvedClipId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (matchedClip) matchedClip.frameIndex = 0;
      clipChanged = true;
    } else if (animator.currentClip && !animator.isPlaying) {
      animator.isPlaying = true;
    }

    pState.lastState = 'hit';
    pState.lastClip = animator.currentClip || resolvedClipId;

    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || resolvedClipId || '';
    outputs.activeState = 'hit';
    outputs.facingDirection = facing;
    outputs.isFlipped = shouldFlip;

    if (clipChanged) {
      outputs.onClipChanged = true;
    }
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: 'hit',
      facingDirection: facing,
      isFlipped: shouldFlip,
      onClipChanged: Boolean(outputs.onClipChanged)
    };
    Object.assign(outputs, result);
    return result;
  }

  const combatState = target._combat || state.platformerCombat;
  const isCombatAttacking = Boolean(
    (combatState && combatState.isAttacking) ||
    moveState === 'attack' ||
    moveState === 'attacking'
  );

  if (isCombatAttacking) {
    let autoFlipX = true;
    if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
      autoFlipX = false;
    }
    let shouldFlip = false;
    if (autoFlipX) {
      shouldFlip = (facing === 'left');
    }
    if (transform) {
      transform.flipX = shouldFlip;
      pState.prevX = transform.x;
      pState.prevY = transform.y;
    }
    pState.lastState = 'attack';
    pState.lastClip = animator.currentClip || '';
    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || '';
    outputs.activeState = 'attack';
    outputs.facingDirection = facing;
    outputs.isFlipped = shouldFlip;
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: 'attack',
      facingDirection: facing,
      isFlipped: shouldFlip,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  if (!moveState) {
    if (phys) {
      const isGrounded = Boolean(phys.isGrounded);
      const vy = Number(phys.velocityY) || 0;
      const vx = Number(phys.velocityX) || 0;
      if (!isGrounded) {
        if (vy < -10) moveState = 'jump';
        else if (vy > 10) moveState = 'fall';
        else moveState = 'jump';
      } else {
        const speed = Math.abs(vx);
        if (speed > 10) {
          if (phys && phys.movementState === 'walk' && walkCfg) moveState = 'walk';
          else if (walkCfg && !runCfg) moveState = 'walk';
          else if (walkCfg && runCfg && speed < 100) moveState = 'walk';
          else moveState = 'run';
        } else {
          moveState = 'idle';
        }
      }
    } else if (transform) {
      const dy = (typeof transform.y === 'number') ? transform.y - pState.prevY : 0;
      const dx = (typeof transform.x === 'number') ? transform.x - pState.prevX : 0;
      if (dy < -0.5) moveState = 'jump';
      else if (dy > 0.5) moveState = 'fall';
      else if (Math.abs(dx) > 0.2) {
        if (walkCfg && !runCfg) moveState = 'walk';
        else moveState = 'run';
      } else {
        moveState = 'idle';
      }
    } else {
      moveState = pState.lastState || 'idle';
    }
  }

  let selectedCfg = false;
  let resolvedState = moveState;

  if (moveState === 'fall') {
    if (fallCfg) selectedCfg = fallCfg;
    else if (jumpCfg) { selectedCfg = jumpCfg; resolvedState = 'jump'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'jump') {
    if (jumpCfg) selectedCfg = jumpCfg;
    else if (fallCfg) { selectedCfg = fallCfg; resolvedState = 'fall'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'walk') {
    if (walkCfg) selectedCfg = walkCfg;
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'run') {
    if (runCfg) selectedCfg = runCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else {
    resolvedState = 'idle';
    if (idleCfg) selectedCfg = idleCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
  }

  if (!selectedCfg) {
    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || '';
    outputs.activeState = moveState;
    outputs.facingDirection = facing;
    outputs.isFlipped = false;
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: moveState,
      facingDirection: facing,
      isFlipped: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  let autoFlipX = true;
  if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
    autoFlipX = false;
  }

  const isSingle = Boolean(selectedCfg.isSingle);
  const targetClipName = (facing === 'left') ? selectedCfg.left : selectedCfg.right;

  let shouldFlip = false;
  if (isSingle && autoFlipX) {
    shouldFlip = (facing === 'left');
  }

  if (transform) {
    transform.flipX = shouldFlip;
  }

  const rawClips = animator.clips;
  const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

  let matchedClip = false;
  if (targetClipName) {
    const targetLower = targetClipName.toLowerCase();
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      if (c.scriptId === targetClipName || c.id === targetClipName || c.name === targetClipName) {
        matchedClip = c;
        break;
      }
      if (String(c.scriptId || '').toLowerCase() === targetLower ||
          String(c.id || '').toLowerCase() === targetLower ||
          String(c.name || '').toLowerCase() === targetLower) {
        matchedClip = c;
        break;
      }
    }
  }

  const resolvedClipId = matchedClip ? matchedClip.id : targetClipName;

  let clipChanged = false;
  if (resolvedClipId && animator.currentClip !== resolvedClipId) {
    animator.currentClip = resolvedClipId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (matchedClip) matchedClip.frameIndex = 0;
    clipChanged = true;
  } else if (animator.currentClip && !animator.isPlaying) {
    animator.isPlaying = true;
  }

  if (transform) {
    pState.prevX = transform.x;
    pState.prevY = transform.y;
  }
  pState.lastState = resolvedState;
  pState.lastClip = animator.currentClip || resolvedClipId;

  outputs.execOut = true;
  outputs.currentClip = animator.currentClip || resolvedClipId || '';
  outputs.activeState = resolvedState;
  outputs.facingDirection = facing;
  outputs.isFlipped = shouldFlip;

  if (clipChanged) {
    outputs.onClipChanged = true;
  }
  const result = {
    execOut: true,
    currentClip: outputs.currentClip,
    activeState: resolvedState,
    facingDirection: facing,
    isFlipped: shouldFlip,
    onClipChanged: Boolean(outputs.onClipChanged)
  };
  Object.assign(outputs, result);
  return result;
}

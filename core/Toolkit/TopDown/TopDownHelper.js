function parseClips(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) {
    return { down: parts[0], up: parts[0], right: parts[0], left: parts[0], isSingle: true };
  }

  const map = {};
  const directions = ['down_right', 'down_left', 'up_right', 'up_left', 'down', 'up', 'right', 'left'];
  const unassigned = [];

  for (const part of parts) {
    const lower = part.toLowerCase();
    let matchedDir = null;
    for (const dir of directions) {
      if (lower.includes(dir)) {
        matchedDir = dir;
        break;
      }
    }
    if (matchedDir && !map[matchedDir]) {
      map[matchedDir] = part;
    } else {
      unassigned.push(part);
    }
  }

  if (unassigned.length > 0) {
    const defaultOrder = ['down', 'up', 'right', 'left'];
    let uIdx = 0;
    for (const d of defaultOrder) {
      if (!map[d] && uIdx < unassigned.length) {
        map[d] = unassigned[uIdx++];
      }
    }
  }

  if (map.right && !map.left) {
    map.left = map.right;
    map.canFlipLeft = true;
  }

  const fallback = map.down || map.right || map.up || map.left || parts[0];
  map.down = map.down || fallback;
  map.up = map.up || fallback;
  map.right = map.right || fallback;
  map.left = map.left || fallback;

  return map;
}

export function processTopDownController(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const keyboard = context.input && context.input.keyboard;

  if (!state.topDownController) {
    state.topDownController = {
      wasMoving: false,
      lastDirection: 'down',
      lastAngle: 90
    };
  }
  const cState = state.topDownController;

  const keyUp = String(inputs.keyUp !== undefined ? inputs.keyUp : 'w').toLowerCase();
  const keyDown = String(inputs.keyDown !== undefined ? inputs.keyDown : 's').toLowerCase();
  const keyLeft = String(inputs.keyLeft !== undefined ? inputs.keyLeft : 'a').toLowerCase();
  const keyRight = String(inputs.keyRight !== undefined ? inputs.keyRight : 'd').toLowerCase();
  const keySprint = String(inputs.keySprint !== undefined ? inputs.keySprint : 'shift').toLowerCase();

  let dirX = 0;
  let dirY = 0;
  if (keyboard) {
    if (keyboard.isDown(keyRight)) dirX += 1;
    if (keyboard.isDown(keyLeft))  dirX -= 1;
    if (keyboard.isDown(keyDown))  dirY += 1;
    if (keyboard.isDown(keyUp))    dirY -= 1;
  }

  const normalizeDiag = inputs.normalizeDiagonal !== false && inputs.normalizeDiagonal !== 'false';
  if (normalizeDiag && dirX !== 0 && dirY !== 0) {
    const invSqrt2 = 1 / Math.SQRT2;
    dirX *= invSqrt2;
    dirY *= invSqrt2;
  }

  const isSprinting = Boolean(keySprint && keyboard && keyboard.isDown(keySprint));
  const sprintMult = Number(inputs.sprintMultiplier) || 1.5;
  const speed = Number(inputs.speed !== undefined ? inputs.speed : 200);
  const currentSpeed = speed * (isSprinting ? sprintMult : 1.0);

  const velocityX = dirX * currentSpeed;
  const velocityY = dirY * currentSpeed;
  const isMoving = (dirX !== 0 || dirY !== 0);

  let facingAngle = cState.lastAngle !== undefined ? cState.lastAngle : 90;
  let facingDirection = cState.lastDirection || 'down';
  const faceMouse = Boolean(inputs.faceMouse === true || inputs.faceMouse === 'true');

  if (faceMouse && context.input && context.input.mouse) {
    const mousePos = typeof context.input.mouse.getPosition === 'function'
      ? context.input.mouse.getPosition()
      : (context.input.mouse.position || context.input.mouse);
    if (mousePos && transform) {
      const dx = mousePos.x - transform.x;
      const dy = mousePos.y - transform.y;
      if (dx !== 0 || dy !== 0) {
        const rad = Math.atan2(dy, dx);
        let deg = (rad * 180) / Math.PI;
        if (deg < 0) deg += 360;
        facingAngle = Math.round(deg);
      }
    }
  } else if (isMoving) {
    const rad = Math.atan2(dirY, dirX);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    facingAngle = Math.round(deg);
  }

  if (isMoving || faceMouse) {
    if (facingAngle >= 315 || facingAngle < 45) {
      facingDirection = 'right';
    } else if (facingAngle >= 45 && facingAngle < 135) {
      facingDirection = 'down';
    } else if (facingAngle >= 135 && facingAngle < 225) {
      facingDirection = 'left';
    } else {
      facingDirection = 'up';
    }
    cState.lastDirection = facingDirection;
    cState.lastAngle = facingAngle;
  }

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  const moveState = isMoving ? (isSprinting ? 'run' : 'walk') : 'idle';

  if (phys) {
    phys.velocityX = velocityX;
    phys.velocityY = velocityY;
    phys.movementState = moveState;
    phys.facingDirection = facingDirection;
    phys._isIntentionalMove = isMoving;
  } else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
    context.collider.moveAndSlide(target, velocityX * dt, velocityY * dt);
  } else if (transform) {
    transform.x += velocityX * dt;
    transform.y += velocityY * dt;
  }

  const onMove = isMoving;
  const onStop = Boolean(cState.wasMoving && !isMoving);
  const onSprint = Boolean(isSprinting && isMoving);
  cState.wasMoving = isMoving;

  const result = {
    isMoving,
    isSprinting,
    movementState: moveState,
    facingDirection,
    facingAngle,
    velocityX,
    velocityY,
    onMove,
    onStop,
    onSprint,
    execOut: true
  };
  Object.assign(outputs, result);
  return result;
}

export function processTopDownAnimator(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
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

  if (!state.topDownAnim) {
    state.topDownAnim = {
      lastState: 'idle',
      lastFacing: 'down',
      lastClip: '',
      prevX: transform ? transform.x : 0,
      prevY: transform ? transform.y : 0
    };
  }
  const aState = state.topDownAnim;

  const idleInput = String(inputs.idleClips || (node && node.data && node.data.values && node.data.values.idleClips) || '');
  const walkInput = String(inputs.walkClips || (node && node.data && node.data.values && node.data.values.walkClips) || '');
  const runInput = String(inputs.runClips || (node && node.data && node.data.values && node.data.values.runClips) || '');
  const hitInput = String(inputs.hitClips || (node && node.data && node.data.values && node.data.values.hitClips) || '');

  const idleCfg = parseClips(idleInput);
  const walkCfg = parseClips(walkInput);
  const runCfg = parseClips(runInput);
  const hitCfg = parseClips(hitInput);

  let facing = '';
  const inputFacing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (['down', 'up', 'left', 'right', 'down_left', 'down_right', 'up_left', 'up_right'].includes(inputFacing)) {
    facing = inputFacing;
  } else if (phys && phys.facingDirection) {
    facing = String(phys.facingDirection).trim().toLowerCase();
  } else if (phys && (phys.velocityX !== 0 || phys.velocityY !== 0)) {
    const vx = Number(phys.velocityX) || 0;
    const vy = Number(phys.velocityY) || 0;
    const rad = Math.atan2(vy, vx);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    if (deg >= 315 || deg < 45) facing = 'right';
    else if (deg >= 45 && deg < 135) facing = 'down';
    else if (deg >= 135 && deg < 225) facing = 'left';
    else facing = 'up';
  } else if (transform) {
    const dx = transform.x - aState.prevX;
    const dy = transform.y - aState.prevY;
    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
      const rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI;
      if (deg < 0) deg += 360;
      if (deg >= 315 || deg < 45) facing = 'right';
      else if (deg >= 45 && deg < 135) facing = 'down';
      else if (deg >= 135 && deg < 225) facing = 'left';
      else facing = 'up';
    }
  }

  if (!facing) {
    facing = aState.lastFacing || 'down';
  }
  aState.lastFacing = facing;

  let moveState = '';
  const inputState = String(inputs.movementState || '').trim().toLowerCase();
  if (inputState) {
    if (inputState === 'idle' || inputState === 'stand') moveState = 'idle';
    else if (inputState === 'walk' || inputState === 'walking') moveState = 'walk';
    else if (inputState === 'running' || inputState === 'run' || inputState === 'sprint') moveState = 'run';
    else if (inputState === 'hit' || inputState === 'hurt' || inputState === 'damaged') moveState = 'hit';
    else moveState = inputState;
  } else if (phys) {
    const spd = Math.hypot(phys.velocityX || 0, phys.velocityY || 0);
    if (spd > 10) {
      if (phys.movementState === 'run' && runCfg) moveState = 'run';
      else if (walkCfg && !runCfg) moveState = 'walk';
      else if (walkCfg && runCfg && spd < 120) moveState = 'walk';
      else moveState = 'run';
    } else {
      moveState = 'idle';
    }
  } else {
    moveState = aState.lastState || 'idle';
  }

  const isHitInput = Boolean(inputs.isHit === true || inputs.isHit === 'true');
  const isHit = isHitInput || (moveState === 'hit');

  let selectedCfg = null;
  let resolvedState = moveState;

  if (isHit && hitCfg) {
    selectedCfg = hitCfg;
    resolvedState = 'hit';
  } else if (moveState === 'run') {
    if (runCfg) selectedCfg = runCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'walk') {
    if (walkCfg) selectedCfg = walkCfg;
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
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

  const directionMode = String(inputs.directionMode || '4way').toLowerCase();
  const autoFlipX = inputs.autoFlipX !== false && inputs.autoFlipX !== 'false';

  if (directionMode === 'rotation') {
    const angle = Number(inputs.facingAngle) || 0;
    if (transform) {
      transform.rotation = angle;
    }
  }

  let targetClipName = selectedCfg[facing] || selectedCfg.down || selectedCfg.right || '';
  let shouldFlip = false;

  if (facing === 'left' && autoFlipX) {
    if (selectedCfg.canFlipLeft || selectedCfg.left === selectedCfg.right || selectedCfg.isSingle) {
      shouldFlip = true;
      targetClipName = selectedCfg.right || selectedCfg.down || '';
    }
  }

  if (transform) {
    transform.flipX = shouldFlip;
    aState.prevX = transform.x;
    aState.prevY = transform.y;
  }

  const rawClips = animator.clips;
  const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

  let matchedClip = null;
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

  aState.lastState = resolvedState;
  aState.lastClip = animator.currentClip || resolvedClipId;

  const result = {
    execOut: true,
    currentClip: animator.currentClip || resolvedClipId || '',
    activeState: resolvedState,
    facingDirection: facing,
    isFlipped: shouldFlip,
    onClipChanged: clipChanged
  };
  Object.assign(outputs, result);
  return result;
}

export function processPlatformerController(state, inputs, outputs, context) {
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const keyboard = context.input.keyboard;

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

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
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

  let didDrop = false;
  let didJump = false;

  if (isGrounded && isDownPressed && isJumpTriggered) {
    if (target.components && target.components.Transform) {
      target.components.Transform.y += dropNudge;
      if (phys) {
        phys.velocityY = Math.max(100, (phys.velocityY || 0) + 100);
        phys.isGrounded = false;
      }
      didDrop = true;
      outputs.onDrop = true;
    }
  } else if (isGrounded && isJumpTriggered) {
    if (phys) {
      phys.velocityY = -Math.abs(jumpForce);
      phys.isGrounded = false;
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
  outputs.movementState = isCombatAttacking ? 'attack' : (phys ? phys.movementState : (moveDirX !== 0 ? 'running' : 'idle'));
  outputs.facingDirection = phys ? (phys.facingDirection || 'right') : (moveDirX < 0 ? 'left' : 'right');
  outputs.velocityX = phys ? (phys.velocityX || 0) : (moveDirX * speed);
  outputs.velocityY = phys ? (phys.velocityY || 0) : 0;
  outputs.execOut = true;
}

export function processPlatformerAnimator(state, inputs, outputs, context, node) {
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
    return;
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
    return;
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
    return;
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
}

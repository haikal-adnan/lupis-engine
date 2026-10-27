// Toolkit helper for collectables, pickups, and interactive items

function extractTargetClipName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts[0] : '';
}

export function findClip(rawClips, targetClipName) {
  if (!rawClips || !targetClipName) return null;
  const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
  if (!clips.length) return null;

  const targetStr = extractTargetClipName(targetClipName);
  if (!targetStr) return null;
  const targetLower = targetStr.toLowerCase();

  // 1. Exact match (prefer non-category clip)
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c || c.type === 'category') continue;
    if (c.scriptId === targetStr || c.id === targetStr || c.name === targetStr) {
      return c;
    }
  }

  // 2. Case-insensitive match (prefer non-category clip)
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c || c.type === 'category') continue;
    if (
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) {
      return c;
    }
  }

  // 3. Fallback without category filter (for older or custom clip schemas)
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c) continue;
    if (c.scriptId === targetStr || c.id === targetStr || c.name === targetStr) {
      return c;
    }
    if (
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) {
      return c;
    }
  }

  return null;
}

export function playClipSafe(animator, clipName, forceRestart = false) {
  if (!animator || !clipName) return 0.35;
  const rawClips = animator.clips;
  const targetClipName = extractTargetClipName(clipName);
  if (!targetClipName) return 0.35;

  const matchedClip = findClip(rawClips, targetClipName);
  const resolvedId = matchedClip ? matchedClip.id : targetClipName;

  if (resolvedId && (animator.currentClip !== resolvedId || forceRestart)) {
    animator.currentClip = resolvedId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (matchedClip) matchedClip.frameIndex = 0;
  } else if (animator.currentClip && !animator.isPlaying) {
    animator.isPlaying = true;
  }

  if (matchedClip && Array.isArray(matchedClip.frames) && matchedClip.fps) {
    const frameCount = matchedClip.frames.length;
    const fps = matchedClip.fps > 0 ? matchedClip.fps : 12;
    return frameCount / fps;
  }
  return 0.35;
}

// Applies smooth sinusoidal bobbing effect to entity Y transform
export function applyBobbing(target, dt = 0.016, speed = 3.5, amplitude = 4) {
  if (!target || target.active === false || target._isDestroyed) return;
  const transform = target.components && (target.components.Transform || target.components.UITransform);
  if (!transform) return;

  if (!target._collectable) {
    target._collectable = {
      initialY: transform.y,
      bobTimer: Math.random() * Math.PI * 2,
      isCollected: false,
      state: 'idle',
      animTimer: 0,
      respawnTimer: 0,
      lastClip: ''
    };
  }

  const cState = target._collectable;
  cState.bobTimer += dt * speed;
  transform.y = cState.initialY + Math.sin(cState.bobTimer) * amplitude;
  target.isDirty = true;
}

// Checks overlap between target and active collectors matching collectorTag
export function checkOverlap(target, collectorTag = 'player', pickupDistance = 32, context = null) {
  if (!target || target.active === false || target._isDestroyed) return null;

  // 1. Try native collider check if available
  if (context?.collider && typeof context.collider.checkOverlap === 'function' && target.components?.Collider) {
    const hit = context.collider.checkOverlap(target, collectorTag);
    if (hit) return hit;
  }

  // 2. Fallback: Transform distance check
  const tTrans = target.components && (target.components.Transform || target.components.UITransform);
  if (!tTrans) return null;

  const targetX = tTrans.x;
  const targetY = tTrans.y;

  let candidates = [];
  if (context?.entity && typeof context.entity.getAllByTag === 'function') {
    candidates = context.entity.getAllByTag(collectorTag) || [];
  }

  for (let i = 0; i < candidates.length; i++) {
    const other = candidates[i];
    if (!other || other.active === false || other.id === target.id) continue;
    const oTrans = other.components && (other.components.Transform || other.components.UITransform);
    if (!oTrans) continue;

    const dx = Math.abs(oTrans.x - targetX);
    const dy = Math.abs(oTrans.y - targetY);
    if (dx <= pickupDistance && dy <= pickupDistance) {
      return other;
    }
  }

  return null;
}

// Plays collect animation and cleans up entity via context.entity.destroy
export function playAnimationAndDestroy(target, collectClip, context, node = null) {
  if (!target || target._isDestroyed) return;

  // Disable collider immediately to prevent duplicate pickup
  if (target.components?.Collider) {
    target.components.Collider.active = false;
  }

  const animator = target.components && target.components.SpriteAnimator;
  if (!target._collectable) {
    target._collectable = { state: 'idle', animTimer: 0, respawnTimer: 0, isCollected: false, lastClip: '' };
  }

  const clipInput = String(
    collectClip !== undefined ? collectClip :
    (node && node.data && node.data.values && (node.data.values.collectClip ?? node.data.values.collectClips)) || ''
  ).trim();

  const targetClipName = extractTargetClipName(clipInput);
  const matchedClip = (animator && targetClipName) ? findClip(animator.clips, targetClipName) : null;

  // Only defer destruction if a matching collection animation clip actually exists
  if (animator && matchedClip) {
    const duration = playClipSafe(animator, targetClipName, true);
    target._collectable.state = 'animating_destroy';
    target._collectable.animTimer = duration;
    target._collectable.lastClip = animator.currentClip || '';
  } else {
    // If no clip exists, destroy immediately
    target._collectable.state = 'destroyed';
    if (context?.entity && typeof context.entity.destroy === 'function') {
      context.entity.destroy(target);
    }
  }
}

// Deactivates entity after playing collection animation, with optional respawn scheduling
export function deactivateAndScheduleRespawn(target, collectClip, respawnTime = 0, context = null, node = null) {
  if (!target || target._isDestroyed) return;

  if (target.components?.Collider) {
    target.components.Collider.active = false;
  }

  const animator = target.components && target.components.SpriteAnimator;
  if (!target._collectable) {
    target._collectable = { state: 'idle', animTimer: 0, respawnTimer: 0, isCollected: false, lastClip: '' };
  }

  target._collectable.respawnTimer = Number(respawnTime) || 0;

  const clipInput = String(
    collectClip !== undefined ? collectClip :
    (node && node.data && node.data.values && (node.data.values.collectClip ?? node.data.values.collectClips)) || ''
  ).trim();

  const targetClipName = extractTargetClipName(clipInput);
  const matchedClip = (animator && targetClipName) ? findClip(animator.clips, targetClipName) : null;

  // Only animate if a matching collection animation clip actually exists
  if (animator && matchedClip) {
    const duration = playClipSafe(animator, targetClipName, true);
    target._collectable.state = 'animating_deactivate';
    target._collectable.animTimer = duration;
    target._collectable.lastClip = animator.currentClip || '';
  } else {
    target.active = false;
    target.visible = false;
    target._collectable.state = 'despawned';
  }
}

// Main process pipeline for Collectable Item node
export function processCollectable(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : (nodeMaybe || context?.node);

  const targetId = inputs.targetEntity || (node && node.data && node.data.values && node.data.values.targetEntity) || 'self';
  const target = context.entity ? context.entity.get(targetId) : null;
  const itemEntity = target ? (target.scriptId || target.id || '') : (targetId !== 'self' ? targetId : '');

  outputs.itemEntity = outputs.itemEntity || itemEntity;
  outputs.collectorEntity = outputs.collectorEntity || '';

  // Guard against missing or already destroyed entities (never return undefined!)
  if (!target || target._isDestroyed) {
    const fallbackVal = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : (node && node.data && node.data.values && typeof node.data.values.scoreValue === 'number' ? node.data.values.scoreValue : 1);
    outputs.execOut = true;
    outputs.isCollected = true;
    outputs.collectorEntity = outputs.collectorEntity || '';
    outputs.itemEntity = outputs.itemEntity || itemEntity;
    outputs.value = fallbackVal;
    outputs.currentClip = '';
    outputs.onCollected = false;
    outputs.onAnimationEnd = false;
    outputs.onRespawn = false;
    outputs.onClipChanged = false;
    const fallbackResult = {
      execOut: true,
      isCollected: true,
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: fallbackVal,
      currentClip: '',
      onCollected: false,
      onAnimationEnd: false,
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, fallbackResult);
    return fallbackResult;
  }

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  const transform = target.components && (target.components.Transform || target.components.UITransform);
  const animator = target.components && target.components.SpriteAnimator;

  if (!target._collectable) {
    target._collectable = {
      initialY: transform ? transform.y : 0,
      bobTimer: Math.random() * Math.PI * 2,
      isCollected: false,
      state: 'idle',
      animTimer: 0,
      respawnTimer: 0,
      lastClip: ''
    };
  }

  const cState = target._collectable;

  const idleInput = String(
    inputs.idleClip !== undefined ? inputs.idleClip :
    (inputs.idleClips !== undefined ? inputs.idleClips :
    (node && node.data && node.data.values && (node.data.values.idleClip ?? node.data.values.idleClips)) || '')
  ).trim();

  const idleTargetName = extractTargetClipName(idleInput);

  let clipChanged = false;

  outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : (node && node.data && node.data.values && typeof node.data.values.scoreValue === 'number' ? node.data.values.scoreValue : 1);
  outputs.isCollected = Boolean(cState.isCollected);

  // --- Phase A: Handling Animating Destroy ---
  if (cState.state === 'animating_destroy') {
    cState.animTimer -= dt;
    const isAnimFinished = cState.animTimer <= 0 || (animator && !animator.isPlaying);
    if (isAnimFinished) {
      cState.state = 'destroyed';
      outputs.onAnimationEnd = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onAnimationEnd');
      if (context.entity && typeof context.entity.destroy === 'function') {
        context.entity.destroy(target);
      }
    }
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: true,
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: Boolean(outputs.onAnimationEnd),
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  // --- Phase B: Handling Animating Deactivate ---
  if (cState.state === 'animating_deactivate') {
    cState.animTimer -= dt;
    const isAnimFinished = cState.animTimer <= 0 || (animator && !animator.isPlaying);
    if (isAnimFinished) {
      outputs.onAnimationEnd = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onAnimationEnd');
      target.active = false;
      target.visible = false;
      cState.state = 'despawned';
    }
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: true,
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: Boolean(outputs.onAnimationEnd),
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  // --- Phase C: Handling Despawned & Respawn Timer ---
  if (cState.state === 'despawned') {
    if (cState.respawnTimer > 0) {
      cState.respawnTimer -= dt;
      if (cState.respawnTimer <= 0) {
        cState.state = 'idle';
        cState.isCollected = false;
        target.active = true;
        target.visible = true;

        if (transform) {
          transform.y = cState.initialY;
          target.isDirty = true;
        }

        if (target.components?.Collider) {
          target.components.Collider.active = true;
        }

        // Restore idle animation clip immediately on respawn if configured
        if (animator && idleTargetName) {
          const rawClips = animator.clips;
          const matchedClip = findClip(rawClips, idleTargetName);
          const resolvedClipId = matchedClip ? matchedClip.id : idleTargetName;

          if (resolvedClipId) {
            animator.currentClip = resolvedClipId;
            animator._activeClipId = '';
            animator._elapsedTime = 0;
            animator.isPlaying = true;
            if (matchedClip) matchedClip.frameIndex = 0;
            clipChanged = true;
            cState.lastClip = resolvedClipId;
          }
        }

        outputs.isCollected = false;
        outputs.onRespawn = true;
        if (typeof context.triggerFlow === 'function') context.triggerFlow('onRespawn');
      }
    }
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: Boolean(cState.isCollected),
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: false,
      onRespawn: Boolean(outputs.onRespawn),
      onClipChanged: Boolean(clipChanged)
    };
    Object.assign(outputs, result);
    return result;
  }

  // If entity is inactive, stop processing idle mechanics
  if (target.active === false) {
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: Boolean(cState.isCollected),
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: false,
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  // --- Phase D: Idle Bobbing ---
  const autoBobbingVal = inputs.autoBobbing !== undefined 
    ? inputs.autoBobbing 
    : (node && node.data && node.data.values && node.data.values.autoBobbing !== undefined ? node.data.values.autoBobbing : true);

  if (cState.state === 'idle' && autoBobbingVal !== false && autoBobbingVal !== 'false') {
    applyBobbing(target, dt);
  }

  // --- Phase E: Idle Animation Synchronization (PlatformerHelper style) ---
  if (cState.state === 'idle' && animator && idleTargetName) {
    const rawClips = animator.clips;
    const matchedClip = findClip(rawClips, idleTargetName);
    const resolvedClipId = matchedClip ? matchedClip.id : idleTargetName;

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
    cState.lastClip = animator.currentClip || resolvedClipId;
  }

  // --- Phase F: Collision & Interaction Detection ---
  const collectorTag = String(inputs.collectorTag || (node && node.data && node.data.values && node.data.values.collectorTag) || 'player').trim();
  const collector = checkOverlap(target, collectorTag, 32, context);

  const canCollectVal = inputs.canCollect !== undefined 
    ? inputs.canCollect 
    : (node && node.data && node.data.values && node.data.values.canCollect !== undefined ? node.data.values.canCollect : true);

  if (collector && canCollectVal !== false && canCollectVal !== 'false') {
    // Mode check: keyboard interact key
    const pickupMode = inputs.pickupMode || (node && node.data && node.data.values && node.data.values.pickupMode) || 'collision';
    if (pickupMode === 'interact_key') {
      const key = String(inputs.interactKey || (node && node.data && node.data.values && node.data.values.interactKey) || 'e').toLowerCase();
      const keyboard = context.input && context.input.keyboard;
      const isPressed = keyboard && (
        (typeof keyboard.isJustPressed === 'function' && keyboard.isJustPressed(key)) ||
        (typeof keyboard.isDown === 'function' && keyboard.isDown(key))
      );
      if (!isPressed) {
        outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
        outputs.execOut = true;
        const result = {
          execOut: true,
          isCollected: Boolean(cState.isCollected),
          collectorEntity: outputs.collectorEntity || '',
          itemEntity: outputs.itemEntity || itemEntity,
          value: outputs.value,
          currentClip: outputs.currentClip,
          onCollected: false,
          onAnimationEnd: false,
          onRespawn: false,
          onClipChanged: Boolean(clipChanged)
        };
        Object.assign(outputs, result);
        return result;
      }
    }

    // Trigger collection
    cState.isCollected = true;
    outputs.isCollected = true;
    outputs.collectorEntity = collector.scriptId || collector.id || '';
    outputs.itemEntity = itemEntity;
    outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : (node && node.data && node.data.values && typeof node.data.values.scoreValue === 'number' ? node.data.values.scoreValue : 1);
    outputs.onCollected = true;

    // Disable collider immediately to prevent multi-hit
    if (target.components?.Collider) {
      target.components.Collider.active = false;
    }

    // Play Audio SFX
    const sfx = inputs.sfxName || (node && node.data && node.data.values && node.data.values.sfxName);
    if (sfx && context.audio && typeof context.audio.play === 'function') {
      context.audio.play(sfx);
    }

    // Trigger execution output pin
    if (typeof context.triggerFlow === 'function') {
      context.triggerFlow('onCollected');
    }

    // Execute Despawn Action Strategy
    const action = String(inputs.despawnAction || (node && node.data && node.data.values && node.data.values.despawnAction) || 'destroy').toLowerCase();
    const collectClipName = inputs.collectClip !== undefined 
      ? inputs.collectClip 
      : (inputs.collectClips !== undefined 
        ? inputs.collectClips 
        : (node && node.data && node.data.values && (node.data.values.collectClip ?? node.data.values.collectClips)) || '');

    if (action === 'destroy') {
      playAnimationAndDestroy(target, collectClipName, context, node);
      if (target._collectable?.state === 'destroyed') {
        outputs.onAnimationEnd = true;
        if (typeof context.triggerFlow === 'function') {
          context.triggerFlow('onAnimationEnd');
        }
      }
    } else if (action === 'deactivate') {
      const respawnTime = typeof inputs.respawnTime === 'number' 
        ? inputs.respawnTime 
        : (node && node.data && node.data.values && typeof node.data.values.respawnTime === 'number' ? node.data.values.respawnTime : 0);
      deactivateAndScheduleRespawn(target, collectClipName, respawnTime, context, node);
      if (target._collectable?.state === 'despawned') {
        outputs.onAnimationEnd = true;
        if (typeof context.triggerFlow === 'function') {
          context.triggerFlow('onAnimationEnd');
        }
      }
    } else if (action === 'none') {
      const targetClipName = extractTargetClipName(collectClipName);
      const matchedClip = (animator && targetClipName) ? findClip(animator.clips, targetClipName) : null;
      if (matchedClip && animator) {
        playClipSafe(animator, targetClipName, true);
        cState.lastClip = animator.currentClip || '';
      }
    }
  }

  outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
  if (clipChanged) {
    outputs.onClipChanged = true;
  }

  outputs.execOut = true;
  const result = {
    execOut: true,
    isCollected: Boolean(cState.isCollected),
    collectorEntity: outputs.collectorEntity || '',
    itemEntity: outputs.itemEntity || itemEntity,
    value: outputs.value,
    currentClip: outputs.currentClip,
    onCollected: Boolean(outputs.onCollected),
    onAnimationEnd: Boolean(outputs.onAnimationEnd),
    onRespawn: Boolean(outputs.onRespawn),
    onClipChanged: Boolean(outputs.onClipChanged)
  };
  Object.assign(outputs, result);
  return result;
}

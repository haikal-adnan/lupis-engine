/**
 * CollectableHelper.js
 * High-level toolkit helper for collectables, pickups, and interactive items in Lupis Engine.
 * Adheres to Tier 2 (Extensible Node) architectural contract.
 */

function findClip(clips, nameOrId) {
  if (!Array.isArray(clips) || !nameOrId) return null;
  const lower = String(nameOrId).trim().toLowerCase();
  return clips.find(c => c && (
    c.id === nameOrId || 
    c.name === nameOrId || 
    String(c.id).toLowerCase() === lower || 
    String(c.name).toLowerCase() === lower
  )) || null;
}

function playClipSafe(animator, clipName) {
  if (!animator || !clipName) return 0.35;
  const rawClips = animator.clips || [];
  const clipObj = findClip(rawClips, clipName);
  const resolvedId = clipObj ? clipObj.id : clipName;

  animator.currentClip = resolvedId;
  animator._activeClipId = '';
  animator._elapsedTime = 0;
  animator.isPlaying = true;
  if (clipObj) clipObj.frameIndex = 0;

  if (clipObj && Array.isArray(clipObj.frames) && clipObj.fps) {
    const frameCount = clipObj.frames.length;
    const fps = clipObj.fps > 0 ? clipObj.fps : 12;
    return frameCount / fps;
  }
  return 0.35;
}

/**
 * Applies smooth sinusoidal bobbing effect to entity's Y transform.
 */
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
      respawnTimer: 0
    };
  }

  const cState = target._collectable;
  cState.bobTimer += dt * speed;
  transform.y = cState.initialY + Math.sin(cState.bobTimer) * amplitude;
  target.isDirty = true;
}

/**
 * Checks overlap between target and active collectors matching collectorTag.
 */
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

/**
 * Plays collect animation (if any) and cleans up entity via context.entity.destroy.
 */
export function playAnimationAndDestroy(target, collectClip, context) {
  if (!target || target._isDestroyed) return;

  // Disable collider immediately to prevent duplicate pickup
  if (target.components?.Collider) {
    target.components.Collider.active = false;
  }

  const animator = target.components && target.components.SpriteAnimator;
  if (!target._collectable) {
    target._collectable = { state: 'idle', animTimer: 0, respawnTimer: 0, isCollected: false };
  }

  if (animator && collectClip) {
    const duration = playClipSafe(animator, collectClip);
    target._collectable.state = 'animating_destroy';
    target._collectable.animTimer = duration;
  } else {
    if (context?.entity && typeof context.entity.destroy === 'function') {
      context.entity.destroy(target);
    }
  }
}

/**
 * Deactivates entity (active = false) after playing collection animation, with optional respawn scheduling.
 */
export function deactivateAndScheduleRespawn(target, collectClip, respawnTime = 0, context = null) {
  if (!target || target._isDestroyed) return;

  if (target.components?.Collider) {
    target.components.Collider.active = false;
  }

  const animator = target.components && target.components.SpriteAnimator;
  if (!target._collectable) {
    target._collectable = { state: 'idle', animTimer: 0, respawnTimer: 0, isCollected: false };
  }

  target._collectable.respawnTimer = Number(respawnTime) || 0;

  if (animator && collectClip) {
    const duration = playClipSafe(animator, collectClip);
    target._collectable.state = 'animating_deactivate';
    target._collectable.animTimer = duration;
  } else {
    target.active = false;
    target.visible = false;
    target._collectable.state = 'despawned';
  }
}

/**
 * Main process pipeline for Collectable Item node.
 */
export function processCollectable(state, inputs, outputs, context) {
  const targetId = inputs.targetEntity || 'self';
  const target = context.entity ? context.entity.get(targetId) : null;
  if (!target || target._isDestroyed) return;

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  const transform = target.components && (target.components.Transform || target.components.UITransform);

  if (!target._collectable) {
    target._collectable = {
      initialY: transform ? transform.y : 0,
      bobTimer: Math.random() * Math.PI * 2,
      isCollected: false,
      state: 'idle',
      animTimer: 0,
      respawnTimer: 0,
      hasInitializedIdle: false
    };
  }

  const cState = target._collectable;

  // Initialize idle clip on first run
  if (!cState.hasInitializedIdle && inputs.idleClip && target.components?.SpriteAnimator) {
    playClipSafe(target.components.SpriteAnimator, inputs.idleClip);
    cState.hasInitializedIdle = true;
  }

  outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : 1;
  outputs.isCollected = Boolean(cState.isCollected);

  // --- Phase A: Handling Animating Destroy ---
  if (cState.state === 'animating_destroy') {
    cState.animTimer -= dt;
    if (cState.animTimer <= 0) {
      outputs.onAnimationEnd = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onAnimationEnd');
      if (context.entity && typeof context.entity.destroy === 'function') {
        context.entity.destroy(target);
      }
    }
    outputs.execOut = true;
    return;
  }

  // --- Phase B: Handling Animating Deactivate ---
  if (cState.state === 'animating_deactivate') {
    cState.animTimer -= dt;
    if (cState.animTimer <= 0) {
      outputs.onAnimationEnd = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onAnimationEnd');
      target.active = false;
      target.visible = false;
      cState.state = 'despawned';
    }
    outputs.execOut = true;
    return;
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

        if (inputs.idleClip && target.components?.SpriteAnimator) {
          playClipSafe(target.components.SpriteAnimator, inputs.idleClip);
        }

        outputs.isCollected = false;
        outputs.onRespawn = true;
        if (typeof context.triggerFlow === 'function') context.triggerFlow('onRespawn');
      }
    }
    outputs.execOut = true;
    return;
  }

  // If entity is inactive, stop processing idle mechanics
  if (target.active === false) {
    outputs.execOut = true;
    return;
  }

  // --- Phase D: Idle Bobbing ---
  if (inputs.autoBobbing !== false && inputs.autoBobbing !== 'false') {
    applyBobbing(target, dt);
  }

  // --- Phase E: Collision & Interaction Detection ---
  const collectorTag = String(inputs.collectorTag || 'player').trim();
  const collector = checkOverlap(target, collectorTag, 32, context);

  if (collector && inputs.canCollect !== false && inputs.canCollect !== 'false') {
    // Mode check: keyboard interact key
    if (inputs.pickupMode === 'interact_key') {
      const key = String(inputs.interactKey || 'e').toLowerCase();
      const keyboard = context.input && context.input.keyboard;
      const isPressed = keyboard && (
        (typeof keyboard.isJustPressed === 'function' && keyboard.isJustPressed(key)) ||
        (typeof keyboard.isDown === 'function' && keyboard.isDown(key))
      );
      if (!isPressed) {
        outputs.execOut = true;
        return;
      }
    }

    // Trigger collection
    cState.isCollected = true;
    outputs.isCollected = true;
    outputs.collectorEntity = collector.scriptId || collector.id || '';
    outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : 1;
    outputs.onCollected = true;

    // Disable collider immediately to prevent multi-hit
    if (target.components?.Collider) {
      target.components.Collider.active = false;
    }

    // Play Audio SFX
    if (inputs.sfxName && context.audio && typeof context.audio.play === 'function') {
      context.audio.play(inputs.sfxName);
    }

    // Trigger execution output pin
    if (typeof context.triggerFlow === 'function') {
      context.triggerFlow('onCollected');
    }

    // Execute Despawn Action Strategy
    const action = String(inputs.despawnAction || 'destroy').toLowerCase();
    if (action === 'destroy') {
      playAnimationAndDestroy(target, inputs.collectClip, context);
    } else if (action === 'deactivate') {
      const respawnTime = typeof inputs.respawnTime === 'number' ? inputs.respawnTime : 0;
      deactivateAndScheduleRespawn(target, inputs.collectClip, respawnTime, context);
    } else if (action === 'none') {
      if (inputs.collectClip && target.components?.SpriteAnimator) {
        playClipSafe(target.components.SpriteAnimator, inputs.collectClip);
      }
    }
  }

  outputs.execOut = true;
}

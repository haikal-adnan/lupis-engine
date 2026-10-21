export function processPlatformerCombat(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = target.components && target.components.SpriteAnimator;
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const keyboard = context.input.keyboard;
  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!target._combat) {
    target._combat = {
      isAttacking: false,
      currentCombo: 0,
      comboTimer: 0,
      cooldownTimer: 0,
      bufferAttack: false,
      hasTriggeredHitboxActive: false,
      hitEntitiesThisAttack: [],
      currentAttackDef: null,
      activeClipId: '',
      lastFacing: 'right'
    };
  }
  const cState = target._combat;

  if (cState.cooldownTimer > 0) {
    cState.cooldownTimer -= dt;
    if (cState.cooldownTimer < 0) cState.cooldownTimer = 0;
  }

  let config = inputs.attacksConfig;
  if (!config && node && node.data && node.data.values && node.data.values.attacksConfig) {
    config = node.data.values.attacksConfig;
  }
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch (e) {
      config = null;
    }
  }

  const defaultAttacks = {
    ground: [
      {
        clip: 'attack1',
        startFrame: 1,
        endFrame: 3,
        hitbox: { offsetX: 32, offsetY: 0, width: 40, height: 32 },
        damage: 10,
        knockbackX: 150,
        knockbackY: -50,
        forwardStep: 20
      },
      {
        clip: 'attack2',
        startFrame: 2,
        endFrame: 4,
        hitbox: { offsetX: 36, offsetY: 0, width: 44, height: 32 },
        damage: 15,
        knockbackX: 250,
        knockbackY: -80,
        forwardStep: 30
      }
    ],
    air: [
      {
        clip: 'airAttack',
        startFrame: 1,
        endFrame: 4,
        hitbox: { offsetX: 25, offsetY: 5, width: 44, height: 44 },
        damage: 12,
        knockbackX: 120,
        knockbackY: 80,
        forwardStep: 0
      }
    ]
  };

  let groundList = defaultAttacks.ground;
  let airList = defaultAttacks.ground;

  if (config && typeof config === 'object') {
    if (Array.isArray(config)) {
      groundList = config.length > 0 ? config : defaultAttacks.ground;
      airList = groundList;
    } else if (config.ground || config.air) {
      groundList = Array.isArray(config.ground) && config.ground.length > 0 ? config.ground : defaultAttacks.ground;
      airList = Array.isArray(config.air) && config.air.length > 0 ? config.air : (groundList || defaultAttacks.air);
    } else if (config.clip || config.colliderScriptId || config.hitbox) {
      groundList = [config];
      airList = [config];
    }
  }

  let facing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (facing !== 'left' && facing !== 'right') {
    if (phys && (phys.facingDirection === 'left' || phys.facingDirection === 'right')) {
      facing = phys.facingDirection;
    } else if (transform && typeof transform.flipX === 'boolean') {
      facing = transform.flipX ? 'left' : 'right';
    } else {
      facing = cState.lastFacing || 'right';
    }
  }
  cState.lastFacing = facing;

  let isGrounded = true;
  if (typeof inputs.isGrounded === 'boolean') {
    isGrounded = inputs.isGrounded;
  } else if (phys && typeof phys.isGrounded === 'boolean') {
    isGrounded = Boolean(phys.isGrounded);
  }

  const keyAttack = String(inputs.keyAttack || '').trim().toLowerCase();
  const isAttackPressed = Boolean(keyboard && typeof keyboard.isPressed === 'function' && keyAttack && keyboard.isPressed(keyAttack));
  const isTriggerActive = Boolean(inputs.triggerAttack === true || inputs.triggerAttack === 'true');
  const isAttackTriggered = isAttackPressed || isTriggerActive;

  const nodeValCooldown = node && node.data && node.data.values && node.data.values.attackCooldown;
  const attackCooldown = typeof inputs.attackCooldown === 'number' ? inputs.attackCooldown : (typeof nodeValCooldown === 'number' ? nodeValCooldown : 0);
  const comboBufferTime = typeof inputs.comboBufferTime === 'number' ? inputs.comboBufferTime : 0.35;
  const autoLockMovement = inputs.autoLockMovement !== false && inputs.autoLockMovement !== 'false';

  function findClip(clips, clipName) {
    if (!clips || !clipName) return null;
    const arr = Array.isArray(clips) ? clips : Object.values(clips);
    const targetLower = String(clipName).trim().toLowerCase();
    return arr.find(c =>
      c.id === clipName ||
      c.scriptId === clipName ||
      c.name === clipName ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) || null;
  }

  function triggerAttack(comboIdx) {
    const list = isGrounded ? groundList : airList;
    const attackDef = list[comboIdx % list.length];
    cState.isAttacking = true;
    cState.currentCombo = comboIdx;
    cState.comboTimer = comboBufferTime;
    cState.bufferAttack = false;
    cState.hasTriggeredHitboxActive = false;
    cState.hitEntitiesThisAttack = [];
    cState.currentAttackDef = attackDef;

    if (animator && attackDef && attackDef.clip) {
      const rawClips = animator.clips;
      const clipObj = findClip(rawClips, attackDef.clip);
      const resolvedId = clipObj ? clipObj.id : attackDef.clip;
      animator.currentClip = resolvedId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (clipObj) clipObj.frameIndex = 0;
      cState.activeClipId = resolvedId;
    }

    if (attackDef && attackDef.forwardStep && isGrounded && transform) {
      const step = attackDef.forwardStep * (facing === 'left' ? -1 : 1);
      if (context.collider && typeof context.collider.moveAndSlide === 'function') {
        context.collider.moveAndSlide(target, step, 0);
      } else {
        transform.x += step;
      }
    }

    outputs.onAttackStart = true;
  }

  const canStartAttack = !cState.isAttacking && (cState.cooldownTimer <= 0);

  if (!cState.isAttacking) {
    if (cState.comboTimer > 0) {
      cState.comboTimer -= dt;
      if (cState.comboTimer <= 0) {
        cState.currentCombo = 0;
      }
    }

    if (canStartAttack && isAttackTriggered) {
      const nextCombo = (cState.comboTimer > 0 && isGrounded && attackCooldown <= 0) ? (cState.currentCombo + 1) : 0;
      triggerAttack(nextCombo);
    }
  } else {
    if (isAttackTriggered) {
      cState.bufferAttack = true;
    }

    const attackDef = cState.currentAttackDef;
    const activeClipId = animator ? (animator.currentClip || cState.activeClipId) : cState.activeClipId;
    const rawClips = animator ? animator.clips : [];
    const clipObj = findClip(rawClips, activeClipId);

    const currentFrame = (clipObj && typeof clipObj.frameIndex === 'number') ? clipObj.frameIndex : 0;
    const totalFrames = (clipObj && Array.isArray(clipObj.frames)) ? clipObj.frames.length : 1;
    const isAnimFinished = animator ? (!animator.isPlaying || currentFrame >= totalFrames - 1) : false;

    let startFrame = 1;
    if (attackDef) {
      if (typeof attackDef.startFrame === 'number') startFrame = attackDef.startFrame;
      else if (attackDef.hitbox && typeof attackDef.hitbox.startFrame === 'number') startFrame = attackDef.hitbox.startFrame;
    }
    let endFrame = 1;
    if (attackDef) {
      if (typeof attackDef.endFrame === 'number') endFrame = attackDef.endFrame;
      else if (attackDef.hitbox && typeof attackDef.hitbox.endFrame === 'number') endFrame = attackDef.hitbox.endFrame;
      else endFrame = Math.max(startFrame, totalFrames - 1);
    }

    const isHitboxFrame = currentFrame >= startFrame && currentFrame <= endFrame;
    const colScriptId = attackDef ? (attackDef.colliderScriptId || attackDef.colliderId) : null;

    if (isHitboxFrame) {
      if (!cState.hasTriggeredHitboxActive) {
        outputs.onHitboxActive = true;
        cState.hasTriggeredHitboxActive = true;
      }

      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, true);
      }

      const targetTag = String(inputs.targetTag || 'enemy').trim();
      const sign = (facing === 'left') ? -1 : 1;
      let hitCandidates = [];

      if (colScriptId && context.collider && typeof context.collider.checkHitbox === 'function') {
        const hits = context.collider.checkHitbox(target, colScriptId, targetTag, ['hurtbox', 'solid', 'trigger']) || [];
        hitCandidates = hits.map(h => h.entity);
      } else {
        if (targetTag && context.entity && typeof context.entity.getAllByTag === 'function') {
          const candidates = context.entity.getAllByTag(targetTag);

          let hbW = 40;
          let hbH = 32;
          let hbOffX = 32;
          let hbOffY = 0;
          if (colScriptId && target.components && target.components.Collider && target.components.Collider.data) {
            const colShape = target.components.Collider.data.find(s => s.scriptId === colScriptId || s.id === colScriptId);
            if (colShape) {
              hbW = Number(colShape.width || 40);
              hbH = Number(colShape.height || 32);
              hbOffX = Number(colShape.offsetX || 0);
              hbOffY = Number(colShape.offsetY || 0);
            }
          } else {
            const hb = (attackDef && attackDef.hitbox) ? attackDef.hitbox : { offsetX: 32, offsetY: 0, width: 40, height: 32 };
            hbW = Number(hb.width || 40);
            hbH = Number(hb.height || 32);
            hbOffX = typeof hb.offsetX === 'number' ? hb.offsetX : 32;
            hbOffY = typeof hb.offsetY === 'number' ? hb.offsetY : 0;
          }

          const hbCenterX = (transform ? transform.x : 0) + (hbOffX * sign);
          const hbCenterY = (transform ? transform.y : 0) + hbOffY;
          const hbMinX = hbCenterX - (hbW * 0.5);
          const hbMaxX = hbCenterX + (hbW * 0.5);
          const hbMinY = hbCenterY - (hbH * 0.5);
          const hbMaxY = hbCenterY + (hbH * 0.5);

          for (let i = 0; i < candidates.length; i++) {
            const other = candidates[i];
            if (!other || other.active === false || other.id === target.id) continue;
            if (cState.hitEntitiesThisAttack.includes(other.id)) continue;

            let overlaps = false;
            const otherCollider = other.components && other.components.Collider;
            if (otherCollider && Array.isArray(otherCollider.data) && otherCollider.data.length > 0) {
              const otherT = other.components.Transform || { x: 0, y: 0, width: 32, height: 32 };
              for (const cB of otherCollider.data) {
                if (cB.enabled === false) continue;
                const bW = Number(cB.width || otherT.width || 32);
                const bH = Number(cB.height || otherT.height || 32);
                const bX = (otherT.x || 0) + Number(cB.offsetX || 0);
                const bY = (otherT.y || 0) + Number(cB.offsetY || 0);
                if (hbMinX < (bX + bW * 0.5) && hbMaxX > (bX - bW * 0.5) &&
                    hbMinY < (bY + bH * 0.5) && hbMaxY > (bY - bH * 0.5)) {
                  overlaps = true;
                  break;
                }
              }
            }

            if (!overlaps) {
              const oT = other.components && (other.components.Transform || other.components.UITransform);
              if (oT) {
                const oW = (oT.width || 32) * Math.abs(typeof oT.scaleX === 'number' ? oT.scaleX : 1);
                const oH = (oT.height || 32) * Math.abs(typeof oT.scaleY === 'number' ? oT.scaleY : 1);
                const oPivotX = typeof oT.pivotX === 'number' ? oT.pivotX : 0.5;
                const oPivotY = typeof oT.pivotY === 'number' ? oT.pivotY : 0.5;
                const oMinX = oT.x - (oW * oPivotX);
                const oMaxX = oMinX + oW;
                const oMinY = oT.y - (oH * oPivotY);
                const oMaxY = oMinY + oH;
                overlaps = (hbMinX < oMaxX && hbMaxX > oMinX && hbMinY < oMaxY && hbMaxY > oMinY);
              }
            }

            if (overlaps) {
              hitCandidates.push(other);
            }
          }
        }
      }

      for (let i = 0; i < hitCandidates.length; i++) {
        const other = hitCandidates[i];
        if (!other || cState.hitEntitiesThisAttack.includes(other.id)) continue;
        cState.hitEntitiesThisAttack.push(other.id);
        const dmg = Number(attackDef ? attackDef.damage : 10) || 10;
        
        if (other.components && other.components.Health) {
          const curHp = typeof other.components.Health.current === 'number' ? other.components.Health.current : 100;
          other.components.Health.current = Math.max(0, curHp - dmg);
        } else if (typeof other.hp === 'number') {
          other.hp = Math.max(0, other.hp - dmg);
        }

        let rawKbX = 150;
        if (attackDef) {
          if (typeof attackDef.knockbackX === 'number') rawKbX = attackDef.knockbackX;
          else if (attackDef.knockback && typeof attackDef.knockback.x === 'number') rawKbX = attackDef.knockback.x;
        }
        const kbX = rawKbX * sign;

        let kbY = -50;
        if (attackDef) {
          if (typeof attackDef.knockbackY === 'number') kbY = attackDef.knockbackY;
          else if (attackDef.knockback && typeof attackDef.knockback.y === 'number') kbY = attackDef.knockback.y;
        }

        other._knockback = {
          duration: 0.25,
          velocityX: kbX,
          velocityY: kbY
        };

        if (other.components && other.components.Physics) {
          other.components.Physics.velocityX = kbX;
          other.components.Physics.velocityY = kbY;
          other.components.Physics.isGrounded = false;
          other.components.Physics._isIntentionalMove = true;
        }

        if (other.components && other.components.Transform) {
          const nudgeX = (kbX > 0 ? 12 : -12);
          other.components.Transform.x += nudgeX;
          other.components.Transform.y -= 6;
        }

        outputs.onHit = true;
        outputs.hitTarget = other.id || other.scriptId || '';
        outputs.damage = dmg;
      }
    } else {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
    }

    if (isAnimFinished) {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
      if (cState.bufferAttack && isGrounded && attackCooldown <= 0) {
        triggerAttack(cState.currentCombo + 1);
      } else {
        cState.isAttacking = false;
        cState.comboTimer = comboBufferTime;
        if (attackCooldown > 0) {
          cState.cooldownTimer = attackCooldown;
        }
        outputs.onAttackEnd = true;
      }
    }
  }

  const canMove = !(autoLockMovement && cState.isAttacking && isGrounded);

  outputs.execOut = true;
  outputs.isAttacking = cState.isAttacking;
  outputs.canMove = canMove;
  outputs.isCoolingDown = cState.cooldownTimer > 0;
  outputs.cooldownRemaining = Math.max(0, cState.cooldownTimer || 0);
  outputs.currentCombo = cState.currentCombo;
  outputs.currentClip = animator ? (animator.currentClip || cState.activeClipId || '') : (cState.activeClipId || '');
  if (!outputs.damage) outputs.damage = cState.currentAttackDef ? (cState.currentAttackDef.damage || 0) : 0;
  if (!outputs.hitTarget) outputs.hitTarget = '';
  const result = {
    execOut: true,
    onAttackStart: Boolean(outputs.onAttackStart),
    onHitboxActive: Boolean(outputs.onHitboxActive),
    onHit: Boolean(outputs.onHit),
    onAttackEnd: Boolean(outputs.onAttackEnd),
    isAttacking: outputs.isAttacking,
    canMove: outputs.canMove,
    isCoolingDown: outputs.isCoolingDown,
    cooldownRemaining: outputs.cooldownRemaining,
    currentCombo: outputs.currentCombo,
    currentClip: outputs.currentClip,
    hitTarget: outputs.hitTarget,
    damage: outputs.damage
  };
  Object.assign(outputs, result);
  return result;
}

export function processEnemyCombat(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = target.components && target.components.SpriteAnimator;
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!target._combat) {
    target._combat = {
      isAttacking: false,
      cooldownTimer: 0,
      hasTriggeredHitboxActive: false,
      hitEntitiesThisAttack: [],
      lastFacing: 'right',
      activeClipId: ''
    };
  }
  const cState = target._combat;

  if (cState.cooldownTimer > 0) {
    cState.cooldownTimer = Math.max(0, cState.cooldownTimer - dt);
  }

  let facing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (facing !== 'left' && facing !== 'right') {
    if (target._ai && target._ai.facing) {
      facing = target._ai.facing;
    } else if (phys && (phys.facingDirection === 'left' || phys.facingDirection === 'right')) {
      facing = phys.facingDirection;
    } else if (transform && typeof transform.flipX === 'boolean') {
      facing = transform.flipX ? 'left' : 'right';
    } else {
      facing = cState.lastFacing || 'right';
    }
  }
  cState.lastFacing = facing;

  let hb = inputs.hitboxConfig;
  if (!hb && node && node.data && node.data.values && node.data.values.hitboxConfig) {
    hb = node.data.values.hitboxConfig;
  }
  if (typeof hb === 'string') {
    try { hb = JSON.parse(hb); } catch (e) { hb = null; }
  }
  const hitbox = (hb && typeof hb === 'object') ? hb : { offsetX: 30, offsetY: 0, width: 36, height: 32 };

  const attackClipName = String(inputs.attackClip || (node && node.data && node.data.values && node.data.values.attackClip) || 'attack').trim();
  const attackCooldown = typeof inputs.attackCooldown === 'number' ? inputs.attackCooldown : 1.5;
  const startFrame = typeof inputs.startFrame === 'number' ? inputs.startFrame : 1;
  const endFrame = typeof inputs.endFrame === 'number' ? inputs.endFrame : 3;
  const damage = typeof inputs.damage === 'number' ? inputs.damage : 10;
  const knockbackX = typeof inputs.knockbackX === 'number' ? inputs.knockbackX : 180;
  const knockbackY = typeof inputs.knockbackY === 'number' ? inputs.knockbackY : -60;
  const autoTriggerInRange = inputs.autoTriggerInRange !== false && inputs.autoTriggerInRange !== 'false';

  function findClip(clips, clipName) {
    if (!clips || !clipName) return null;
    const arr = Array.isArray(clips) ? clips : Object.values(clips);
    const targetLower = String(clipName).trim().toLowerCase();
    return arr.find(c =>
      c.id === clipName ||
      c.scriptId === clipName ||
      c.name === clipName ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) || null;
  }

  function startAttack() {
    cState.isAttacking = true;
    cState.hasTriggeredHitboxActive = false;
    cState.hitEntitiesThisAttack = [];

    if (animator && attackClipName) {
      const rawClips = animator.clips;
      const clipObj = findClip(rawClips, attackClipName);
      const resolvedId = clipObj ? clipObj.id : attackClipName;
      animator.currentClip = resolvedId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (clipObj) clipObj.frameIndex = 0;
      cState.activeClipId = resolvedId;
    }

    outputs.onAttackStart = true;
  }

  const canAttack = !cState.isAttacking && cState.cooldownTimer <= 0;
  const isExplicitTrigger = Boolean(inputs.triggerAttack === true);
  const isInRange = Boolean(target._ai && target._ai.inAttackRange);

  if (canAttack && (isExplicitTrigger || (autoTriggerInRange && isInRange))) {
    startAttack();
  }

  if (cState.isAttacking) {
    const activeClipId = animator ? (animator.currentClip || cState.activeClipId) : cState.activeClipId;
    const rawClips = animator ? animator.clips : [];
    const clipObj = findClip(rawClips, activeClipId);

    const currentFrame = (clipObj && typeof clipObj.frameIndex === 'number') ? clipObj.frameIndex : 0;
    const totalFrames = (clipObj && Array.isArray(clipObj.frames)) ? clipObj.frames.length : 1;
    const isAnimFinished = animator ? (!animator.isPlaying || currentFrame >= totalFrames - 1) : false;

    const isHitboxFrame = (currentFrame >= startFrame && currentFrame <= endFrame);
    const colScriptId = hitbox ? (hitbox.colliderScriptId || (node && node.data && node.data.values && node.data.values.colliderScriptId)) : null;

    if (isHitboxFrame) {
      if (!cState.hasTriggeredHitboxActive) {
        outputs.onHitboxActive = true;
        cState.hasTriggeredHitboxActive = true;
      }

      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, true);
      }

      const playerTag = String(inputs.playerTag || 'player').trim();
      const sign = (facing === 'left') ? -1 : 1;
      let hitCandidates = [];

      if (colScriptId && context.collider && typeof context.collider.checkHitbox === 'function') {
        const hits = context.collider.checkHitbox(target, colScriptId, playerTag, ['hurtbox', 'solid', 'trigger']) || [];
        hitCandidates = hits.map(h => h.entity);
      } else {
        let candidates = [];
        if (context.entity && typeof context.entity.getAllByTag === 'function') {
          candidates = context.entity.getAllByTag(playerTag) || [];
          if (candidates.length === 0 && playerTag.toLowerCase() !== playerTag) {
            candidates = context.entity.getAllByTag(playerTag.toLowerCase()) || [];
          }
        }
        if (candidates.length === 0 && context.entity && typeof context.entity.get === 'function') {
          const byName = context.entity.get(playerTag) || context.entity.get(playerTag.toLowerCase());
          if (byName) candidates = [byName];
        }

        if (candidates.length > 0) {
          let hbW = 36;
          let hbH = 32;
          let hbOffX = 30;
          let hbOffY = 0;
          if (colScriptId && target.components && target.components.Collider && target.components.Collider.data) {
            const colShape = target.components.Collider.data.find(s => s.scriptId === colScriptId || s.id === colScriptId);
            if (colShape) {
              hbW = Number(colShape.width || 36);
              hbH = Number(colShape.height || 32);
              hbOffX = Number(colShape.offsetX || 0);
              hbOffY = Number(colShape.offsetY || 0);
            }
          } else {
            hbW = Number(hitbox.width || 36);
            hbH = Number(hitbox.height || 32);
            hbOffX = typeof hitbox.offsetX === 'number' ? hitbox.offsetX : 30;
            hbOffY = typeof hitbox.offsetY === 'number' ? hitbox.offsetY : 0;
          }

          const hbCenterX = (transform ? transform.x : 0) + (hbOffX * sign);
          const hbCenterY = (transform ? transform.y : 0) + hbOffY;
          const hbMinX = hbCenterX - (hbW * 0.5);
          const hbMaxX = hbCenterX + (hbW * 0.5);
          const hbMinY = hbCenterY - (hbH * 0.5);
          const hbMaxY = hbCenterY + (hbH * 0.5);

          for (let i = 0; i < candidates.length; i++) {
            const player = candidates[i];
            if (!player || player.active === false || player.id === target.id) continue;
            if (cState.hitEntitiesThisAttack.includes(player.id)) continue;

            let overlaps = false;
            const playerCollider = player.components && player.components.Collider;
            if (playerCollider && Array.isArray(playerCollider.data) && playerCollider.data.length > 0) {
              const playerT = player.components.Transform || { x: 0, y: 0, width: 32, height: 32 };
              for (const cB of playerCollider.data) {
                if (cB.enabled === false) continue;
                const bW = Number(cB.width || playerT.width || 32);
                const bH = Number(cB.height || playerT.height || 32);
                const bX = (playerT.x || 0) + Number(cB.offsetX || 0);
                const bY = (playerT.y || 0) + Number(cB.offsetY || 0);
                if (hbMinX < (bX + bW * 0.5) && hbMaxX > (bX - bW * 0.5) &&
                    hbMinY < (bY + bH * 0.5) && hbMaxY > (bY - bH * 0.5)) {
                  overlaps = true;
                  break;
                }
              }
            }

            if (!overlaps) {
              const pT = player.components && (player.components.Transform || player.components.UITransform);
              if (pT) {
                const pW = (pT.width || 32) * Math.abs(typeof pT.scaleX === 'number' ? pT.scaleX : 1);
                const pH = (pT.height || 32) * Math.abs(typeof pT.scaleY === 'number' ? pT.scaleY : 1);
                const pPivotX = typeof pT.pivotX === 'number' ? pT.pivotX : 0.5;
                const pPivotY = typeof pT.pivotY === 'number' ? pT.pivotY : 0.5;
                const pMinX = pT.x - (pW * pPivotX);
                const pMaxX = pMinX + pW;
                const pMinY = pT.y - (pH * pPivotY);
                const pMaxY = pMinY + pH;
                overlaps = (hbMinX < pMaxX && hbMaxX > pMinX && hbMinY < pMaxY && hbMaxY > pMinY);
              }
            }

            if (overlaps) {
              hitCandidates.push(player);
            }
          }
        }
      }

      for (let i = 0; i < hitCandidates.length; i++) {
        const player = hitCandidates[i];
        if (!player || cState.hitEntitiesThisAttack.includes(player.id)) continue;
        cState.hitEntitiesThisAttack.push(player.id);
        
        if (player.components && player.components.Health) {
          const curHp = typeof player.components.Health.current === 'number' ? player.components.Health.current : 100;
          player.components.Health.current = Math.max(0, curHp - damage);
        } else if (typeof player.hp === 'number') {
          player.hp = Math.max(0, player.hp - damage);
        }

        const kbX = knockbackX * sign;
        const kbY = knockbackY;

        player._knockback = {
          duration: 0.25,
          velocityX: kbX,
          velocityY: kbY
        };

        if (player.components && player.components.Physics) {
          player.components.Physics.velocityX = kbX;
          player.components.Physics.velocityY = kbY;
          player.components.Physics.isGrounded = false;
          player.components.Physics._isIntentionalMove = true;
        }

        if (player.components && player.components.Transform) {
          const nudgeX = (kbX > 0 ? 12 : -12);
          player.components.Transform.x += nudgeX;
          player.components.Transform.y -= 6;
        }

        outputs.onHit = true;
        outputs.hitPlayer = player.id || player.scriptId || '';
        outputs.damageDealt = damage;
      }
    } else {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
    }

    if (isAnimFinished) {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
      cState.isAttacking = false;
      if (attackCooldown > 0) {
        cState.cooldownTimer = attackCooldown;
      }
      outputs.onAttackEnd = true;
    }
  }

  outputs.execOut = true;
  outputs.isAttacking = cState.isAttacking;
  outputs.isCoolingDown = cState.cooldownTimer > 0;
  outputs.cooldownRemaining = Math.max(0, cState.cooldownTimer || 0);
  outputs.currentClip = animator ? (animator.currentClip || cState.activeClipId || '') : (cState.activeClipId || '');
  if (!outputs.damageDealt) outputs.damageDealt = 0;
  if (!outputs.hitPlayer) outputs.hitPlayer = '';
  const result = {
    execOut: true,
    onAttackStart: Boolean(outputs.onAttackStart),
    onHitboxActive: Boolean(outputs.onHitboxActive),
    onHit: Boolean(outputs.onHit),
    onAttackEnd: Boolean(outputs.onAttackEnd),
    isAttacking: outputs.isAttacking,
    isCoolingDown: outputs.isCoolingDown,
    cooldownRemaining: outputs.cooldownRemaining,
    currentClip: outputs.currentClip,
    damageDealt: outputs.damageDealt,
    hitPlayer: outputs.hitPlayer
  };
  Object.assign(outputs, result);
  return result;
}

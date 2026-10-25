import PointerRaycast from '../../System/PointerRaycast.js';

export class UIContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  isEntityInteractable(entity, context = null) {
    if (!entity || entity._isDestroyed) return false;
    const game = this.game || context?.game;
    const world = game?.world || context?.runner?.world;

    if (world && typeof PointerRaycast._isEntityAndParentsActive === 'function') {
      if (!PointerRaycast._isEntityAndParentsActive(entity, world)) return false;
    } else {
      if (entity.active === false || entity.visible === false) return false;
    }

    if (game?.layerSystem && typeof game.layerSystem.isEntityInputFrozen === 'function') {
      if (game.layerSystem.isEntityInputFrozen(entity, 'pointer')) return false;
    }

    if (world && typeof PointerRaycast._findEntityLayer === 'function') {
      const layer = PointerRaycast._findEntityLayer(world, entity);
      if (layer) {
        if (layer.active === false || layer.visible === false) return false;
        if (game?.layerSystem && typeof game.layerSystem.isInputFrozen === 'function') {
          if (game.layerSystem.isInputFrozen(layer.id, 'pointer', entity)) return false;
        } else if (layer.freezeInput && (layer.freezeInputType === 'all' || layer.freezeInputType === 'pointer')) {
          return false;
        }
      }
    }

    return true;
  }

  getGlobalTransform(entity, context) {
    if (!entity) return { x: 0, y: 0 };
    const game = this.game;
    const uiWidth = (game.world && game.world.settings && game.world.settings.ui && game.world.settings.ui.width) || 1920;
    const uiHeight = (game.world && game.world.settings && game.world.settings.ui && game.world.settings.ui.height) || 1080;

    let cur = entity;
    let gx = 0;
    let gy = 0;
    while (cur) {
      const t = cur.components && (cur.components.UITransform || cur.components.Transform);
      if (t) {
        gx += (typeof t.x === 'number' ? t.x : 0);
        gy += (typeof t.y === 'number' ? t.y : 0);
      }
      if (cur.parentId && context && context.entity && typeof context.entity.get === 'function') {
        cur = context.entity.get(cur.parentId);
      } else if (cur.parentId && game.world && game.world.entities) {
        cur = game.world.entities.find(e => e.id === cur.parentId || e.scriptId === cur.parentId) || null;
      } else {
        if (t) {
          const aX = typeof t.anchorX === 'number' ? t.anchorX : 0.5;
          const aY = typeof t.anchorY === 'number' ? t.anchorY : 0.5;
          gx += (uiWidth * aX);
          gy += (uiHeight * aY);
        }
        break;
      }
    }
    return { x: gx, y: gy };
  }

  isPointerOver(entity, padX = 0, padY = 0, context = null) {
    if (!entity) return false;
    if (!this.isEntityInteractable(entity, context)) return false;
    const game = this.game || context?.game;
    const input = (context && context.input) || (game && game.input);

    if (input && typeof input.isPointerOver === 'function') {
      try {
        if (input.isPointerOver(entity, true) || input.isPointerOver(entity, false)) return true;
        return false;
      } catch (err) {}
    }

    const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(entity) || input.getPointer()) : null;
    if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;

    const t = entity.components && (entity.components.UITransform || entity.components.Transform);
    if (!t) return false;

    const px = pointer.x;
    const py = pointer.y;
    const w = t.width || 40;
    const h = t.height || 40;
    const pX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
    const pY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;
    const gt = this.getGlobalTransform(entity, context);
    const left = gt.x - (pX * w);
    const right = left + w;
    const top = gt.y - (pY * h);
    const bottom = top + h;

    return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
  }

  resolveAudioBus(key) {
    const k = String(key || '').toLowerCase().trim();
    if (k === 'vocal' || k === 'voice') return 'voice';
    if (k === 'background' || k === 'bgm') return 'background';
    if (k === 'master') return 'master';
    if (k === 'sfx') return 'sfx';
    return k;
  }

  updateSliderVisual(s, volume, context) {
    if (!s || !s.tBar) return;

    const rawVol = Number(volume);
    const clampedVol = Math.max(0, Math.min(100, isNaN(rawVol) ? 0 : rawVol));
    s.currentVolume = clampedVol;
    const f = clampedVol / 100;

    const w = Math.max(0, s.baseW * f);
    s.tBar.width = w;
    s.tBar.x = s.baseX - (s.pivotX * s.baseW * (1 - f));

    if (s.shape) {
      s.shape.width = w;
    }
    if (s.sprite) {
      s.sprite.sourceX = s.baseSX;
      s.sprite.sourceWidth = Math.max(0, s.baseSW * f);
    }

    if (s.tHandler) {
      if (s.isChild) {
        s.tHandler.x = (s.baseX - (s.pivotX * s.baseW) + (f * s.baseW)) - s.tBar.x;
      } else {
        const localLeft = s.baseX - (s.pivotX * s.baseW);
        s.tHandler.x = localLeft + (f * s.baseW);
      }
    }

    let indicatorComp = s.indicatorTextComp;
    if (!indicatorComp && context && context.entity && typeof context.entity.get === 'function') {
      if (!s.indicatorEntity && s.indicatorName) {
        s.indicatorEntity = context.entity.get(s.indicatorName);
      }
      if (s.indicatorEntity) {
        if (s.indicatorEntity.components && s.indicatorEntity.components.TextRenderer) {
          indicatorComp = s.indicatorEntity.components.TextRenderer;
          s.indicatorTextComp = indicatorComp;
        } else if (s.indicatorEntity.children && Array.isArray(s.indicatorEntity.children)) {
          for (const childId of s.indicatorEntity.children) {
            const childEnt = context.entity.get(childId);
            if (childEnt && childEnt.components && childEnt.components.TextRenderer) {
              indicatorComp = childEnt.components.TextRenderer;
              s.indicatorTextComp = indicatorComp;
              break;
            }
          }
        }
      }
    }

    if (indicatorComp) {
      const rounded = Math.round(clampedVol);
      const template = (typeof s.format === 'string' && s.format) ? s.format : '{value}%';
      indicatorComp.value = template.replace('{value}', rounded);
    }
  }

  isPointerOverSlider(s, px, py, context) {
    if (!s || !s.barEntity || !s.tBar) return false;

    if (!this.isEntityInteractable(s.barEntity, context) || (s.handlerEntity && !this.isEntityInteractable(s.handlerEntity, context))) {
      return false;
    }

    const input = (context && context.input) || (this.game && this.game.input);
    if (input && typeof input.isPointerOver === 'function') {
      try {
        if (handlerInteractable && s.handlerEntity && (input.isPointerOver(s.handlerEntity, true) || input.isPointerOver(s.handlerEntity, false))) {
          return true;
        }
        if (barInteractable && s.barEntity && (input.isPointerOver(s.barEntity, true) || input.isPointerOver(s.barEntity, false))) {
          return true;
        }
        return false;
      } catch (err) {}
    }

    const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(s.barEntity) || input.getPointer(s.handlerEntity) || input.getPointer()) : null;
    if (!pointer) return false;

    const left = s.screenLeft;
    const right = s.screenRight;
    const top = s.screenTop;
    const bottom = s.screenBottom;

    const padX = 20;
    const padY = Math.max(25, s.baseH);

    return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
  }

  processVolumeSliders(stateOrParams, configOrCtx, inputsMaybe, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !inputsMaybe);
    const inputs = isDirect ? stateOrParams : (inputsMaybe || {});
    const context = isDirect ? configOrCtx : contextMaybe;
    const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
    const configInput = isDirect ? (inputs && inputs.config ? inputs.config : false) : configOrCtx;
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

    const updateSliderVisual = (s, v) => this.updateSliderVisual(s, v, context);
    const isPointerOverSlider = (s, px, py) => this.isPointerOverSlider(s, px, py, context);

    let config = inputs.config;
    if (!config && configInput) {
      config = configInput;
    }
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = false;
      }
    }

    const defaultConfig = {
      master: { bar: 'VolumeMasterBar', handler: 'VolumeMasterHandler', indicator: 'VolumeMasterIndicator' },
      vocal: { bar: 'VolumeVocalBar', handler: 'VolumeVocalHandler', indicator: 'VolumeVocalIndicator' },
      sfx: { bar: 'VolumeSFXBar', handler: 'VolumeSFXHandler', indicator: 'VolumeSFXIndicator' },
      background: { bar: 'VolumeBGMBar', handler: 'VolumeBGMHandler', indicator: 'VolumeBGMIndicator' }
    };

    let sliderMap = defaultConfig;
    if (config && typeof config === 'object') {
      sliderMap = config;
    }

    if (!state.sliders) {
      state.sliders = {};
    }

    if (!state.isInitialized || state.activeConfig !== config) {
      state.isInitialized = true;
      state.activeConfig = config;

      for (const existingKey of Object.keys(state.sliders)) {
        if (!sliderMap[existingKey]) {
          delete state.sliders[existingKey];
        }
      }

      for (const [key, item] of Object.entries(sliderMap)) {
        if (!item || typeof item !== 'object') continue;
        if (!item.bar || typeof item.bar !== 'string') continue;

        const barName = item.bar.trim();
        if (!barName) continue;

        let barEntity = false;
        if (context && context.entity && typeof context.entity.get === 'function') {
          barEntity = context.entity.get(barName);
        }
        if (!barEntity) {
          if (context && context.console && typeof context.console.warn === 'function') {
            context.console.warn('[VolumeSlider] Bar entity not found: ' + barName);
          }
          continue;
        }

        const tBar = barEntity.components && (barEntity.components.UITransform || barEntity.components.Transform);
        if (!tBar) continue;

        let handlerEntity = false;
        if (item.handler && typeof item.handler === 'string') {
          const handlerName = item.handler.trim();
          if (handlerName && context && context.entity && typeof context.entity.get === 'function') {
            handlerEntity = context.entity.get(handlerName);
          }
        }

        let indicatorEntity = false;
        let indicatorTextComp = false;
        let indicatorName = '';
        if (item.indicator && typeof item.indicator === 'string') {
          indicatorName = item.indicator.trim();
          if (indicatorName && context && context.entity && typeof context.entity.get === 'function') {
            indicatorEntity = context.entity.get(indicatorName);
          }
          if (indicatorEntity) {
            if (indicatorEntity.components && indicatorEntity.components.TextRenderer) {
              indicatorTextComp = indicatorEntity.components.TextRenderer;
            } else if (indicatorEntity.children && Array.isArray(indicatorEntity.children) && context && context.entity && typeof context.entity.get === 'function') {
              for (const childId of indicatorEntity.children) {
                const childEnt = context.entity.get(childId);
                if (childEnt && childEnt.components && childEnt.components.TextRenderer) {
                  indicatorTextComp = childEnt.components.TextRenderer;
                  break;
                }
              }
            }
          }
        }

        const tHandler = handlerEntity && handlerEntity.components ? (handlerEntity.components.UITransform || handlerEntity.components.Transform) : false;
        const sprite = barEntity.components ? barEntity.components.SpriteRenderer : false;
        const shape = barEntity.components ? barEntity.components.ShapeRenderer : false;
        const audioBus = this.resolveAudioBus(key);

        const isChild = Boolean(
          handlerEntity && barEntity && handlerEntity.parentId &&
          (handlerEntity.parentId === barEntity.id || handlerEntity.parentId === barEntity.scriptId)
        );
        const baseW = typeof tBar._baseWidth === 'number' ? tBar._baseWidth : (tBar.width || 100);
        const baseH = typeof tBar._baseHeight === 'number' ? tBar._baseHeight : (tBar.height || 100);
        const baseX = typeof tBar._baseX === 'number' ? tBar._baseX : (typeof tBar.x === 'number' ? tBar.x : 0);
        const baseY = typeof tBar._baseY === 'number' ? tBar._baseY : (typeof tBar.y === 'number' ? tBar.y : 0);
        tBar._baseWidth = baseW;
        tBar._baseHeight = baseH;
        tBar._baseX = baseX;
        tBar._baseY = baseY;

        const pivotX = typeof tBar.pivotX === 'number' ? tBar.pivotX : 0.5;
        const pivotY = typeof tBar.pivotY === 'number' ? tBar.pivotY : 0.5;
        const anchorX = typeof tBar.anchorX === 'number' ? tBar.anchorX : 0.5;
        const anchorY = typeof tBar.anchorY === 'number' ? tBar.anchorY : 0.5;

        let baseSX = 0;
        let baseSY = 0;
        let baseSW = baseW;
        let baseSH = baseH;

        if (sprite) {
          baseSX = typeof sprite._baseSourceX === 'number' ? sprite._baseSourceX : (typeof sprite.sourceX === 'number' ? sprite.sourceX : 0);
          baseSY = typeof sprite._baseSourceY === 'number' ? sprite._baseSourceY : (typeof sprite.sourceY === 'number' ? sprite.sourceY : 0);
          baseSW = typeof sprite._baseSourceWidth === 'number' ? sprite._baseSourceWidth : (sprite.sourceWidth || baseW);
          baseSH = typeof sprite._baseSourceHeight === 'number' ? sprite._baseSourceHeight : (sprite.sourceHeight || baseH);
          sprite._baseSourceX = baseSX;
          sprite._baseSourceY = baseSY;
          sprite._baseSourceWidth = baseSW;
          sprite._baseSourceHeight = baseSH;
        }

        if (shape) {
          const baseShapeW = typeof shape._baseWidth === 'number' ? shape._baseWidth : (shape.width || baseW);
          const baseShapeH = typeof shape._baseHeight === 'number' ? shape._baseHeight : (shape.height || baseH);
          shape._baseWidth = baseShapeW;
          shape._baseHeight = baseShapeH;
        }

        const prevBarX = tBar.x;
        tBar.x = baseX;
        const barGT = this.getGlobalTransform(barEntity, context);
        tBar.x = prevBarX;

        const screenLeft = barGT.x - (pivotX * baseW);
        const screenRight = screenLeft + baseW;
        const screenTop = barGT.y - (pivotY * baseH);
        const screenBottom = screenTop + baseH;

        state.sliders[key] = {
          key,
          barEntity,
          handlerEntity,
          indicatorEntity,
          indicatorTextComp,
          indicatorName,
          format: (typeof item.format === 'string') ? item.format : '{value}%',
          tBar,
          tHandler,
          sprite,
          shape,
          audioBus,
          isChild,
          baseW,
          baseH,
          baseX,
          baseY,
          pivotX,
          pivotY,
          anchorX,
          anchorY,
          baseSX,
          baseSY,
          baseSW,
          baseSH,
          screenLeft,
          screenRight,
          screenTop,
          screenBottom,
          currentVolume: 100
        };

        const s = state.sliders[key];
        let vol = false;
        let hasAudioVol = false;

        if (context && context.audio && typeof context.audio.getVolume === 'function') {
          const existingVol = context.audio.getVolume(audioBus);
          if (typeof existingVol === 'number' && !isNaN(existingVol)) {
            vol = existingVol;
            hasAudioVol = true;
          }
        }

        if (vol === false) {
          if (typeof item.volume === 'number' && !isNaN(item.volume)) {
            vol = item.volume;
          } else if (typeof item.volume === 'string' && item.volume.trim() && !isNaN(Number(item.volume))) {
            vol = Number(item.volume);
          } else {
            vol = 100;
          }
          if (context && context.audio && typeof context.audio.setVolume === 'function' && !hasAudioVol) {
            context.audio.setVolume(audioBus, vol);
          }
        }

        updateSliderVisual(s, vol);
        if (!hasAudioVol && context && context.audio && typeof context.audio.setVolume === 'function') {
          context.audio.setVolume(audioBus, vol);
        }

        outputs[key + 'Volume'] = vol;
        outputs.currentVolume = vol;
      }
    }

    const syncExternal = () => {
      if (!context || !context.audio || typeof context.audio.getVolume !== 'function') return;
      if (!state.sliders) return;

      for (const [key, s] of Object.entries(state.sliders)) {
        if (!s || !s.tBar) continue;
        if (state.activeDraggingKey === key) continue;

        const rawBusVol = context.audio.getVolume(s.audioBus);
        if (typeof rawBusVol !== 'number' || isNaN(rawBusVol)) continue;
        const busVol = Math.max(0, Math.min(100, Math.round(rawBusVol)));

        if (busVol !== s.currentVolume) {
          updateSliderVisual(s, busVol);
          outputs[key + 'Volume'] = busVol;
          outputs.currentVolume = busVol;
          outputs.changedChannel = key;
        }
      }
    };

    const processPointer = () => {
      const input = (context && context.input) || (this.game && this.game.input);

      if (state.activeDraggingKey) {
        const activeS = state.sliders ? state.sliders[state.activeDraggingKey] : null;
        if (!activeS || (!this.isEntityInteractable(activeS.barEntity, context) && (!activeS.handlerEntity || !this.isEntityInteractable(activeS.handlerEntity, context)))) {
          state.activeDraggingKey = false;
        }
      }

      const activeS = state.activeDraggingKey && state.sliders ? state.sliders[state.activeDraggingKey] : null;
      const targetEntity = activeS ? (activeS.barEntity || activeS.handlerEntity) : null;
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(targetEntity) || input.getPointer()) : false;
      const mouse = input ? (typeof input.getMouse === 'function' ? (input.getMouse(targetEntity) || input.mouse) : input.mouse) : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

      if (!isDown) {
        state.activeDraggingKey = false;
        return;
      }

      if (!pointer) return;
      const px = pointer.x;
      const py = pointer.y;
      if (typeof px !== 'number' || typeof py !== 'number') return;

      if (!state.activeDraggingKey) {
        for (const [key, s] of Object.entries(state.sliders)) {
          if (s && isPointerOverSlider(s, px, py)) {
            state.activeDraggingKey = key;
            break;
          }
        }
      }

      if (state.activeDraggingKey) {
        const s = state.sliders ? state.sliders[state.activeDraggingKey] : false;
        if (!s || !s.barEntity || !s.tBar || (!this.isEntityInteractable(s.barEntity, context) && (!s.handlerEntity || !this.isEntityInteractable(s.handlerEntity, context)))) {
          state.activeDraggingKey = false;
          return;
        }

        const left = s.screenLeft;
        const right = s.screenRight;

        const clampedX = Math.min(Math.max(px, left), right);
        const fill = s.baseW > 0 ? ((clampedX - left) / s.baseW) : 0;
        const newVolume = Math.round(fill * 100);

        if (newVolume !== s.currentVolume) {
          updateSliderVisual(s, newVolume);

          if (context.audio && typeof context.audio.setVolume === 'function') {
            context.audio.setVolume(s.audioBus, newVolume);
          }

          outputs.changedChannel = s.key;
          outputs.currentVolume = newVolume;
          outputs[s.key + 'Volume'] = newVolume;
          outputs.onChanged = true;
          if (typeof context.triggerFlow === 'function') {
            context.triggerFlow('onChanged');
          }
        }
      }
    };

    syncExternal();
    processPointer();

    if (!state.hasTickListener && typeof context.onTick === 'function') {
      state.hasTickListener = true;
      state.activeDraggingKey = false;

      context.onTick(() => {
        syncExternal();
        processPointer();
      });
    }

    outputs.execOut = true;
    const result = {
      execOut: true,
      onChanged: Boolean(outputs.onChanged),
      changedChannel: outputs.changedChannel || '',
      currentVolume: typeof outputs.currentVolume === 'number' ? outputs.currentVolume : 0,
      masterVolume: typeof outputs.masterVolume === 'number' ? outputs.masterVolume : 100,
      vocalVolume: typeof outputs.vocalVolume === 'number' ? outputs.vocalVolume : 100,
      sfxVolume: typeof outputs.sfxVolume === 'number' ? outputs.sfxVolume : 100,
      backgroundVolume: typeof outputs.backgroundVolume === 'number' ? outputs.backgroundVolume : 100
    };
    Object.assign(outputs, result);
    return result;
  }

  processAtomicSlider(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const context = isDirect ? inputsOrContext : contextMaybe;
    const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
    const barName = typeof inputs.barEntity === 'string' ? inputs.barEntity.trim() : '';
    const handlerName = typeof inputs.handlerEntity === 'string' ? inputs.handlerEntity.trim() : '';

    let barEnt = false;
    if (barName && context && context.entity && typeof context.entity.get === 'function') {
      barEnt = context.entity.get(barName);
    }

    let handlerEnt = false;
    if (handlerName && context && context.entity && typeof context.entity.get === 'function') {
      handlerEnt = context.entity.get(handlerName);
    }

    if (!barEnt) {
      if (barName && context && context.console && typeof context.console.warn === 'function') {
        context.console.warn('[AtomicSlider] Bar entity not found: ' + barName);
      }
      outputs.execOut = true;
      return;
    }

    const tBar = barEnt.components && (barEnt.components.UITransform || barEnt.components.Transform);
    if (!tBar) {
      outputs.execOut = true;
      return;
    }

    const minVal = typeof inputs.min === 'number' ? inputs.min : 0;
    const rawMax = typeof inputs.max === 'number' ? inputs.max : 100;
    const maxVal = rawMax > minVal ? rawMax : (minVal + 1);
    const stepVal = typeof inputs.step === 'number' && inputs.step > 0 ? inputs.step : 0;
    const isInteractive = inputs.isInteractive !== false;
    const isReverse = inputs.reverse === true || inputs.reverse === 'true';

    function snapValue(val) {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      if (stepVal > 0) {
        const steps = Math.round((clamped - minVal) / stepVal);
        const snapped = minVal + (steps * stepVal);
        return Math.max(minVal, Math.min(maxVal, Number(snapped.toFixed(6))));
      }
      return clamped;
    }

    const self = this;

    if (!state.isInitialized) {
      state.isInitialized = true;
      state.isDragging = false;
      state.lastReverse = isReverse;

      const sprite = barEnt.components ? barEnt.components.SpriteRenderer : false;
      const shape = barEnt.components ? barEnt.components.ShapeRenderer : false;

      const isChild = Boolean(
        handlerEnt && barEnt && handlerEnt.parentId &&
        (handlerEnt.parentId === barEnt.id || handlerEnt.parentId === barEnt.scriptId)
      );

      const baseW = typeof tBar._baseWidth === 'number' ? tBar._baseWidth : (tBar.width || 100);
      const baseH = typeof tBar._baseHeight === 'number' ? tBar._baseHeight : (tBar.height || 100);
      const baseX = typeof tBar._baseX === 'number' ? tBar._baseX : (typeof tBar.x === 'number' ? tBar.x : 0);
      const baseY = typeof tBar._baseY === 'number' ? tBar._baseY : (typeof tBar.y === 'number' ? tBar.y : 0);
      tBar._baseWidth = baseW;
      tBar._baseHeight = baseH;
      tBar._baseX = baseX;
      tBar._baseY = baseY;

      const pivotX = typeof tBar.pivotX === 'number' ? tBar.pivotX : 0.5;
      const pivotY = typeof tBar.pivotY === 'number' ? tBar.pivotY : 0.5;

      let baseSX = 0;
      let baseSY = 0;
      let baseSW = baseW;
      let baseSH = baseH;

      if (sprite) {
        baseSX = typeof sprite._baseSourceX === 'number' ? sprite._baseSourceX : (typeof sprite.sourceX === 'number' ? sprite.sourceX : 0);
        baseSY = typeof sprite._baseSourceY === 'number' ? sprite._baseSourceY : (typeof sprite.sourceY === 'number' ? sprite.sourceY : 0);
        baseSW = typeof sprite._baseSourceWidth === 'number' ? sprite._baseSourceWidth : (sprite.sourceWidth || baseW);
        baseSH = typeof sprite._baseSourceHeight === 'number' ? sprite._baseSourceHeight : (sprite.sourceHeight || baseH);
        sprite._baseSourceX = baseSX;
        sprite._baseSourceY = baseSY;
        sprite._baseSourceWidth = baseSW;
        sprite._baseSourceHeight = baseSH;
      }

      if (shape) {
        const baseShapeW = typeof shape._baseWidth === 'number' ? shape._baseWidth : (shape.width || baseW);
        const baseShapeH = typeof shape._baseHeight === 'number' ? shape._baseHeight : (shape.height || baseH);
        shape._baseWidth = baseShapeW;
        shape._baseHeight = baseShapeH;
      }

      const prevBarX = tBar.x;
      tBar.x = baseX;
      const barGT = self.getGlobalTransform(barEnt, context);
      tBar.x = prevBarX;

      const screenLeft = barGT.x - (pivotX * baseW);
      const screenRight = screenLeft + baseW;
      const screenTop = barGT.y - (pivotY * baseH);
      const screenBottom = screenTop + baseH;

      state.baseW = baseW;
      state.baseH = baseH;
      state.baseX = baseX;
      state.baseY = baseY;
      state.pivotX = pivotX;
      state.pivotY = pivotY;
      state.baseSX = baseSX;
      state.baseSY = baseSY;
      state.baseSW = baseSW;
      state.baseSH = baseSH;
      state.screenLeft = screenLeft;
      state.screenRight = screenRight;
      state.screenTop = screenTop;
      state.screenBottom = screenBottom;
      state.isChild = isChild;

      const initialVal = typeof barEnt._atomicValue === 'number' ? barEnt._atomicValue : (typeof inputs.value === 'number' ? inputs.value : maxVal);
      state.value = snapValue(initialVal);
      barEnt._atomicValue = state.value;
      state.lastInputValue = inputs.value;
    }

    if (typeof inputs.value === 'number' && inputs.value !== state.lastInputValue && !state.isDragging) {
      state.lastInputValue = inputs.value;
      state.value = snapValue(inputs.value);
      barEnt._atomicValue = state.value;
    }

    function updateVisual(val) {
      const f = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
      const fVisual = isReverse ? (1 - f) : f;
      const baseW = state.baseW;
      const pivotX = state.pivotX;
      const baseX = state.baseX;
      const w = Math.max(0, baseW * fVisual);

      tBar.width = w;
      tBar.x = baseX - (pivotX * baseW * (1 - fVisual));

      if (barEnt.components && barEnt.components.ShapeRenderer) {
        barEnt.components.ShapeRenderer.width = w;
      }
      if (barEnt.components && barEnt.components.SpriteRenderer) {
        barEnt.components.SpriteRenderer.sourceX = state.baseSX;
        barEnt.components.SpriteRenderer.sourceWidth = Math.max(0, state.baseSW * fVisual);
      }

      const tHandler = handlerEnt && handlerEnt.components ? (handlerEnt.components.UITransform || handlerEnt.components.Transform) : false;
      if (tHandler) {
        if (state.isChild) {
          tHandler.x = (baseX - (pivotX * baseW) + (fVisual * baseW)) - tBar.x;
        } else {
          const localLeft = baseX - (pivotX * baseW);
          tHandler.x = localLeft + (fVisual * baseW);
        }
      }
    }

    if (state.lastReverse !== isReverse) {
      state.lastReverse = isReverse;
      updateVisual(state.value);
    }

    function isPointerOverSlider(px, py) {
      if (!self.isEntityInteractable(barEnt, context) || (handlerEnt && !self.isEntityInteractable(handlerEnt, context))) {
        return false;
      }

      const input = (context && context.input) || (self.game && self.game.input);
      if (input && typeof input.isPointerOver === 'function') {
        try {
          if (handlerInteractable && handlerEnt && (input.isPointerOver(handlerEnt, true) || input.isPointerOver(handlerEnt, false))) {
            return true;
          }
          if (barInteractable && barEnt && (input.isPointerOver(barEnt, true) || input.isPointerOver(barEnt, false))) {
            return true;
          }
          return false;
        } catch (err) {}
      }

      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(barEnt) || input.getPointer(handlerEnt) || input.getPointer()) : false;
      if (!pointer) return false;

      const left = state.screenLeft;
      const right = state.screenRight;
      const top = state.screenTop;
      const bottom = state.screenBottom;

      const padX = 20;
      const padY = Math.max(25, state.baseH);

      return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
    }

    function processPointer() {
      if (!isInteractive) return;

      if (!self.isEntityInteractable(barEnt, context) || (handlerEnt && !self.isEntityInteractable(handlerEnt, context))) {
        state.isDragging = false;
        return;
      }

      const input = (context && context.input) || (self.game && self.game.input);
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(barEnt) || input.getPointer(handlerEnt) || input.getPointer()) : false;
      const mouse = input ? (typeof input.getMouse === 'function' ? (input.getMouse(barEnt) || input.mouse) : input.mouse) : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

      if (!isDown) {
        state.isDragging = false;
        return;
      }

      if (!pointer) {
        state.isDragging = false;
        return;
      }
      const px = pointer.x;
      const py = pointer.y;
      if (typeof px !== 'number' || typeof py !== 'number') return;

      if (!state.isDragging) {
        if (isPointerOverSlider(px, py)) {
          state.isDragging = true;
        }
      }

      if (state.isDragging) {
        if (!self.isEntityInteractable(barEnt, context) && (!handlerEnt || !self.isEntityInteractable(handlerEnt, context))) {
          state.isDragging = false;
          return;
        }
        const left = state.screenLeft;
        const right = state.screenRight;
        const baseW = state.baseW;

        const clampedX = Math.min(Math.max(px, left), right);
        const fill = baseW > 0 ? ((clampedX - left) / baseW) : 0;
        const computedVal = isReverse
          ? (maxVal - (fill * (maxVal - minVal)))
          : (minVal + (fill * (maxVal - minVal)));
        const snappedVal = snapValue(computedVal);

        if (snappedVal !== state.value) {
          state.value = snappedVal;
          barEnt._atomicValue = snappedVal;
          updateVisual(snappedVal);

          const normalized = Math.max(0, Math.min(1, (snappedVal - minVal) / (maxVal - minVal)));
          outputs.value = snappedVal;
          outputs.normalized = Number(normalized.toFixed(4));
          outputs.onChanged = true;
          if (typeof context.triggerFlow === 'function') {
            context.triggerFlow('onChanged');
          }
        }
      }
    }

    updateVisual(state.value);
    processPointer();

    if (!state.hasTickListener && typeof context.onTick === 'function') {
      state.hasTickListener = true;
      context.onTick(() => {
        processPointer();
      });
    }

    const norm = Math.max(0, Math.min(1, (state.value - minVal) / (maxVal - minVal)));
    outputs.value = state.value;
    outputs.normalized = Number(norm.toFixed(4));
    outputs.execOut = true;
    const result = {
      execOut: true,
      value: outputs.value,
      normalized: outputs.normalized,
      onChanged: Boolean(outputs.onChanged)
    };
    Object.assign(outputs, result);
    return result;
  }

  processSwitchButton(stateOrParams, inputsOrContext, outputsMaybe, isImageMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 3 && typeof stateOrParams === 'object' && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const isImage = isDirect ? Boolean(outputsMaybe) : Boolean(isImageMaybe);
    const context = isDirect ? inputsOrContext : contextMaybe;
    const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
    const resolveEntity = (rawTarget, allowSelf = false) => {
      if (!rawTarget) {
        if (allowSelf) {
          if (context && context.entity && typeof context.entity.get === 'function') {
            try {
              const selfEnt = context.entity.get('self');
              if (selfEnt) return selfEnt;
            } catch (_) {}
          }
          if (context?.runner?.owner) return context.runner.owner;
          if (context?.owner) return context.owner;
        }
        return null;
      }

      if (typeof rawTarget === 'object') {
        return rawTarget;
      }

      if (typeof rawTarget !== 'string') return null;

      const targetStr = rawTarget.trim();
      if (!targetStr) {
        if (allowSelf) {
          if (context && context.entity && typeof context.entity.get === 'function') {
            try {
              const selfEnt = context.entity.get('self');
              if (selfEnt) return selfEnt;
            } catch (_) {}
          }
          if (context?.runner?.owner) return context.runner.owner;
          if (context?.owner) return context.owner;
        }
        return null;
      }

      if (targetStr.toLowerCase() === 'self') {
        if (context && context.entity && typeof context.entity.get === 'function') {
          try {
            const selfEnt = context.entity.get('self');
            if (selfEnt) return selfEnt;
          } catch (_) {}
        }
        if (context?.runner?.owner) return context.runner.owner;
        if (context?.owner) return context.owner;
      }

      if (context && context.entity && typeof context.entity.get === 'function') {
        try {
          const found = context.entity.get(targetStr);
          if (found) return found;
        } catch (_) {}
      }

      const entitySystem = (this.game && this.game.entitySystem) || (context?.game?.entitySystem);
      if (entitySystem && typeof entitySystem.getEntity === 'function') {
        try {
          const found = entitySystem.getEntity(targetStr, context?.runner?.owner || context?.owner);
          if (found) return found;
        } catch (_) {}
      }

      const world = (this.game && this.game.world) || (context?.game?.world);
      if (world) {
        if (world.scriptIdMap && typeof world.scriptIdMap.get === 'function') {
          const mapped = world.scriptIdMap.get(targetStr);
          if (mapped) return mapped;
        }

        const searchKey = targetStr;
        const searchLower = searchKey.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');

        const pool = [];
        if (Array.isArray(world.entities)) pool.push(...world.entities);
        const layers = world.allLayers || [];
        for (const l of layers) {
          if (Array.isArray(l.entities)) pool.push(...l.entities);
        }

        const owner = context?.runner?.owner || context?.owner;
        if (owner && Array.isArray(owner.children)) {
          for (const ch of owner.children) {
            if (ch && typeof ch === 'object') pool.push(ch);
          }
        }

        const found = pool.find(e => {
          if (!e) return false;
          if (e.id === searchKey || (e.id && String(e.id).toLowerCase() === searchLower)) return true;
          if (e.scriptId && (String(e.scriptId).toLowerCase() === searchLower || String(e.scriptId).toLowerCase() === searchSlug)) return true;
          if (e.name && (String(e.name).toLowerCase() === searchLower || String(e.name).toLowerCase() === searchSlug)) return true;
          return false;
        });

        if (found) return found;
      }

      return null;
    };

    const rawKnob = (inputs.knobEntity !== undefined && inputs.knobEntity !== '') ? inputs.knobEntity : inputs.targetEntity;
    const knobEnt = resolveEntity(rawKnob, true);
    const trackEnt = resolveEntity(inputs.trackEntity, false);
    const onTextEnt = resolveEntity(inputs.onTextEntity || inputs.textEntity, false);
    const offTextEnt = resolveEntity(inputs.offTextEntity, false);

    if (!knobEnt) {
      if (context && context.console && typeof context.console.warn === 'function') {
        const identifier = typeof rawKnob === 'string' ? rawKnob : (rawKnob?.scriptId || rawKnob?.id || '');
        if (identifier) {
          context.console.warn((isImage ? '[SwitchImage]' : '[SwitchShape]') + ' Knob entity not found: ' + identifier);
        }
      }
      const emptyRes = {
        execOut: true,
        isOn: Boolean(inputs.isOn),
        onOn: false,
        onOff: false
      };
      Object.assign(outputs, emptyRes);
      return emptyRes;
    }

    const self = this;

    function isPointerOverEntity(ent) {
      if (!ent) return false;
      if (!self.isEntityInteractable(ent, context)) return false;

      const input = (context && context.input) || (self.game && self.game.input);
      if (input && typeof input.isPointerOver === 'function') {
        try {
          if (input.isPointerOver(ent, true) || input.isPointerOver(ent, false)) {
            return true;
          }
          return false;
        } catch (err) {}
      }

      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(ent) || input.getPointer()) : false;
      if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;
      const t = ent.components && (ent.components.UITransform || ent.components.Transform);
      if (!t) return false;
      const px = pointer.x;
      const py = pointer.y;
      const w = t.width || 40;
      const h = t.height || 40;
      const pX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
      const pY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;
      const gt = self.getGlobalTransform(ent, context);
      const left = gt.x - (pX * w);
      const right = left + w;
      const top = gt.y - (pY * h);
      const bottom = top + h;
      const pad = 10;
      return (px >= left - pad && px <= right + pad && py >= top - pad && py <= bottom + pad);
    }

    function applyShapeColor(ent, colorHex) {
      if (!ent || !ent.components || !ent.components.ShapeRenderer || !colorHex) return;
      const sh = ent.components.ShapeRenderer;
      sh.color = colorHex;
      if (Array.isArray(sh.elements)) {
        for (const el of sh.elements) {
          if (el) {
            el.color = colorHex;
            el.fill = colorHex;
          }
        }
      }
    }

    if (!state.isInitialized) {
      state.isInitialized = true;
      const initialIsOn = typeof knobEnt._switchIsOn === 'boolean'
        ? knobEnt._switchIsOn
        : (trackEnt && typeof trackEnt._switchIsOn === 'boolean' ? trackEnt._switchIsOn : Boolean(inputs.isOn));
      state.isOn = initialIsOn;
      state.lastInputIsOn = inputs.isOn;
      state.progress = state.isOn ? 1 : 0;
      state.wasDown = false;

      const tKnob = knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
      if (tKnob) {
        if (typeof tKnob._switchOffX === 'number' && typeof tKnob._switchOnX === 'number') {
          state.offX = tKnob._switchOffX;
          state.onX = tKnob._switchOnX;
        } else {
          const baseX = typeof tKnob._baseX === 'number' ? tKnob._baseX : (typeof tKnob.x === 'number' ? tKnob.x : 0);
          tKnob._baseX = baseX;
          const defaultSlideDist = typeof inputs.slideDist === 'number' ? inputs.slideDist : 40;
          let travelDist = defaultSlideDist;

          if (trackEnt) {
            const tTrack = trackEnt.components && (trackEnt.components.UITransform || trackEnt.components.Transform);
            if (tTrack && typeof tTrack.width === 'number' && typeof tKnob.width === 'number') {
              const isChild = Boolean(
                knobEnt.parentId &&
                (knobEnt.parentId === trackEnt.id || knobEnt.parentId === trackEnt.scriptId)
              );
              if (isChild) {
                const trackW = tTrack.width;
                const knobW = tKnob.width;
                const pad = Math.max(2, Math.round(((tTrack.height || 30) - (tKnob.height || 26)) / 2));
                const pTrackX = typeof tTrack.pivotX === 'number' ? tTrack.pivotX : 0.5;
                const pKnobX = typeof tKnob.pivotX === 'number' ? tKnob.pivotX : 0.5;
                const childOffX = (-pTrackX * trackW) + (pKnobX * knobW) + pad;
                const childOnX = (-pTrackX * trackW) + trackW - ((1 - pKnobX) * knobW) - pad;
                state.offX = childOffX;
                state.onX = childOnX;
                travelDist = false;
              } else {
                const diff = tTrack.width - tKnob.width - 4;
                if (diff > 0) {
                  travelDist = diff;
                }
              }
            }
          }

          if (travelDist !== false) {
            if (Boolean(inputs.isOn)) {
              state.onX = baseX;
              state.offX = baseX - travelDist;
            } else {
              state.offX = baseX;
              state.onX = baseX + travelDist;
            }
          }

          tKnob._switchOffX = state.offX;
          tKnob._switchOnX = state.onX;
        }

        knobEnt._switchIsOn = state.isOn;
        if (trackEnt) {
          trackEnt._switchIsOn = state.isOn;
        }

        const prevKnobX = tKnob.x;
        tKnob.x = state.offX;
        const knobGT = self.getGlobalTransform(knobEnt, context);
        tKnob.x = prevKnobX;

        const knobW = tKnob.width || 40;
        const knobH = tKnob.height || 40;
        const pKnobX = typeof tKnob.pivotX === 'number' ? tKnob.pivotX : 0.5;
        const pKnobY = typeof tKnob.pivotY === 'number' ? tKnob.pivotY : 0.5;

        const top = knobGT.y - (pKnobY * knobH);
        const bottom = top + knobH;

        const minX = Math.min(state.offX, state.onX);
        const maxX = Math.max(state.offX, state.onX);
        const originShift = knobGT.x - state.offX;
        const left = originShift + minX - (pKnobX * knobW);
        const right = originShift + maxX - (pKnobX * knobW) + knobW;

        state.screenLeft = left;
        state.screenRight = right;
        state.screenTop = top;
        state.screenBottom = bottom;
      }
    }

    if (typeof inputs.isOn === 'boolean' && inputs.isOn !== state.lastInputIsOn) {
      state.lastInputIsOn = inputs.isOn;
      state.isOn = inputs.isOn;
      knobEnt._switchIsOn = inputs.isOn;
      if (trackEnt) {
        trackEnt._switchIsOn = inputs.isOn;
      }
    }

    function applyVisuals(progress) {
      const tKnob = knobEnt && knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
      if (tKnob && typeof state.offX === 'number' && typeof state.onX === 'number') {
        const smoothProgress = progress * progress * (3 - (2 * progress));
        tKnob.x = state.offX + ((state.onX - state.offX) * smoothProgress);
      }

      const isVisuallyOn = progress >= 0.5;

      if (!isImage) {
        const knobColor = isVisuallyOn ? (inputs.knobOnColor || '#FFFFFF') : (inputs.knobOffColor || '#E0E0E0');
        const trackColor = isVisuallyOn ? (inputs.trackOnColor || '#4CAF50') : (inputs.trackOffColor || '#757575');
        applyShapeColor(knobEnt, knobColor);
        if (trackEnt) {
          applyShapeColor(trackEnt, trackColor);
        }
      } else {
        const resolveAsset = (assetId) => {
          if (!assetId) return assetId;
          if (context && context.asset && typeof context.asset.resolveId === 'function') {
            const resolved = context.asset.resolveId(assetId);
            if (resolved) return resolved;
          }
          return assetId;
        };
        const knobImg = isVisuallyOn ? (inputs.knobOnImage || inputs.knobOffImage) : (inputs.knobOffImage || inputs.knobOnImage);
        const trackImg = isVisuallyOn ? (inputs.trackOnImage || inputs.trackOffImage) : (inputs.trackOffImage || inputs.trackOnImage);
        const finalKnobImg = resolveAsset(knobImg);
        const finalTrackImg = resolveAsset(trackImg);

        if (knobEnt && knobEnt.components && finalKnobImg) {
          const comp = knobEnt.components.SpriteRenderer || knobEnt.components.ImageRenderer;
          if (comp) comp.assetId = finalKnobImg;
        }
        if (trackEnt && trackEnt.components && finalTrackImg) {
          const comp = trackEnt.components.SpriteRenderer || trackEnt.components.ImageRenderer;
          if (comp) comp.assetId = finalTrackImg;
        }
      }

      if (onTextEnt && offTextEnt && onTextEnt !== offTextEnt) {
        if (onTextEnt.components && onTextEnt.components.TextRenderer) {
          const tx = onTextEnt.components.TextRenderer;
          if (inputs.onText) tx.value = inputs.onText;
          tx.color = isVisuallyOn ? (inputs.onTextColor || '#FFFFFF') : (inputs.offTextColor || '#757575');
          tx.opacity = isVisuallyOn ? 1 : 0.4;
        }
        if (offTextEnt && offTextEnt.components && offTextEnt.components.TextRenderer) {
          const tx = offTextEnt.components.TextRenderer;
          if (inputs.offText) tx.value = inputs.offText;
          tx.color = isVisuallyOn ? (inputs.offTextColor || '#757575') : (inputs.onTextColor || '#FFFFFF');
          tx.opacity = isVisuallyOn ? 0.4 : 1;
        }
      } else if (onTextEnt && onTextEnt.components && onTextEnt.components.TextRenderer) {
        const tx = onTextEnt.components.TextRenderer;
        const txt = isVisuallyOn ? (inputs.onText || 'ON') : (inputs.offText || 'OFF');
        const col = isVisuallyOn ? (inputs.onTextColor || '#FFFFFF') : (inputs.offTextColor || '#BDBDBD');
        if (txt) tx.value = txt;
        if (col) tx.color = col;
      }
    }

    applyVisuals(state.progress);

    function isPointerOverSwitch() {
      if (!self.isEntityInteractable(knobEnt, context) || (trackEnt && !self.isEntityInteractable(trackEnt, context))) {
        return false;
      }

      if (isPointerOverEntity(knobEnt)) return true;
      if (trackEnt && isPointerOverEntity(trackEnt)) return true;
      if (onTextEnt && isPointerOverEntity(onTextEnt)) return true;
      if (offTextEnt && isPointerOverEntity(offTextEnt)) return true;

      const input = (context && context.input) || (self.game && self.game.input);
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(knobEnt) || input.getPointer()) : false;
      if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;

      const px = pointer.x;
      const py = pointer.y;
      const padX = 10;
      const padY = 10;
      const sLeft = state.screenLeft;
      const sRight = state.screenRight;
      const sTop = state.screenTop;
      const sBottom = state.screenBottom;

      if (typeof sLeft === 'number' && typeof sRight === 'number' && typeof sTop === 'number' && typeof sBottom === 'number') {
        if (px >= sLeft - padX && px <= sRight + padX && py >= sTop - padY && py <= sBottom + padY) {
          return true;
        }
      }
      return false;
    }

    function updateStep() {
      if (!self.isEntityInteractable(knobEnt, context) || (trackEnt && !self.isEntityInteractable(trackEnt, context))) {
        state.wasDown = false;
        return;
      }

      const input = (context && context.input) || (self.game && self.game.input);
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(knobEnt) || input.getPointer()) : false;
      const mouse = input ? (typeof input.getMouse === 'function' ? (input.getMouse(knobEnt) || input.mouse) : input.mouse) : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);
      const isJustPressed = Boolean(isDown && !state.wasDown);
      state.wasDown = isDown;

      if (isJustPressed) {
        let triggered = false;
        let nextState = !state.isOn;

        if (offTextEnt && onTextEnt && offTextEnt !== onTextEnt) {
          if (isPointerOverEntity(offTextEnt)) {
            if (state.isOn) {
              nextState = false;
              triggered = true;
            }
          } else if (isPointerOverEntity(onTextEnt)) {
            if (!state.isOn) {
              nextState = true;
              triggered = true;
            }
          }
        }

        if (!triggered) {
          if (isPointerOverSwitch()) {
            nextState = !state.isOn;
            triggered = true;
          }
        }

        if (triggered) {
          state.isOn = nextState;
          knobEnt._switchIsOn = nextState;
          if (trackEnt) {
            trackEnt._switchIsOn = nextState;
          }
          outputs.isOn = state.isOn;
          if (state.isOn) {
            outputs.onOn = true;
            outputs.onOff = false;
            if (typeof context.triggerFlow === 'function') {
              context.triggerFlow('onOn');
            }
          } else {
            outputs.onOff = true;
            outputs.onOn = false;
            if (typeof context.triggerFlow === 'function') {
              context.triggerFlow('onOff');
            }
          }
        }
      }

      const dt = (context && context.game && typeof context.game.deltaTime === 'number')
        ? context.game.deltaTime
        : ((context && typeof context.dt === 'number') ? context.dt : 0.016);
      const duration = typeof inputs.duration === 'number' ? Math.max(0, inputs.duration) : 0.15;
      const targetProgress = state.isOn ? 1 : 0;

      if (duration <= 0) {
        if (state.progress !== targetProgress) {
          state.progress = targetProgress;
          applyVisuals(targetProgress);
        }
      } else if (state.progress !== targetProgress) {
        const step = dt / duration;
        if (state.progress < targetProgress) {
          state.progress = Math.min(targetProgress, state.progress + step);
        } else {
          state.progress = Math.max(targetProgress, state.progress - step);
        }
        applyVisuals(state.progress);
      }
    }

    updateStep();

    if (!state.hasTickListener && typeof context.onTick === 'function') {
      state.hasTickListener = true;
      context.onTick(() => {
        updateStep();
      });
    }

    outputs.isOn = state.isOn;
    outputs.execOut = true;
    const result = {
      execOut: true,
      isOn: outputs.isOn,
      onOn: Boolean(outputs.onOn),
      onOff: Boolean(outputs.onOff)
    };
    Object.assign(outputs, result);
    return result;
  }

  processGridSpawner(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const context = isDirect ? inputsOrContext : contextMaybe;
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

    const prefabName = typeof inputs.prefabName === 'string' ? inputs.prefabName.trim() : '';
    const rawTotal = typeof inputs.totalCount === 'number' ? inputs.totalCount : Number(inputs.totalCount);
    const totalCount = (!isNaN(rawTotal) && rawTotal >= 0) ? Math.floor(rawTotal) : 0;
    const rawCols = typeof inputs.columns === 'number' ? inputs.columns : Number(inputs.columns);
    const columns = (!isNaN(rawCols) && rawCols > 0) ? Math.floor(rawCols) : 5;
    const spacingX = typeof inputs.spacingX === 'number' ? inputs.spacingX : (Number(inputs.spacingX) || 0);
    const spacingY = typeof inputs.spacingY === 'number' ? inputs.spacingY : (Number(inputs.spacingY) || 0);
    const startX = typeof inputs.startX === 'number' ? inputs.startX : (Number(inputs.startX) || 0);
    const startY = typeof inputs.startY === 'number' ? inputs.startY : (Number(inputs.startY) || 0);
    const parentEntityName = typeof inputs.parentEntity === 'string' ? inputs.parentEntity.trim() : '';
    const layerId = typeof inputs.layerId === 'string' ? inputs.layerId.trim() : '';
    const dataList = Array.isArray(inputs.dataList) ? inputs.dataList : [];

    let parentEnt = null;
    if (parentEntityName && context && context.entity && typeof context.entity.get === 'function') {
      parentEnt = context.entity.get(parentEntityName);
    }

    const spawnedEntities = [];
    let lastSpawnedId = '';
    let lastIndex = 0;
    let lastRow = 0;
    let lastCol = 0;
    let lastData = null;

    if (!prefabName) {
      if (context && context.console && typeof context.console.warn === 'function') {
        context.console.warn('[UIGridSpawner] Prefab name is empty.');
      }
      const emptyResult = {
        execOut: true,
        onSpawnItem: false,
        spawnedEntity: '',
        itemIndex: 0,
        rowIndex: 0,
        colIndex: 0,
        itemData: null,
        spawnedEntities: []
      };
      Object.assign(outputs, emptyResult);
      return emptyResult;
    }

    for (let i = 0; i < totalCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      const posX = startX + (col * spacingX);
      const posY = startY + (row * spacingY);

      const itemData = i < dataList.length ? dataList[i] : null;

      let spawned = null;
      if (context && context.prefab && typeof context.prefab.spawn === 'function') {
        spawned = context.prefab.spawn(prefabName, posX, posY, layerId);
      }

      if (spawned) {
        if (parentEnt) {
          if (typeof parentEnt.addChild === 'function') {
            parentEnt.addChild(spawned);
          } else {
            spawned.parentId = parentEnt.id;
            if (Array.isArray(parentEnt.children) && !parentEnt.children.some(c => c.id === spawned.id)) {
              parentEnt.children.push(spawned);
            }
          }
        }

        const spawnedId = spawned.scriptId || spawned.id || '';
        spawnedEntities.push(spawnedId);

        lastSpawnedId = spawnedId;
        lastIndex = i;
        lastRow = row;
        lastCol = col;
        lastData = itemData;

        outputs.spawnedEntity = spawnedId;
        outputs.itemIndex = i;
        outputs.rowIndex = row;
        outputs.colIndex = col;
        outputs.itemData = itemData;
        outputs.onSpawnItem = true;

        if (context && typeof context.triggerFlow === 'function') {
          context.triggerFlow('onSpawnItem');
        }
      }
    }

    outputs.execOut = true;
    outputs.onSpawnItem = false;
    outputs.spawnedEntity = lastSpawnedId;
    outputs.itemIndex = lastIndex;
    outputs.rowIndex = lastRow;
    outputs.colIndex = lastCol;
    outputs.itemData = lastData;
    outputs.spawnedEntities = spawnedEntities;

    const result = {
      execOut: true,
      onSpawnItem: false,
      spawnedEntity: lastSpawnedId,
      itemIndex: lastIndex,
      rowIndex: lastRow,
      colIndex: lastCol,
      itemData: lastData,
      spawnedEntities
    };
    return result;
  }

  processPrefabBinder(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const context = isDirect ? inputsOrContext : contextMaybe;
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

    const rawTarget = inputs.targetEntity !== undefined ? inputs.targetEntity : 'self';
    const targetEntityName = (typeof rawTarget === 'string') 
      ? rawTarget.trim() 
      : (rawTarget?.scriptId || rawTarget?.id || 'self');

    let root = null;
    if (context && context.entity && typeof context.entity.get === 'function') {
      root = context.entity.get(targetEntityName);
    } else if (this.game && this.game.world && Array.isArray(this.game.world.entities)) {
      root = this.game.world.entities.find(e => e.id === targetEntityName || e.scriptId === targetEntityName) || null;
    }

    if (!root) {
      const emptyRes = { execOut: true, targetEntity: '', boundCount: 0 };
      Object.assign(outputs, emptyRes);
      return emptyRes;
    }

    const data = inputs.data !== undefined ? inputs.data : null;
    const itemIndex = typeof inputs.itemIndex === 'number' ? inputs.itemIndex : (Number(inputs.itemIndex) || 0);

    let bindings = inputs.bindings;
    if (typeof bindings === 'string') {
      try { bindings = JSON.parse(bindings); } catch (_) { bindings = []; }
    }
    const rules = Array.isArray(bindings) 
      ? bindings 
      : (bindings && typeof bindings === 'object' ? Object.values(bindings) : []);

    const resolvePath = (obj, path) => {
      if (!path || path === '.' || path === 'this' || path === 'self') return obj;
      if (obj === null || obj === undefined) return undefined;
      if (typeof obj !== 'object') return obj;
      const parts = String(path).split(/[.\[\]]+/).filter(Boolean);
      let cur = obj;
      for (const p of parts) {
        if (cur === null || cur === undefined) return undefined;
        if (cur instanceof Map) {
          if (cur.has(p)) {
            cur = cur.get(p);
          } else if (/^\d+$/.test(p) && cur.has(Number(p))) {
            cur = cur.get(Number(p));
          } else {
            cur = undefined;
          }
        } else if (Array.isArray(cur)) {
          const idx = Number(p);
          cur = (Number.isInteger(idx) && idx >= 0 && idx < cur.length) ? cur[idx] : cur[p];
        } else {
          cur = cur[p];
        }
      }
      return cur;
    };

    const resolveScopedVariable = (expression) => {
      if (!expression || typeof expression !== 'string') return { found: false };
      const trimmed = expression.trim();
      const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\(([^)]+)\))(.*)$/i);
      if (!scopeMatch) return { found: false };

      const scope = scopeMatch[1].toLowerCase();
      const varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
      const subPath = scopeMatch[2] ? (scopeMatch[3] || '').replace(/^[:.]/, '').trim() : '';

      if (!varName) return { found: false };

      try {
        let rootVal = undefined;
        if (scope === 'local' && context && typeof context.getLocal === 'function') {
          rootVal = context.getLocal(varName);
        } else if (scope === 'global' && context && typeof context.getGlobal === 'function') {
          rootVal = context.getGlobal(varName);
        }
        if (rootVal === undefined && context && typeof context.getVariable === 'function') {
          rootVal = context.getVariable(varName);
        }

        if (rootVal !== undefined) {
          const finalVal = subPath ? resolvePath(rootVal, subPath) : rootVal;
          return { found: true, val: finalVal };
        }
      } catch (_) {
        return { found: false };
      }
      return { found: false };
    };

    const interpolatePath = (pathStr) => {
      if (typeof pathStr !== 'string') return pathStr;
      if (!pathStr.includes('{')) return pathStr;
      return pathStr.replace(/\{([^}]+)\}/g, (_, expr) => {
        const trimmed = expr.trim();
        if (trimmed === 'index') return String(itemIndex);
        if (trimmed === 'index + 1' || trimmed === 'index+1') return String(itemIndex + 1);

        const scoped = resolveScopedVariable(trimmed);
        if (scoped.found && scoped.val !== undefined && scoped.val !== null) {
          return String(scoped.val);
        }

        const val = resolvePath(data, trimmed);
        return val !== undefined && val !== null ? String(val) : '';
      });
    };

    const evaluateTemplate = (template, dataObj, idx) => {
      if (typeof template !== 'string') return String(template ?? '');
      return template.replace(/\{([^}]+)\}/g, (_, expr) => {
        const trimmed = expr.trim();
        if (trimmed === 'index') return String(idx);
        if (trimmed === 'index + 1' || trimmed === 'index+1') return String(idx + 1);

        const scoped = resolveScopedVariable(trimmed);
        if (scoped.found) {
          return scoped.val !== undefined && scoped.val !== null ? String(scoped.val) : '';
        }

        const val = resolvePath(dataObj, trimmed);
        return val !== undefined && val !== null ? String(val) : '';
      });
    };

    const findEntity = (rootEnt, name) => {
      if (!name || name === 'self' || name === rootEnt.scriptId || name === rootEnt.id) {
        return rootEnt;
      }
      if (context && context.entity && typeof context.entity.getChildByName === 'function') {
        const ch = context.entity.getChildByName(rootEnt, name);
        if (ch) return ch;
      }
      if (context && context.entity && typeof context.entity.getChildren === 'function') {
        const children = context.entity.getChildren(rootEnt) || [];
        const search = String(name).trim().toLowerCase();
        const ch = children.find(c => {
          const sId = String(c.scriptId || '').toLowerCase();
          return sId === search || sId.startsWith(search + '_');
        });
        if (ch) return ch;
      }
      if (this.game && this.game.world && Array.isArray(this.game.world.entities)) {
        const search = String(name).trim().toLowerCase();
        const ch = this.game.world.entities.find(e => {
          if (e.parentId !== rootEnt.id && e.parentId !== rootEnt.scriptId) return false;
          const sId = String(e.scriptId || '').toLowerCase();
          return sId === search || sId.startsWith(search + '_');
        });
        if (ch) return ch;
      }
      return null;
    };

    const resolveAsset = (assetId) => {
      if (!assetId) return assetId;
      if (context && context.asset && typeof context.asset.resolveId === 'function') {
        const resolved = context.asset.resolveId(assetId);
        if (resolved) return resolved;
      }
      return assetId;
    };

    const inferComponent = (ent, prop) => {
      if (!ent || !prop) return null;
      const p = String(prop).toLowerCase();
      if (['active', 'visible', 'tag', 'tags', 'zindex', 'orderindex'].includes(p)) {
        return 'Entity';
      }
      if (!ent.components) return null;
      if (ent.components.TextRenderer && ['value', 'text', 'content', 'fontsize', 'align', 'alignline', 'autoline', 'maxline', 'linespacing', 'letterspacing', 'overflow', 'outlinewidth', 'outlinecolor', 'shadowenabled', 'shadowcolor'].includes(p)) {
        return 'TextRenderer';
      }
      if (ent.components.SpriteRenderer && ['assetid', 'filtermode', 'usesdf', 'sourcex', 'sourcey', 'sourcewidth', 'sourceheight'].includes(p)) {
        return 'SpriteRenderer';
      }
      if (ent.components.UITransform && ['anchorx', 'anchory', 'isratiolocked', 'isscalelocked'].includes(p)) {
        return 'UITransform';
      }
      if ((ent.components.UITransform || ent.components.Transform) && ['scale', 'scalex', 'scaley', 'size', 'width', 'height', 'x', 'y', 'pivotx', 'pivoty', 'flipx', 'flipy', 'rotation'].includes(p)) {
        return ent.components.UITransform ? 'UITransform' : 'Transform';
      }
      if (ent.components.Audio && ['audiotype', 'volume', 'ismute', 'pitch', 'loop', 'autoplay', 'spatial', 'fadein', 'fadeout', 'refdistance', 'maxdistance'].includes(p)) {
        return 'Audio';
      }
      if (ent.components.Physics && ['motionmode', 'gravityscale', 'isfrozen', 'drag', 'velocityx', 'velocityy', 'isgrounded', 'movementstate', 'facingdirection', 'aligntoslope', 'mass'].includes(p)) {
        return 'Physics';
      }
      if (ent.components.SpriteAnimator && ['currentclip', 'clip', 'isplaying'].includes(p)) {
        return 'SpriteAnimator';
      }
      if (ent.components.ShapeRenderer && ['isfilled', 'fillopacity', 'outlineopacity', 'elements'].includes(p)) {
        return 'ShapeRenderer';
      }
      if (ent.components.Tilemap && ['issolid'].includes(p)) {
        return 'Tilemap';
      }
      for (const [cName, cObj] of Object.entries(ent.components)) {
        if (cObj && typeof cObj === 'object' && prop in cObj) {
          return cName;
        }
      }
      return null;
    };

    let boundCount = 0;

    for (const rule of rules) {
      if (!rule || typeof rule !== 'object') continue;
      const targetName = rule.target || rule.child || 'self';
      const targetEnt = findEntity(root, targetName);
      if (!targetEnt) continue;

      const rawProp = rule.property || rule.prop || rule.field;
      const compName = rule.component || rule.comp || inferComponent(targetEnt, rawProp) || 'Entity';
      const prop = rawProp || (compName === 'TextRenderer' ? 'value' : (compName === 'SpriteRenderer' ? 'assetId' : ''));

      // Resolve raw value from data or global/local variable
      let val = undefined;
      const rawPath = rule.path !== undefined && rule.path !== null ? rule.path : rule.source;

      if (rule.template !== undefined && rule.template !== null && rule.template !== '') {
        val = evaluateTemplate(rule.template, data, itemIndex);
      } else if (rawPath !== undefined && rawPath !== null) {
        if (typeof rawPath === 'string') {
          const evaluatedPath = interpolatePath(rawPath);
          const scoped = resolveScopedVariable(evaluatedPath);
          if (scoped.found) {
            val = scoped.val;
          } else {
            val = resolvePath(data, evaluatedPath);
          }
        } else {
          val = resolvePath(data, rawPath);
        }
      } else if (rule.value !== undefined) {
        val = rule.value;
      } else {
        val = data;
      }

      // Mapping table / switch
      const mapping = rule.switch || rule.mapping || rule.map || rule.match;
      if (mapping && typeof mapping === 'object') {
        const strKey = String(val);
        if (strKey in mapping) {
          val = mapping[strKey];
        } else if (val in mapping) {
          val = mapping[val];
        } else if ('default' in mapping) {
          val = mapping['default'];
        }
      }

      if (val === undefined && rule.defaultValue !== undefined) {
        val = rule.defaultValue;
      }

      // Global Variable support
      const isGlobal = rule.global !== undefined || rule.scope === 'global' || compName === 'GlobalVariable';
      if (isGlobal) {
        const globalVarName = rule.global || rule.variable || rule.var || prop;
        if (globalVarName) {
          try {
            if (context && typeof context.setGlobal === 'function') {
              context.setGlobal(globalVarName, val);
            } else if (this.game?.variables?.setGlobal) {
              this.game.variables.setGlobal(globalVarName, val);
            } else if (context && typeof context.setVariable === 'function') {
              context.setVariable(globalVarName, val);
            }
            boundCount++;
          } catch (e) {
            if (context?.console?.warn) context.console.warn(`[UI Prefab Binder] Failed to set global variable '${globalVarName}':`, e);
          }
        }
        continue;
      }

      // Local Script Variable support (by scriptId, assetId, or first script)
      const isLocal = rule.local !== undefined || rule.variable !== undefined || rule.var !== undefined || rule.scope === 'local' || compName === 'LocalVariable' || compName === 'ScriptVariable' || compName === 'ScriptController' || compName === 'Variable';
      if (isLocal) {
        const localVarName = rule.local || rule.variable || rule.var || prop;
        const targetScriptFilter = rule.script || rule.scriptId || rule.assetId;

        if (targetEnt.components && targetEnt.components.ScriptController) {
          const sc = targetEnt.components.ScriptController;
          if (Array.isArray(sc.data) && sc.data.length > 0) {
            let matchedInstance = null;
            if (targetScriptFilter) {
              const filterStr = String(targetScriptFilter).trim().toLowerCase();
              matchedInstance = sc.data.find(inst => {
                if (String(inst.assetId || '').toLowerCase() === filterStr || String(inst.id || '').toLowerCase() === filterStr) return true;
                const scriptAsset = this.game?.world?.scripts?.[inst.assetId];
                if (scriptAsset) {
                  const sId = String(scriptAsset.scriptId || scriptAsset.name || '').toLowerCase();
                  if (sId === filterStr) return true;
                }
                return false;
              });
            }
            if (!matchedInstance) {
              matchedInstance = sc.data[0];
            }

            if (matchedInstance) {
              if (!matchedInstance.variables) matchedInstance.variables = {};
              if (localVarName === 'variables' && typeof val === 'object' && val !== null) {
                Object.assign(matchedInstance.variables, val);
              } else if (localVarName) {
                matchedInstance.variables[localVarName] = val;
              }
              if (localVarName === 'active') matchedInstance.active = Boolean(val);

              // Also sync with live runner if already running on entity
              if (this.game?.scriptSystem?.runners && localVarName && localVarName !== 'variables') {
                const liveRunner = this.game.scriptSystem.runners.find(r => 
                  (r.owner === targetEnt || r.owner?.id === targetEnt.id) &&
                  (!targetScriptFilter || String(r.data?.scriptId || r.data?.id || '').toLowerCase() === String(targetScriptFilter).toLowerCase() || r.data?.id === matchedInstance.assetId)
                );
                if (liveRunner && typeof liveRunner.setLocalVariable === 'function') {
                  liveRunner.setLocalVariable(localVarName, val);
                }
              }
              boundCount++;
            }
          }
        }
        continue;
      }

      // Apply to Entity top-level fields
      if (compName === 'Entity') {
        if (prop === 'active') targetEnt.active = Boolean(val);
        else if (prop === 'visible') targetEnt.visible = Boolean(val);
        else if (prop === 'tag') targetEnt.tag = String(val);
        else if (prop === 'tags') targetEnt.tags = Array.isArray(val) ? val : [String(val)];
        else if (prop === 'zIndex') targetEnt.zIndex = Number(val);
        else if (prop === 'orderIndex') targetEnt.orderIndex = Number(val);
        else if (prop === 'opacity') targetEnt.opacity = Number(val);
        else targetEnt[prop] = val;
        boundCount++;
        continue;
      }

      // Ensure component container
      if (!targetEnt.components) targetEnt.components = {};
      if (!targetEnt.components[compName]) targetEnt.components[compName] = {};
      const comp = targetEnt.components[compName];

      // Component schema handling (covers all components in componentSchema.js)
      switch (compName) {
        case 'SpriteRenderer':
          if (prop === 'assetId') comp.assetId = resolveAsset(String(val));
          else if (prop === 'color') comp.color = String(val);
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'sourceX') comp.sourceX = Number(val);
          else if (prop === 'sourceY') comp.sourceY = Number(val);
          else if (prop === 'sourceWidth') comp.sourceWidth = Number(val);
          else if (prop === 'sourceHeight') comp.sourceHeight = Number(val);
          else if (prop === 'filterMode') comp.filterMode = String(val);
          else if (prop === 'useSDF') comp.useSDF = Boolean(val);
          else comp[prop] = val;
          break;

        case 'TextRenderer':
          if (prop === 'value' || prop === 'text' || prop === 'content') comp.value = val !== undefined && val !== null ? String(val) : '';
          else if (prop === 'assetId' || prop === 'fontAsset') comp.assetId = resolveAsset(String(val));
          else if (prop === 'fontSize') comp.fontSize = Number(val);
          else if (prop === 'color') comp.color = String(val);
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'align') comp.align = String(val);
          else if (prop === 'alignLine' || prop === 'alignV' || prop === 'verticalAlign') comp.alignLine = String(val);
          else if (prop === 'maxLine') comp.maxLine = Math.max(1, Number(val));
          else if (prop === 'autoLine') comp.autoLine = Boolean(val);
          else if (prop === 'lineSpacing') comp.lineSpacing = Number(val);
          else if (prop === 'letterSpacing') comp.letterSpacing = Number(val);
          else if (prop === 'overflow') comp.overflow = String(val);
          else if (prop === 'outlineWidth') comp.outlineWidth = Number(val);
          else if (prop === 'outlineColor') comp.outlineColor = String(val);
          else if (prop === 'shadowEnabled') comp.shadowEnabled = Boolean(val);
          else if (prop === 'shadowColor') comp.shadowColor = String(val);
          else if (prop === 'shadowOpacity') comp.shadowOpacity = Number(val);
          else if (prop === 'shadowOffsetX') comp.shadowOffsetX = Number(val);
          else if (prop === 'shadowOffsetY') comp.shadowOffsetY = Number(val);
          else if (prop === 'shadowBlur') comp.shadowBlur = Number(val);
          else comp[prop] = val;
          break;

        case 'Transform':
        case 'UITransform': {
          const comps = [targetEnt.components.UITransform, targetEnt.components.Transform].filter(Boolean);
          for (const c of comps) {
            if (prop === 'x') c.x = Number(val);
            else if (prop === 'y') c.y = Number(val);
            else if (prop === 'rotation') c.rotation = Number(val);
            else if (prop === 'scaleX') c.scaleX = Number(val);
            else if (prop === 'scaleY') c.scaleY = Number(val);
            else if (prop === 'scale') { c.scaleX = Number(val); c.scaleY = Number(val); }
            else if (prop === 'pivotX') c.pivotX = Number(val);
            else if (prop === 'pivotY') c.pivotY = Number(val);
            else if (prop === 'flipX') c.flipX = Boolean(val);
            else if (prop === 'flipY') c.flipY = Boolean(val);
            else if (prop === 'width') c.width = Number(val);
            else if (prop === 'height') c.height = Number(val);
            else if (prop === 'size') { c.width = Number(val); c.height = Number(val); }
            else if (prop === 'isRatioLocked') c.isRatioLocked = Boolean(val);
            else if (prop === 'isScaleLocked') c.isScaleLocked = Boolean(val);
            else if (prop === 'anchorX') c.anchorX = Number(val);
            else if (prop === 'anchorY') c.anchorY = Number(val);
            else c[prop] = val;
          }
          break;
        }

        case 'Audio':
          if (prop === 'assetId') comp.assetId = resolveAsset(String(val));
          else if (prop === 'audioType') comp.audioType = String(val);
          else if (prop === 'volume') comp.volume = Number(val);
          else if (prop === 'pitch') comp.pitch = Number(val);
          else if (prop === 'isMute') comp.isMute = Boolean(val);
          else if (prop === 'loop') comp.loop = Boolean(val);
          else if (prop === 'autoplay') comp.autoplay = Boolean(val);
          else if (prop === 'spatial') comp.spatial = Boolean(val);
          else if (prop === 'persist') comp.persist = Boolean(val);
          else if (prop === 'fadeIn') comp.fadeIn = Number(val);
          else if (prop === 'fadeOut') comp.fadeOut = Number(val);
          else if (prop === 'refDistance') comp.refDistance = Number(val);
          else if (prop === 'maxDistance') comp.maxDistance = Number(val);
          else comp[prop] = val;
          break;

        case 'Collider':
          if (prop === 'data' && Array.isArray(val)) comp.data = val;
          else if (prop === 'enabled') {
            comp.enabled = Boolean(val);
            if (Array.isArray(comp.data)) comp.data.forEach(s => s.enabled = Boolean(val));
          } else {
            if (Array.isArray(comp.data) && comp.data.length > 0) {
              const shapeIdx = typeof rule.shapeIndex === 'number' ? rule.shapeIndex : 0;
              if (comp.data[shapeIdx]) comp.data[shapeIdx][prop] = val;
            }
            comp[prop] = val;
          }
          break;

        case 'Physics':
          if (prop === 'enabled') comp.enabled = Boolean(val);
          else if (prop === 'motionMode') comp.motionMode = String(val);
          else if (prop === 'gravityScale') comp.gravityScale = Number(val);
          else if (prop === 'drag') comp.drag = Number(val);
          else if (prop === 'isFrozen') comp.isFrozen = Boolean(val);
          else if (prop === 'velocityX') comp.velocityX = Number(val);
          else if (prop === 'velocityY') comp.velocityY = Number(val);
          else if (prop === 'isGrounded') comp.isGrounded = Boolean(val);
          else if (prop === 'movementState') comp.movementState = String(val);
          else if (prop === 'facingDirection') comp.facingDirection = String(val);
          else if (prop === 'alignToSlope') comp.alignToSlope = Boolean(val);
          else if (prop === 'slopeAdaptSpeed') comp.slopeAdaptSpeed = Number(val);
          else if (prop === 'maxSlopeAngle') comp.maxSlopeAngle = Number(val);
          else if (prop === 'keepColliderUpright') comp.keepColliderUpright = Boolean(val);
          else if (prop === 'type') comp.type = String(val);
          else if (prop === 'mass') comp.mass = Number(val);
          else comp[prop] = val;
          break;

        case 'SpriteAnimator':
          if (prop === 'currentClip' || prop === 'clip') comp.currentClip = String(val);
          else if (prop === 'active') comp.active = Boolean(val);
          else if (prop === 'isPlaying') comp.isPlaying = Boolean(val);
          else if (prop === 'clips' && Array.isArray(val)) comp.clips = val;
          else comp[prop] = val;
          break;

        case 'ShapeRenderer':
          if (prop === 'color') comp.color = String(val);
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'isFilled') comp.isFilled = Boolean(val);
          else if (prop === 'fillOpacity') comp.fillOpacity = Number(val);
          else if (prop === 'outlineWidth') comp.outlineWidth = Number(val);
          else if (prop === 'outlineColor') comp.outlineColor = String(val);
          else if (prop === 'outlineOpacity') comp.outlineOpacity = Number(val);
          else if (prop === 'type') comp.type = String(val);
          else if (prop === 'elements' && Array.isArray(val)) comp.elements = val;
          else if (prop === 'enablePolygonCollision') comp.enablePolygonCollision = Boolean(val);
          else if (prop === 'enableSegmentCollision') comp.enableSegmentCollision = Boolean(val);
          else if (prop === 'enableCircleCollision') comp.enableCircleCollision = Boolean(val);
          else comp[prop] = val;
          break;

        case 'Tilemap':
          if (prop === 'width') comp.width = Number(val);
          else if (prop === 'height') comp.height = Number(val);
          else if (prop === 'assetId') comp.assetId = resolveAsset(String(val));
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'isSolid') comp.isSolid = Boolean(val);
          else if (prop === 'filterMode') comp.filterMode = String(val);
          else if (prop === 'data') comp.data = typeof val === 'object' && val !== null ? val : {};
          else comp[prop] = val;
          break;

        default:
          comp[prop] = val;
          break;
      }

      boundCount++;
    }

    const finalTargetId = root.scriptId || root.id || '';
    outputs.targetEntity = finalTargetId;
    outputs.boundCount = boundCount;
    outputs.execOut = true;

    return {
      execOut: true,
      targetEntity: finalTargetId,
      boundCount
    };
  }

  createFacade(contextParams) {
    const game = this.game;
    const getCtx = (ctx) => ctx || contextParams.context;

    return {
      isUiLayer: (layerId) => {
        const uiLayerIds = new Set((game.world?.layersUI || []).map(l => l.id));
        return uiLayerIds.has(layerId);
      },
      dispatchEvent: (event) => {
        const canvas = game.renderer?.gl?.canvas || game.renderer?.canvas || game.canvas;
        if (canvas && typeof canvas.dispatchEvent === 'function') {
          canvas.dispatchEvent(event);
        }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(event);
        }
      },
      notify: (message, source = 'Notification', type = 'log') => {
        this.contextSystem.consoleHandler.notify(contextParams, message, source, type);
      },
      // Atomic & Reusable Primitives
      getGlobalTransform: (entity, ctx) => this.getGlobalTransform(entity, getCtx(ctx)),
      isEntityInteractable: (entity, ctx) => this.isEntityInteractable(entity, getCtx(ctx)),
      isPointerOver: (entity, padX, padY, ctx) => this.isPointerOver(entity, padX, padY, getCtx(ctx)),
      resolveAudioBus: (key) => this.resolveAudioBus(key),
      updateSliderVisual: (s, volume, ctx) => this.updateSliderVisual(s, volume, getCtx(ctx)),
      processVolumeSliders: (state, config, inputs, outputs, ctx) => this.processVolumeSliders(state, config, inputs, outputs, getCtx(ctx)),
      processAtomicSlider: (state, inputs, outputs, ctx) => this.processAtomicSlider(state, inputs, outputs, getCtx(ctx)),
      processSwitchButton: (state, inputs, outputs, isImage, ctx) => this.processSwitchButton(state, inputs, outputs, isImage, getCtx(ctx)),
      processGridSpawner: (state, inputs, outputs, ctx) => this.processGridSpawner(state, inputs, outputs, getCtx(ctx)),
      processPrefabBinder: (state, inputs, outputs, ctx) => this.processPrefabBinder(state, inputs, outputs, getCtx(ctx))
    };
  }
}

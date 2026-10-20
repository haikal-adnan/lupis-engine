export class UIContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
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
    const game = this.game;

    try {
      if (game.input && typeof game.input.isPointerOver === 'function') {
        if (game.input.isPointerOver(entity)) return true;
      }
    } catch (err) {}

    const pointer = game.input && typeof game.input.getPointer === 'function' ? game.input.getPointer() : null;
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

    let pointerOverEngine = false;
    try {
      if (context && context.input && typeof context.input.isPointerOver === 'function') {
        if (s.handlerEntity && context.input.isPointerOver(s.handlerEntity)) pointerOverEngine = true;
        else if (context.input.isPointerOver(s.barEntity)) pointerOverEngine = true;
      }
    } catch (err) {
      pointerOverEngine = false;
    }
    if (pointerOverEngine) return true;

    const left = s.screenLeft;
    const right = s.screenRight;
    const top = s.screenTop;
    const bottom = s.screenBottom;

    const padX = 20;
    const padY = Math.max(25, s.baseH);

    return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
  }

  processVolumeSliders(state, configInput, inputs, outputs, context) {
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
      const pointer = context && context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
      const mouse = context && context.input ? context.input.mouse : false;
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
        if (!s || !s.barEntity || !s.tBar) {
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
  }

  processAtomicSlider(state, inputs, outputs, context) {
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
      let pointerOverEngine = false;
      try {
        if (context && context.input && typeof context.input.isPointerOver === 'function') {
          if (handlerEnt && context.input.isPointerOver(handlerEnt)) pointerOverEngine = true;
          else if (context.input.isPointerOver(barEnt)) pointerOverEngine = true;
        }
      } catch (err) {
        pointerOverEngine = false;
      }
      if (pointerOverEngine) return true;

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

      const pointer = context && context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
      const mouse = context && context.input ? context.input.mouse : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

      if (!isDown) {
        state.isDragging = false;
        return;
      }

      if (!pointer) return;
      const px = pointer.x;
      const py = pointer.y;
      if (typeof px !== 'number' || typeof py !== 'number') return;

      if (!state.isDragging) {
        if (isPointerOverSlider(px, py)) {
          state.isDragging = true;
        }
      }

      if (state.isDragging) {
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
  }

  processSwitchButton(state, inputs, outputs, isImage, context) {
    const knobName = typeof inputs.knobEntity === 'string' ? inputs.knobEntity.trim() : '';
    const trackName = typeof inputs.trackEntity === 'string' ? inputs.trackEntity.trim() : '';
    const onTextName = typeof inputs.onTextEntity === 'string' ? inputs.onTextEntity.trim() : (typeof inputs.textEntity === 'string' ? inputs.textEntity.trim() : '');
    const offTextName = typeof inputs.offTextEntity === 'string' ? inputs.offTextEntity.trim() : '';

    let knobEnt = false;
    if (knobName && context && context.entity && typeof context.entity.get === 'function') {
      knobEnt = context.entity.get(knobName);
    }

    let trackEnt = false;
    if (trackName && context && context.entity && typeof context.entity.get === 'function') {
      trackEnt = context.entity.get(trackName);
    }

    let onTextEnt = false;
    if (onTextName && context && context.entity && typeof context.entity.get === 'function') {
      onTextEnt = context.entity.get(onTextName);
    }

    let offTextEnt = false;
    if (offTextName && context && context.entity && typeof context.entity.get === 'function') {
      offTextEnt = context.entity.get(offTextName);
    }

    if (!knobEnt) {
      if (knobName && context && context.console && typeof context.console.warn === 'function') {
        context.console.warn((isImage ? '[SwitchImage]' : '[SwitchShape]') + ' Knob entity not found: ' + knobName);
      }
      outputs.execOut = true;
      return;
    }

    const self = this;

    function isPointerOverEntity(ent) {
      if (!ent) return false;
      try {
        if (context && context.input && typeof context.input.isPointerOver === 'function') {
          if (context.input.isPointerOver(ent)) return true;
        }
      } catch (err) {}
      const pointer = context && context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
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
        const knobImg = isVisuallyOn ? (inputs.knobOnImage || inputs.knobOffImage) : (inputs.knobOffImage || inputs.knobOnImage);
        const trackImg = isVisuallyOn ? (inputs.trackOnImage || inputs.trackOffImage) : (inputs.trackOffImage || inputs.trackOnImage);
        if (knobEnt && knobEnt.components && knobEnt.components.SpriteRenderer && knobImg) {
          knobEnt.components.SpriteRenderer.assetId = knobImg;
        }
        if (trackEnt && trackEnt.components && trackEnt.components.SpriteRenderer && trackImg) {
          trackEnt.components.SpriteRenderer.assetId = trackImg;
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
      if (isPointerOverEntity(knobEnt)) return true;
      if (trackEnt && isPointerOverEntity(trackEnt)) return true;
      if (onTextEnt && isPointerOverEntity(onTextEnt)) return true;
      if (offTextEnt && isPointerOverEntity(offTextEnt)) return true;

      const pointer = context && context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
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
      const pointer = context && context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
      const mouse = context && context.input ? context.input.mouse : false;
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
      isPointerOver: (entity, padX, padY, ctx) => this.isPointerOver(entity, padX, padY, getCtx(ctx)),
      resolveAudioBus: (key) => this.resolveAudioBus(key),
      updateSliderVisual: (s, volume, ctx) => this.updateSliderVisual(s, volume, getCtx(ctx)),
      processVolumeSliders: (state, config, inputs, outputs, ctx) => this.processVolumeSliders(state, config, inputs, outputs, getCtx(ctx)),
      processAtomicSlider: (state, inputs, outputs, ctx) => this.processAtomicSlider(state, inputs, outputs, getCtx(ctx)),
      processSwitchButton: (state, inputs, outputs, isImage, ctx) => this.processSwitchButton(state, inputs, outputs, isImage, getCtx(ctx))
    };
  }
}

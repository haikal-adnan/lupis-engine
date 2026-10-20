import { Wrench } from 'lucide-vue-next';

export const BlueprintHelperTool = {
  id: 'helper_tool',
  label: 'Helper & Tool',
  color: '#AB47BC',
  icon: Wrench,
  items: [
    {
      type: 'volumeSliderManager',
      label: 'Volume Slider Manager',
      description: 'Unified 4-channel automatic volume slider manager with auto crop & handle positioning.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Volume Slider Manager',
          headerColor: '#00ACC1',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'config', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChanged', dataType: 'execution', color: '#FFFFFF' },
          { id: 'changedChannel', dataType: 'string', color: '#F48FB1' },
          { id: 'currentVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'masterVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'vocalVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'sfxVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'backgroundVolume', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            config: {
              master: { bar: 'VolumeMasterBar', handler: 'VolumeMasterHandler', indicator: 'VolumeMasterIndicator' },
              vocal: { bar: 'VolumeVocalBar', handler: 'VolumeVocalHandler', indicator: 'VolumeVocalIndicator' },
              sfx: { bar: 'VolumeSFXBar', handler: 'VolumeSFXHandler', indicator: 'VolumeSFXIndicator' },
              background: { bar: 'VolumeBGMBar', handler: 'VolumeBGMHandler', indicator: 'VolumeBGMIndicator' }
            }
          },
          code: 
`let config = inputs.config;
if (!config && node.data && node.data.values && node.data.values.config) {
  config = node.data.values.config;
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

const uiWidth = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.width) || 1920;
const uiHeight = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.height) || 1080;

function resolveAudioBus(key) {
  const k = String(key || '').toLowerCase().trim();
  if (k === 'vocal' || k === 'voice') return 'voice';
  if (k === 'background' || k === 'bgm') return 'background';
  if (k === 'master') return 'master';
  if (k === 'sfx') return 'sfx';
  return k;
}

function getGlobalTransform(entity) {
  if (!entity) return { x: 0, y: 0 };
  let cur = entity;
  let gx = 0;
  let gy = 0;
  while (cur) {
    const t = cur.components && (cur.components.UITransform || cur.components.Transform);
    if (t) {
      gx += (typeof t.x === 'number' ? t.x : 0);
      gy += (typeof t.y === 'number' ? t.y : 0);
    }
    if (cur.parentId && context.entity && typeof context.entity.get === 'function') {
      cur = context.entity.get(cur.parentId);
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

function updateSliderVisual(s, volume) {
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
  if (!indicatorComp) {
    if (!s.indicatorEntity && s.indicatorName && context.entity && typeof context.entity.get === 'function') {
      s.indicatorEntity = context.entity.get(s.indicatorName);
    }
    if (s.indicatorEntity) {
      if (s.indicatorEntity.components && s.indicatorEntity.components.TextRenderer) {
        indicatorComp = s.indicatorEntity.components.TextRenderer;
        s.indicatorTextComp = indicatorComp;
      } else if (s.indicatorEntity.children && Array.isArray(s.indicatorEntity.children) && context.entity && typeof context.entity.get === 'function') {
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

function isPointerOverSlider(s, px, py) {
  if (!s || !s.barEntity || !s.tBar) return false;

  let pointerOverEngine = false;
  try {
    if (context.input && typeof context.input.isPointerOver === 'function') {
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

if (!context.state.sliders) {
  context.state.sliders = {};
}

if (!context.state.isInitialized || context.state.activeConfig !== config) {
  context.state.isInitialized = true;
  context.state.activeConfig = config;

  for (const existingKey of Object.keys(context.state.sliders)) {
    if (!sliderMap[existingKey]) {
      delete context.state.sliders[existingKey];
    }
  }

  for (const [key, item] of Object.entries(sliderMap)) {
    if (!item || typeof item !== 'object') continue;
    if (!item.bar || typeof item.bar !== 'string') continue;

    const barName = item.bar.trim();
    if (!barName) continue;

    let barEntity = false;
    if (context.entity && typeof context.entity.get === 'function') {
      barEntity = context.entity.get(barName);
    }
    if (!barEntity) {
      if (context.console && typeof context.console.warn === 'function') {
        context.console.warn('[VolumeSlider] Bar entity not found: ' + barName);
      }
      continue;
    }

    const tBar = barEntity.components && (barEntity.components.UITransform || barEntity.components.Transform);
    if (!tBar) continue;

    let handlerEntity = false;
    if (item.handler && typeof item.handler === 'string') {
      const handlerName = item.handler.trim();
      if (handlerName && context.entity && typeof context.entity.get === 'function') {
        handlerEntity = context.entity.get(handlerName);
      }
    }

    let indicatorEntity = false;
    let indicatorTextComp = false;
    let indicatorName = '';
    if (item.indicator && typeof item.indicator === 'string') {
      indicatorName = item.indicator.trim();
      if (indicatorName && context.entity && typeof context.entity.get === 'function') {
        indicatorEntity = context.entity.get(indicatorName);
      }
      if (indicatorEntity) {
        if (indicatorEntity.components && indicatorEntity.components.TextRenderer) {
          indicatorTextComp = indicatorEntity.components.TextRenderer;
        } else if (indicatorEntity.children && Array.isArray(indicatorEntity.children) && context.entity && typeof context.entity.get === 'function') {
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
    const audioBus = resolveAudioBus(key);

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
    const barGT = getGlobalTransform(barEntity);
    tBar.x = prevBarX;

    const screenLeft = barGT.x - (pivotX * baseW);
    const screenRight = screenLeft + baseW;
    const screenTop = barGT.y - (pivotY * baseH);
    const screenBottom = screenTop + baseH;

    context.state.sliders[key] = {
      key: key,
      barEntity: barEntity,
      handlerEntity: handlerEntity,
      indicatorEntity: indicatorEntity,
      indicatorTextComp: indicatorTextComp,
      indicatorName: indicatorName,
      format: (typeof item.format === 'string') ? item.format : '{value}%',
      tBar: tBar,
      tHandler: tHandler,
      sprite: sprite,
      shape: shape,
      audioBus: audioBus,
      isChild: isChild,
      baseW: baseW,
      baseH: baseH,
      baseX: baseX,
      baseY: baseY,
      pivotX: pivotX,
      pivotY: pivotY,
      anchorX: anchorX,
      anchorY: anchorY,
      baseSX: baseSX,
      baseSY: baseSY,
      baseSW: baseSW,
      baseSH: baseSH,
      screenLeft: screenLeft,
      screenRight: screenRight,
      screenTop: screenTop,
      screenBottom: screenBottom,
      currentVolume: 100
    };

    const s = context.state.sliders[key];
    let vol = false;
    let hasAudioVol = false;

    if (context.audio && typeof context.audio.getVolume === 'function') {
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
      }
    }

    if (vol === false) {
      vol = 100;
    }

    updateSliderVisual(s, vol);
    if (!hasAudioVol && context.audio && typeof context.audio.setVolume === 'function') {
      context.audio.setVolume(audioBus, vol);
    }

    outputs[key + 'Volume'] = vol;
    outputs.currentVolume = vol;
  }
}

function syncExternalVolumeChanges() {
  if (!context.audio || typeof context.audio.getVolume !== 'function') return;
  if (!context.state.sliders) return;

  for (const [key, s] of Object.entries(context.state.sliders)) {
    if (!s || !s.tBar) continue;
    if (context.state.activeSlider === key) continue;

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
}

function processPointerInteractions() {
  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  const mouse = context.input ? context.input.mouse : false;
  const mouseIsDown = Boolean(mouse && (
    (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
    (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
  ));
  const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

  if (!isDown) {
    context.state.activeSlider = false;
    return;
  }

  if (!pointer) return;
  const px = pointer.x;
  const py = pointer.y;
  if (typeof px !== 'number' || typeof py !== 'number') return;

  if (!context.state.activeSlider) {
    for (const [key, s] of Object.entries(context.state.sliders)) {
      if (s && isPointerOverSlider(s, px, py)) {
        context.state.activeSlider = key;
        break;
      }
    }
  }

  if (context.state.activeSlider) {
    const s = context.state.sliders ? context.state.sliders[context.state.activeSlider] : false;
    if (!s || !s.barEntity || !s.tBar) {
      context.state.activeSlider = false;
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
      context.triggerFlow('onChanged');
    }
  }
}

syncExternalVolumeChanges();
processPointerInteractions();

if (!context.state.hasTickListener) {
  context.state.hasTickListener = true;
  context.state.activeSlider = false;

  context.onTick(() => {
    syncExternalVolumeChanges();
    processPointerInteractions();
  });
}

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'atomicSlider',
      label: 'Atomic Slider',
      description: 'Mengatur slider modular berbasis nilai bebas (misal 0-160), mendukung bar shape/sprite, knob independen atau child, pembulatan step, serta arah reverse.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Atomic Slider',
          headerColor: '#00ACC1',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'barEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'handlerEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'value', dataType: 'number', color: '#64B5F6' },
          { id: 'min', dataType: 'number', color: '#64B5F6' },
          { id: 'max', dataType: 'number', color: '#64B5F6' },
          { id: 'step', dataType: 'number', color: '#64B5F6' },
          { id: 'isInteractive', dataType: 'boolean', color: '#81C784' },
          { id: 'reverse', dataType: 'boolean', color: '#81C784' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChanged', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', dataType: 'number', color: '#64B5F6' },
          { id: 'normalized', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            barEntity: '',
            handlerEntity: '',
            value: 100,
            min: 0,
            max: 100,
            step: 1,
            isInteractive: true,
            reverse: false
          },
          code:
`const barName = typeof inputs.barEntity === 'string' ? inputs.barEntity.trim() : '';
const handlerName = typeof inputs.handlerEntity === 'string' ? inputs.handlerEntity.trim() : '';

let barEnt = false;
if (barName && context.entity && typeof context.entity.get === 'function') {
  barEnt = context.entity.get(barName);
}

let handlerEnt = false;
if (handlerName && context.entity && typeof context.entity.get === 'function') {
  handlerEnt = context.entity.get(handlerName);
}

if (!barEnt) {
  if (context.console && typeof context.console.warn === 'function' && barName) {
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

const uiWidth = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.width) || 1920;
const uiHeight = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.height) || 1080;

function getGlobalTransform(entity) {
  if (!entity) return { x: 0, y: 0 };
  let cur = entity;
  let gx = 0;
  let gy = 0;
  while (cur) {
    const t = cur.components && (cur.components.UITransform || cur.components.Transform);
    if (t) {
      gx += (typeof t.x === 'number' ? t.x : 0);
      gy += (typeof t.y === 'number' ? t.y : 0);
    }
    if (cur.parentId && context.entity && typeof context.entity.get === 'function') {
      cur = context.entity.get(cur.parentId);
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

if (!context.state.isInitialized) {
  context.state.isInitialized = true;
  context.state.isDragging = false;
  context.state.lastReverse = isReverse;

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
  const barGT = getGlobalTransform(barEnt);
  tBar.x = prevBarX;

  const screenLeft = barGT.x - (pivotX * baseW);
  const screenRight = screenLeft + baseW;
  const screenTop = barGT.y - (pivotY * baseH);
  const screenBottom = screenTop + baseH;

  context.state.baseW = baseW;
  context.state.baseH = baseH;
  context.state.baseX = baseX;
  context.state.baseY = baseY;
  context.state.pivotX = pivotX;
  context.state.pivotY = pivotY;
  context.state.baseSX = baseSX;
  context.state.baseSY = baseSY;
  context.state.baseSW = baseSW;
  context.state.baseSH = baseSH;
  context.state.screenLeft = screenLeft;
  context.state.screenRight = screenRight;
  context.state.screenTop = screenTop;
  context.state.screenBottom = screenBottom;
  context.state.isChild = isChild;

  const initialVal = typeof barEnt._atomicValue === 'number' ? barEnt._atomicValue : (typeof inputs.value === 'number' ? inputs.value : maxVal);
  context.state.value = snapValue(initialVal);
  barEnt._atomicValue = context.state.value;
  context.state.lastInputValue = inputs.value;
}

if (typeof inputs.value === 'number' && inputs.value !== context.state.lastInputValue && !context.state.isDragging) {
  context.state.lastInputValue = inputs.value;
  context.state.value = snapValue(inputs.value);
  barEnt._atomicValue = context.state.value;
}

if (context.state.lastReverse !== isReverse) {
  context.state.lastReverse = isReverse;
  updateVisual(context.state.value);
}

function updateVisual(val) {
  const f = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
  const fVisual = isReverse ? (1 - f) : f;
  const baseW = context.state.baseW;
  const pivotX = context.state.pivotX;
  const baseX = context.state.baseX;
  const w = Math.max(0, baseW * fVisual);

  tBar.width = w;
  tBar.x = baseX - (pivotX * baseW * (1 - fVisual));

  if (barEnt.components && barEnt.components.ShapeRenderer) {
    barEnt.components.ShapeRenderer.width = w;
  }
  if (barEnt.components && barEnt.components.SpriteRenderer) {
    barEnt.components.SpriteRenderer.sourceX = context.state.baseSX;
    barEnt.components.SpriteRenderer.sourceWidth = Math.max(0, context.state.baseSW * fVisual);
  }

  const tHandler = handlerEnt && handlerEnt.components ? (handlerEnt.components.UITransform || handlerEnt.components.Transform) : false;
  if (tHandler) {
    if (context.state.isChild) {
      tHandler.x = (baseX - (pivotX * baseW) + (fVisual * baseW)) - tBar.x;
    } else {
      const localLeft = baseX - (pivotX * baseW);
      tHandler.x = localLeft + (fVisual * baseW);
    }
  }
}

function isPointerOverSlider(px, py) {
  let pointerOverEngine = false;
  try {
    if (context.input && typeof context.input.isPointerOver === 'function') {
      if (handlerEnt && context.input.isPointerOver(handlerEnt)) pointerOverEngine = true;
      else if (context.input.isPointerOver(barEnt)) pointerOverEngine = true;
    }
  } catch (err) {
    pointerOverEngine = false;
  }
  if (pointerOverEngine) return true;

  const left = context.state.screenLeft;
  const right = context.state.screenRight;
  const top = context.state.screenTop;
  const bottom = context.state.screenBottom;

  const padX = 20;
  const padY = Math.max(25, context.state.baseH);

  return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
}

function processPointer() {
  if (!isInteractive) return;

  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  const mouse = context.input ? context.input.mouse : false;
  const mouseIsDown = Boolean(mouse && (
    (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
    (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
  ));
  const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

  if (!isDown) {
    context.state.isDragging = false;
    return;
  }

  if (!pointer) return;
  const px = pointer.x;
  const py = pointer.y;
  if (typeof px !== 'number' || typeof py !== 'number') return;

  if (!context.state.isDragging) {
    if (isPointerOverSlider(px, py)) {
      context.state.isDragging = true;
    }
  }

  if (context.state.isDragging) {
    const left = context.state.screenLeft;
    const right = context.state.screenRight;
    const baseW = context.state.baseW;

    const clampedX = Math.min(Math.max(px, left), right);
    const fill = baseW > 0 ? ((clampedX - left) / baseW) : 0;
    const computedVal = isReverse
      ? (maxVal - (fill * (maxVal - minVal)))
      : (minVal + (fill * (maxVal - minVal)));
    const snappedVal = snapValue(computedVal);

    if (snappedVal !== context.state.value) {
      context.state.value = snappedVal;
      barEnt._atomicValue = snappedVal;
      updateVisual(snappedVal);

      const normalized = Math.max(0, Math.min(1, (snappedVal - minVal) / (maxVal - minVal)));
      outputs.value = snappedVal;
      outputs.normalized = Number(normalized.toFixed(4));
      outputs.onChanged = true;
      context.triggerFlow('onChanged');
    }
  }
}

updateVisual(context.state.value);
processPointer();

if (!context.state.hasTickListener && typeof context.onTick === 'function') {
  context.state.hasTickListener = true;
  context.onTick(() => {
    processPointer();
  });
}

const norm = Math.max(0, Math.min(1, (context.state.value - minVal) / (maxVal - minVal)));
outputs.value = context.state.value;
outputs.normalized = Number(norm.toFixed(4));
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'switchButtonShape',
      label: 'Switch Button Shape',
      description: 'Mengatur interaksi switch toggle berbasis ShapeRenderer dengan animasi geser knob, area klik slide distance, dan dukungan 2 teks (ON/OFF).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Switch Button (Shape)',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'knobEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'trackEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'textEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'isOn', dataType: 'boolean', color: '#81C784' },
          { id: 'duration', dataType: 'number', color: '#64B5F6' },
          { id: 'slideDist', dataType: 'number', color: '#64B5F6' },
          { id: 'knobOnColor', dataType: 'string', color: '#F48FB1' },
          { id: 'knobOffColor', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOnColor', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOffColor', dataType: 'string', color: '#F48FB1' },
          { id: 'onText', dataType: 'string', color: '#F48FB1' },
          { id: 'offText', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextColor', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextColor', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isOn', dataType: 'boolean', color: '#E57373' },
          { id: 'onOn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onOff', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            knobEntity: '',
            trackEntity: '',
            onTextEntity: '',
            offTextEntity: '',
            textEntity: '',
            isOn: false,
            duration: 0.15,
            slideDist: 40,
            knobOnColor: '#FFFFFF',
            knobOffColor: '#E0E0E0',
            trackOnColor: '#4CAF50',
            trackOffColor: '#757575',
            onText: 'ON',
            offText: 'OFF',
            onTextColor: '#FFFFFF',
            offTextColor: '#BDBDBD'
          },
          code:
`const knobName = typeof inputs.knobEntity === 'string' ? inputs.knobEntity.trim() : '';
const trackName = typeof inputs.trackEntity === 'string' ? inputs.trackEntity.trim() : '';
const onTextName = typeof inputs.onTextEntity === 'string' ? inputs.onTextEntity.trim() : (typeof inputs.textEntity === 'string' ? inputs.textEntity.trim() : '');
const offTextName = typeof inputs.offTextEntity === 'string' ? inputs.offTextEntity.trim() : '';

let knobEnt = false;
if (knobName && context.entity && typeof context.entity.get === 'function') {
  knobEnt = context.entity.get(knobName);
}

let trackEnt = false;
if (trackName && context.entity && typeof context.entity.get === 'function') {
  trackEnt = context.entity.get(trackName);
}

let onTextEnt = false;
if (onTextName && context.entity && typeof context.entity.get === 'function') {
  onTextEnt = context.entity.get(onTextName);
}

let offTextEnt = false;
if (offTextName && context.entity && typeof context.entity.get === 'function') {
  offTextEnt = context.entity.get(offTextName);
}

if (!knobEnt) {
  if (context.console && typeof context.console.warn === 'function' && knobName) {
    context.console.warn('[SwitchShape] Knob entity not found: ' + knobName);
  }
  outputs.execOut = true;
  return;
}

const uiWidth = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.width) || 1920;
const uiHeight = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.height) || 1080;

function getGlobalTransform(entity) {
  if (!entity) return { x: 0, y: 0 };
  let cur = entity;
  let gx = 0;
  let gy = 0;
  while (cur) {
    const t = cur.components && (cur.components.UITransform || cur.components.Transform);
    if (t) {
      gx += (typeof t.x === 'number' ? t.x : 0);
      gy += (typeof t.y === 'number' ? t.y : 0);
    }
    if (cur.parentId && context.entity && typeof context.entity.get === 'function') {
      cur = context.entity.get(cur.parentId);
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

function isPointerOverEntity(ent) {
  if (!ent) return false;
  try {
    if (context.input && typeof context.input.isPointerOver === 'function') {
      if (context.input.isPointerOver(ent)) return true;
    }
  } catch (err) {}
  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;
  const t = ent.components && (ent.components.UITransform || ent.components.Transform);
  if (!t) return false;
  const px = pointer.x;
  const py = pointer.y;
  const w = t.width || 40;
  const h = t.height || 40;
  const pX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
  const pY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;
  const gt = getGlobalTransform(ent);
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

if (!context.state.isInitialized) {
  context.state.isInitialized = true;
  const initialIsOn = typeof knobEnt._switchIsOn === 'boolean'
    ? knobEnt._switchIsOn
    : (trackEnt && typeof trackEnt._switchIsOn === 'boolean' ? trackEnt._switchIsOn : Boolean(inputs.isOn));
  context.state.isOn = initialIsOn;
  context.state.lastInputIsOn = inputs.isOn;
  context.state.progress = context.state.isOn ? 1 : 0;
  context.state.wasDown = false;

  const tKnob = knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
  if (tKnob) {
    if (typeof tKnob._switchOffX === 'number' && typeof tKnob._switchOnX === 'number') {
      context.state.offX = tKnob._switchOffX;
      context.state.onX = tKnob._switchOnX;
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
            context.state.offX = childOffX;
            context.state.onX = childOnX;
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
          context.state.onX = baseX;
          context.state.offX = baseX - travelDist;
        } else {
          context.state.offX = baseX;
          context.state.onX = baseX + travelDist;
        }
      }

      tKnob._switchOffX = context.state.offX;
      tKnob._switchOnX = context.state.onX;
    }

    knobEnt._switchIsOn = context.state.isOn;
    if (trackEnt) {
      trackEnt._switchIsOn = context.state.isOn;
    }

    const prevKnobX = tKnob.x;
    tKnob.x = context.state.offX;
    const knobGT = getGlobalTransform(knobEnt);
    tKnob.x = prevKnobX;

    const knobW = tKnob.width || 40;
    const knobH = tKnob.height || 40;
    const pKnobX = typeof tKnob.pivotX === 'number' ? tKnob.pivotX : 0.5;
    const pKnobY = typeof tKnob.pivotY === 'number' ? tKnob.pivotY : 0.5;

    const top = knobGT.y - (pKnobY * knobH);
    const bottom = top + knobH;

    const minX = Math.min(context.state.offX, context.state.onX);
    const maxX = Math.max(context.state.offX, context.state.onX);
    const originShift = knobGT.x - context.state.offX;
    const left = originShift + minX - (pKnobX * knobW);
    const right = originShift + maxX - (pKnobX * knobW) + knobW;

    context.state.screenLeft = left;
    context.state.screenRight = right;
    context.state.screenTop = top;
    context.state.screenBottom = bottom;
  }
}

if (typeof inputs.isOn === 'boolean' && inputs.isOn !== context.state.lastInputIsOn) {
  context.state.lastInputIsOn = inputs.isOn;
  context.state.isOn = inputs.isOn;
  knobEnt._switchIsOn = inputs.isOn;
  if (trackEnt) {
    trackEnt._switchIsOn = inputs.isOn;
  }
}

function applyVisuals(progress) {
  const tKnob = knobEnt && knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
  if (tKnob && typeof context.state.offX === 'number' && typeof context.state.onX === 'number') {
    const smoothProgress = progress * progress * (3 - (2 * progress));
    tKnob.x = context.state.offX + ((context.state.onX - context.state.offX) * smoothProgress);
  }

  const isVisuallyOn = progress >= 0.5;
  const knobColor = isVisuallyOn ? (inputs.knobOnColor || '#FFFFFF') : (inputs.knobOffColor || '#E0E0E0');
  const trackColor = isVisuallyOn ? (inputs.trackOnColor || '#4CAF50') : (inputs.trackOffColor || '#757575');

  applyShapeColor(knobEnt, knobColor);
  if (trackEnt) {
    applyShapeColor(trackEnt, trackColor);
  }

  if (onTextEnt && offTextEnt && onTextEnt !== offTextEnt) {
    if (onTextEnt.components && onTextEnt.components.TextRenderer) {
      const tx = onTextEnt.components.TextRenderer;
      if (inputs.onText) tx.value = inputs.onText;
      tx.color = isVisuallyOn ? (inputs.onTextColor || '#FFFFFF') : (inputs.offTextColor || '#757575');
      tx.opacity = isVisuallyOn ? 1 : 0.4;
    }
    if (offTextEnt.components && offTextEnt.components.TextRenderer) {
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

applyVisuals(context.state.progress);

function isPointerOverSwitch() {
  if (isPointerOverEntity(knobEnt)) return true;
  if (trackEnt && isPointerOverEntity(trackEnt)) return true;
  if (onTextEnt && isPointerOverEntity(onTextEnt)) return true;
  if (offTextEnt && isPointerOverEntity(offTextEnt)) return true;

  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;

  const px = pointer.x;
  const py = pointer.y;
  const padX = 10;
  const padY = 10;
  const sLeft = context.state.screenLeft;
  const sRight = context.state.screenRight;
  const sTop = context.state.screenTop;
  const sBottom = context.state.screenBottom;

  if (typeof sLeft === 'number' && typeof sRight === 'number' && typeof sTop === 'number' && typeof sBottom === 'number') {
    if (px >= sLeft - padX && px <= sRight + padX && py >= sTop - padY && py <= sBottom + padY) {
      return true;
    }
  }
  return false;
}

function updateStep() {
  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  const mouse = context.input ? context.input.mouse : false;
  const mouseIsDown = Boolean(mouse && (
    (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
    (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
  ));
  const isDown = Boolean((pointer && pointer.down) || mouseIsDown);
  const isJustPressed = Boolean(isDown && !context.state.wasDown);
  context.state.wasDown = isDown;

  if (isJustPressed) {
    let triggered = false;
    let nextState = !context.state.isOn;

    if (offTextEnt && onTextEnt && offTextEnt !== onTextEnt) {
      if (isPointerOverEntity(offTextEnt)) {
        if (context.state.isOn) {
          nextState = false;
          triggered = true;
        }
      } else if (isPointerOverEntity(onTextEnt)) {
        if (!context.state.isOn) {
          nextState = true;
          triggered = true;
        }
      }
    }

    if (!triggered) {
      if (isPointerOverSwitch()) {
        nextState = !context.state.isOn;
        triggered = true;
      }
    }

    if (triggered) {
      context.state.isOn = nextState;
      knobEnt._switchIsOn = nextState;
      if (trackEnt) {
        trackEnt._switchIsOn = nextState;
      }
      outputs.isOn = context.state.isOn;
      if (context.state.isOn) {
        outputs.onOn = true;
        outputs.onOff = false;
        context.triggerFlow('onOn');
      } else {
        outputs.onOff = true;
        outputs.onOn = false;
        context.triggerFlow('onOff');
      }
    }
  }

  const dt = (context.game && typeof context.game.deltaTime === 'number') ? context.game.deltaTime : 0.016;
  const duration = typeof inputs.duration === 'number' ? Math.max(0, inputs.duration) : 0.15;
  const targetProgress = context.state.isOn ? 1 : 0;

  if (duration <= 0) {
    if (context.state.progress !== targetProgress) {
      context.state.progress = targetProgress;
      applyVisuals(targetProgress);
    }
  } else if (context.state.progress !== targetProgress) {
    const step = dt / duration;
    if (context.state.progress < targetProgress) {
      context.state.progress = Math.min(targetProgress, context.state.progress + step);
    } else {
      context.state.progress = Math.max(targetProgress, context.state.progress - step);
    }
    applyVisuals(context.state.progress);
  }
}

updateStep();

if (!context.state.hasTickListener && typeof context.onTick === 'function') {
  context.state.hasTickListener = true;
  context.onTick(() => {
    updateStep();
  });
}

outputs.isOn = context.state.isOn;
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'switchButtonImage',
      label: 'Switch Button Image',
      description: 'Mengatur interaksi switch toggle berbasis SpriteRenderer (gambar/aset) dengan dukungan 1, 2, 3, hingga 4 gambar, area klik slide distance, dan dukungan 2 teks (ON/OFF).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Switch Button (Image)',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'knobEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'trackEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'textEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'isOn', dataType: 'boolean', color: '#81C784' },
          { id: 'duration', dataType: 'number', color: '#64B5F6' },
          { id: 'slideDist', dataType: 'number', color: '#64B5F6' },
          { id: 'knobOffImage', dataType: 'string', color: '#F48FB1' },
          { id: 'knobOnImage', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOffImage', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOnImage', dataType: 'string', color: '#F48FB1' },
          { id: 'onText', dataType: 'string', color: '#F48FB1' },
          { id: 'offText', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextColor', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextColor', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isOn', dataType: 'boolean', color: '#E57373' },
          { id: 'onOn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onOff', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            knobEntity: '',
            trackEntity: '',
            onTextEntity: '',
            offTextEntity: '',
            textEntity: '',
            isOn: false,
            duration: 0.15,
            slideDist: 40,
            knobOffImage: '',
            knobOnImage: '',
            trackOffImage: '',
            trackOnImage: '',
            onText: 'ON',
            offText: 'OFF',
            onTextColor: '#FFFFFF',
            offTextColor: '#BDBDBD'
          },
          code:
`const knobName = typeof inputs.knobEntity === 'string' ? inputs.knobEntity.trim() : '';
const trackName = typeof inputs.trackEntity === 'string' ? inputs.trackEntity.trim() : '';
const onTextName = typeof inputs.onTextEntity === 'string' ? inputs.onTextEntity.trim() : (typeof inputs.textEntity === 'string' ? inputs.textEntity.trim() : '');
const offTextName = typeof inputs.offTextEntity === 'string' ? inputs.offTextEntity.trim() : '';

let knobEnt = false;
if (knobName && context.entity && typeof context.entity.get === 'function') {
  knobEnt = context.entity.get(knobName);
}

let trackEnt = false;
if (trackName && context.entity && typeof context.entity.get === 'function') {
  trackEnt = context.entity.get(trackName);
}

let onTextEnt = false;
if (onTextName && context.entity && typeof context.entity.get === 'function') {
  onTextEnt = context.entity.get(onTextName);
}

let offTextEnt = false;
if (offTextName && context.entity && typeof context.entity.get === 'function') {
  offTextEnt = context.entity.get(offTextName);
}

if (!knobEnt) {
  if (context.console && typeof context.console.warn === 'function' && knobName) {
    context.console.warn('[SwitchImage] Knob entity not found: ' + knobName);
  }
  outputs.execOut = true;
  return;
}

const uiWidth = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.width) || 1920;
const uiHeight = (context.game && context.game.world && context.game.world.settings && context.game.world.settings.ui && context.game.world.settings.ui.height) || 1080;

function getGlobalTransform(entity) {
  if (!entity) return { x: 0, y: 0 };
  let cur = entity;
  let gx = 0;
  let gy = 0;
  while (cur) {
    const t = cur.components && (cur.components.UITransform || cur.components.Transform);
    if (t) {
      gx += (typeof t.x === 'number' ? t.x : 0);
      gy += (typeof t.y === 'number' ? t.y : 0);
    }
    if (cur.parentId && context.entity && typeof context.entity.get === 'function') {
      cur = context.entity.get(cur.parentId);
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

function isPointerOverEntity(ent) {
  if (!ent) return false;
  try {
    if (context.input && typeof context.input.isPointerOver === 'function') {
      if (context.input.isPointerOver(ent)) return true;
    }
  } catch (err) {}
  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;
  const t = ent.components && (ent.components.UITransform || ent.components.Transform);
  if (!t) return false;
  const px = pointer.x;
  const py = pointer.y;
  const w = t.width || 40;
  const h = t.height || 40;
  const pX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
  const pY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;
  const gt = getGlobalTransform(ent);
  const left = gt.x - (pX * w);
  const right = left + w;
  const top = gt.y - (pY * h);
  const bottom = top + h;
  const pad = 10;
  return (px >= left - pad && px <= right + pad && py >= top - pad && py <= bottom + pad);
}

if (!context.state.isInitialized) {
  context.state.isInitialized = true;
  const initialIsOn = typeof knobEnt._switchIsOn === 'boolean'
    ? knobEnt._switchIsOn
    : (trackEnt && typeof trackEnt._switchIsOn === 'boolean' ? trackEnt._switchIsOn : Boolean(inputs.isOn));
  context.state.isOn = initialIsOn;
  context.state.lastInputIsOn = inputs.isOn;
  context.state.progress = context.state.isOn ? 1 : 0;
  context.state.wasDown = false;

  const tKnob = knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
  if (tKnob) {
    if (typeof tKnob._switchOffX === 'number' && typeof tKnob._switchOnX === 'number') {
      context.state.offX = tKnob._switchOffX;
      context.state.onX = tKnob._switchOnX;
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
            context.state.offX = childOffX;
            context.state.onX = childOnX;
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
          context.state.onX = baseX;
          context.state.offX = baseX - travelDist;
        } else {
          context.state.offX = baseX;
          context.state.onX = baseX + travelDist;
        }
      }

      tKnob._switchOffX = context.state.offX;
      tKnob._switchOnX = context.state.onX;
    }

    knobEnt._switchIsOn = context.state.isOn;
    if (trackEnt) {
      trackEnt._switchIsOn = context.state.isOn;
    }

    const prevKnobX = tKnob.x;
    tKnob.x = context.state.offX;
    const knobGT = getGlobalTransform(knobEnt);
    tKnob.x = prevKnobX;

    const knobW = tKnob.width || 40;
    const knobH = tKnob.height || 40;
    const pKnobX = typeof tKnob.pivotX === 'number' ? tKnob.pivotX : 0.5;
    const pKnobY = typeof tKnob.pivotY === 'number' ? tKnob.pivotY : 0.5;

    const top = knobGT.y - (pKnobY * knobH);
    const bottom = top + knobH;

    const minX = Math.min(context.state.offX, context.state.onX);
    const maxX = Math.max(context.state.offX, context.state.onX);
    const originShift = knobGT.x - context.state.offX;
    const left = originShift + minX - (pKnobX * knobW);
    const right = originShift + maxX - (pKnobX * knobW) + knobW;

    context.state.screenLeft = left;
    context.state.screenRight = right;
    context.state.screenTop = top;
    context.state.screenBottom = bottom;
  }
}

if (typeof inputs.isOn === 'boolean' && inputs.isOn !== context.state.lastInputIsOn) {
  context.state.lastInputIsOn = inputs.isOn;
  context.state.isOn = inputs.isOn;
  knobEnt._switchIsOn = inputs.isOn;
  if (trackEnt) {
    trackEnt._switchIsOn = inputs.isOn;
  }
}

function applyVisuals(progress) {
  const tKnob = knobEnt && knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
  if (tKnob && typeof context.state.offX === 'number' && typeof context.state.onX === 'number') {
    const smoothProgress = progress * progress * (3 - (2 * progress));
    tKnob.x = context.state.offX + ((context.state.onX - context.state.offX) * smoothProgress);
  }

  const isVisuallyOn = progress >= 0.5;
  const knobImg = isVisuallyOn ? (inputs.knobOnImage || inputs.knobOffImage) : (inputs.knobOffImage || inputs.knobOnImage);
  const trackImg = isVisuallyOn ? (inputs.trackOnImage || inputs.trackOffImage) : (inputs.trackOffImage || inputs.trackOnImage);

  if (knobEnt && knobEnt.components && knobEnt.components.SpriteRenderer && knobImg) {
    knobEnt.components.SpriteRenderer.assetId = knobImg;
  }

  if (trackEnt && trackEnt.components && trackEnt.components.SpriteRenderer && trackImg) {
    trackEnt.components.SpriteRenderer.assetId = trackImg;
  }

  if (onTextEnt && offTextEnt && onTextEnt !== offTextEnt) {
    if (onTextEnt.components && onTextEnt.components.TextRenderer) {
      const tx = onTextEnt.components.TextRenderer;
      if (inputs.onText) tx.value = inputs.onText;
      tx.color = isVisuallyOn ? (inputs.onTextColor || '#FFFFFF') : (inputs.offTextColor || '#757575');
      tx.opacity = isVisuallyOn ? 1 : 0.4;
    }
    if (offTextEnt.components && offTextEnt.components.TextRenderer) {
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

applyVisuals(context.state.progress);

function isPointerOverSwitch() {
  if (isPointerOverEntity(knobEnt)) return true;
  if (trackEnt && isPointerOverEntity(trackEnt)) return true;
  if (onTextEnt && isPointerOverEntity(onTextEnt)) return true;
  if (offTextEnt && isPointerOverEntity(offTextEnt)) return true;

  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;

  const px = pointer.x;
  const py = pointer.y;
  const padX = 10;
  const padY = 10;
  const sLeft = context.state.screenLeft;
  const sRight = context.state.screenRight;
  const sTop = context.state.screenTop;
  const sBottom = context.state.screenBottom;

  if (typeof sLeft === 'number' && typeof sRight === 'number' && typeof sTop === 'number' && typeof sBottom === 'number') {
    if (px >= sLeft - padX && px <= sRight + padX && py >= sTop - padY && py <= sBottom + padY) {
      return true;
    }
  }
  return false;
}

function updateStep() {
  const pointer = context.input && typeof context.input.getPointer === 'function' ? context.input.getPointer() : false;
  const mouse = context.input ? context.input.mouse : false;
  const mouseIsDown = Boolean(mouse && (
    (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
    (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
  ));
  const isDown = Boolean((pointer && pointer.down) || mouseIsDown);
  const isJustPressed = Boolean(isDown && !context.state.wasDown);
  context.state.wasDown = isDown;

  if (isJustPressed) {
    let triggered = false;
    let nextState = !context.state.isOn;

    if (offTextEnt && onTextEnt && offTextEnt !== onTextEnt) {
      if (isPointerOverEntity(offTextEnt)) {
        if (context.state.isOn) {
          nextState = false;
          triggered = true;
        }
      } else if (isPointerOverEntity(onTextEnt)) {
        if (!context.state.isOn) {
          nextState = true;
          triggered = true;
        }
      }
    }

    if (!triggered) {
      if (isPointerOverSwitch()) {
        nextState = !context.state.isOn;
        triggered = true;
      }
    }

    if (triggered) {
      context.state.isOn = nextState;
      knobEnt._switchIsOn = nextState;
      if (trackEnt) {
        trackEnt._switchIsOn = nextState;
      }
      outputs.isOn = context.state.isOn;
      if (context.state.isOn) {
        outputs.onOn = true;
        outputs.onOff = false;
        context.triggerFlow('onOn');
      } else {
        outputs.onOff = true;
        outputs.onOn = false;
        context.triggerFlow('onOff');
      }
    }
  }

  const dt = (context.game && typeof context.game.deltaTime === 'number') ? context.game.deltaTime : 0.016;
  const duration = typeof inputs.duration === 'number' ? Math.max(0, inputs.duration) : 0.15;
  const targetProgress = context.state.isOn ? 1 : 0;

  if (duration <= 0) {
    if (context.state.progress !== targetProgress) {
      context.state.progress = targetProgress;
      applyVisuals(targetProgress);
    }
  } else if (context.state.progress !== targetProgress) {
    const step = dt / duration;
    if (context.state.progress < targetProgress) {
      context.state.progress = Math.min(targetProgress, context.state.progress + step);
    } else {
      context.state.progress = Math.max(targetProgress, context.state.progress - step);
    }
    applyVisuals(context.state.progress);
  }
}

updateStep();

if (!context.state.hasTickListener && typeof context.onTick === 'function') {
  context.state.hasTickListener = true;
  context.onTick(() => {
    updateStep();
  });
}

outputs.isOn = context.state.isOn;
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'vnDialogueRunner',
      label: 'Dialogue Runner',
      description: 'Menjalankan alur dialog visual novel: efek typewriter, nama pembicara, potret karakter, dan interpolasi variabel.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Dialogue Runner',
          headerColor: '#EC407A',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'dialogMap', dataType: 'map', color: '#FF8A65' },
          { id: 'charMap', dataType: 'map', color: '#FF8A65' },
          { id: 'dialogId', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'textEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'dialogText' },
          { id: 'speakerEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'characterName' },
          { id: 'portraitEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'spriteCharacter' },
          { id: 'nameEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'nameBox' },
          { id: 'clickEntity', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 40 }
        ],
        outputs: [
          { id: 'onNext', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChoice', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'nextDialogId', dataType: 'string', color: '#F48FB1' },
          { id: 'choices', dataType: 'list', color: '#81C784' }
        ],
        data: {
          values: {
            dialogId: '',
            textEntity: 'dialogText',
            speakerEntity: 'characterName',
            portraitEntity: 'spriteCharacter',
            nameEntity: 'nameBox',
            clickEntity: '',
            speed: 40
          },
          code: 
`let dialogMap = inputs.dialogMap || inputs.dialogueMap;
if (!dialogMap) {
  if (typeof context.hasVariable === 'function') {
    if (context.hasVariable('dialogueMap')) {
      dialogMap = context.getVariable('dialogueMap');
    } else if (context.hasVariable('dialogMap')) {
      dialogMap = context.getVariable('dialogMap');
    }
  }
}
let charMap = inputs.charMap || inputs.characterMap;
if (!charMap) {
  if (typeof context.hasVariable === 'function') {
    if (context.hasVariable('characterMap')) {
      charMap = context.getVariable('characterMap');
    } else if (context.hasVariable('charMap')) {
      charMap = context.getVariable('charMap');
    }
  }
}
dialogMap = context.assert.exists(dialogMap, 'Dialog Map must be provided');

let dialogId = inputs.dialogId;
if (context.state.vnNextDialogId && (dialogId === context.state.vnLastDialogId || !dialogId)) {
  dialogId = context.state.vnNextDialogId;
}
if (!dialogId && dialogMap) {
  const keys = Object.keys(dialogMap);
  if (keys.length > 0) {
    dialogId = keys[0];
  }
}
context.state.vnLastDialogId = dialogId;

const entry = dialogMap ? dialogMap[dialogId] : false;

if (!entry) {
  if (context.console && typeof context.console.warn === 'function') {
    context.console.warn('[Dialogue Runner] Dialog ID \\'' + (dialogId || '') + '\\' not found in Dialog Map.');
  }
  outputs.onEnd = true;
  context.triggerFlow('onEnd');
  return;
}

const now = Date.now();
if (!context.state.vnLoopGuard) {
  context.state.vnLoopGuard = { lastTime: now, count: 0 };
}
const guard = context.state.vnLoopGuard;
if (now - guard.lastTime < 150) {
  guard.count++;
  if (guard.count > 25) {
    if (context.console && typeof context.console.error === 'function') {
      context.console.error('[Dialogue Runner] Auto loop detected on dialog \\'' + dialogId + '\\' (' + guard.count + ' iterations in <150ms). Execution aborted to prevent game freeze.');
    }
    outputs.onEnd = true;
    context.triggerFlow('onEnd');
    return;
  }
} else {
  guard.lastTime = now;
  guard.count = 1;
}

const parseVars = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\\{([^{}]+)\\}/g, (match, expression) => {
    const trimmed = expression.trim();
    if (!trimmed) return match;

    if (/^emit(?:Click)?\\s*\\(/i.test(trimmed)) {
      return match;
    }

    const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\\(([^)]+)\\))(.*)$/i);
    let scope = false;
    let varName = false;

    if (scopeMatch) {
      scope = scopeMatch[1].toLowerCase();
      varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
    } else {
      varName = trimmed;
    }

    if (!varName) return match;

    const resolveVar = (sc, name) => {
      try {
        if (sc === 'local' && typeof context.getLocal === 'function') {
          return { found: true, val: context.getLocal(name) };
        }
        if (sc === 'global' && typeof context.getGlobal === 'function') {
          return { found: true, val: context.getGlobal(name) };
        }
      } catch (e) {
        return { found: false };
      }
      return { found: false };
    };

    let result = false;
    let hasResult = false;

    if (scope === 'local') {
      const res = resolveVar('local', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else if (scope === 'global') {
      const res = resolveVar('global', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else {
      if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
        try {
          result = context.getVariable(varName);
          hasResult = true;
        } catch (e) {}
      }
      if (!hasResult) {
        const resLocal = resolveVar('local', varName);
        if (resLocal.found) {
          result = resLocal.val;
          hasResult = true;
        }
      }
      if (!hasResult) {
        const resGlobal = resolveVar('global', varName);
        if (resGlobal.found) {
          result = resGlobal.val;
          hasResult = true;
        }
      }
    }

    if (hasResult) {
      return typeof result === 'object' && result ? JSON.stringify(result) : String(result);
    }
    return match;
  });
};

const splitArgs = (str) => {
  const args = [];
  let cur = '';
  let inQuote = false;
  let quoteChar = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inQuote) {
      cur += c;
      if (c === quoteChar && str[i - 1] !== '\\\\') {
        inQuote = false;
      }
    } else if (c === '"' || c === "'") {
      inQuote = true;
      quoteChar = c;
      cur += c;
    } else if (c === '(' || c === '[' || c === '{') {
      depth++;
      cur += c;
    } else if (c === ')' || c === ']' || c === '}') {
      depth--;
      cur += c;
    } else if (c === ',' && depth === 0) {
      if (cur.trim()) args.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
};

const parseSignalArg = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return false;
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) {
    return { signal: trimmed, value: true };
  }
  const signal = trimmed.slice(0, colonIdx).trim();
  const valRaw = trimmed.slice(colonIdx + 1).trim();
  if (valRaw === '') {
    return { signal, value: true };
  }
  try {
    return { signal, value: JSON.parse(valRaw) };
  } catch (e) {
    return { signal, value: valRaw };
  }
};

const rawEntryText = parseVars(entry.text || '');

let fullText = '';
const emitCues = [];
let lastIdx = 0;
const emitRegex = /\\{emit\\s*\\(([^)]*)\\)\\}/gi;
let m;
while ((m = emitRegex.exec(rawEntryText))) {
  fullText += rawEntryText.slice(lastIdx, m.index);
  const charIdx = fullText.length;
  const sigs = splitArgs(m[1]).map(parseSignalArg).filter(Boolean);
  if (sigs.length > 0) {
    emitCues.push({ index: charIdx, signals: sigs, triggered: false });
  }
  lastIdx = emitRegex.lastIndex;
}
fullText += rawEntryText.slice(lastIdx);

const triggerPendingEmits = (currentIdx) => {
  const cues = context.state.vnEmitCues;
  if (!cues || !context.signal || typeof context.signal.emit !== 'function') return;
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (!cue.triggered && currentIdx >= cue.index) {
      cue.triggered = true;
      for (let s = 0; s < cue.signals.length; s++) {
        context.signal.emit(cue.signals[s].signal, cue.signals[s].value);
      }
    }
  }
};
const textEntId = inputs.textEntity || 'dialogText';
const textEnt = context.assert.exists(context.entity.get(textEntId), 'Dialogue Text entity must exist');
let textComp = textEnt.components ? textEnt.components.TextRenderer : false;
if (!textComp) {
  const children = context.entity.getChildren(textEnt);
  for (let c = 0; c < children.length; c++) {
    if (children[c].components && children[c].components.TextRenderer) {
      textComp = children[c].components.TextRenderer;
      break;
    }
  }
}
context.assert.exists(textComp, 'Dialogue entity or its children must have TextRenderer component');

const spkEntId = inputs.speakerEntity || 'characterName';
const nameEntId = inputs.nameEntity || 'nameBox';
const spkEnt = spkEntId ? context.entity.get(spkEntId) : false;
const nameEnt = nameEntId ? context.entity.get(nameEntId) : false;

const clickEntId = inputs.clickEntity || inputs.clickArea;
const clickEnt = (clickEntId && typeof clickEntId === 'object') ? clickEntId : (clickEntId ? context.entity.get(clickEntId) : false);
if (clickEntId && !clickEnt) {
  if (context.console && typeof context.console.warn === 'function') {
    context.console.warn('[Dialogue Runner] clickEntity \\'' + clickEntId + '\\' not found.');
  }
}

const charData = charMap ? charMap[entry.speaker] : false;
const rawSpeaker = charData && charData.displayName ? charData.displayName : (entry.speaker ? entry.speaker : '');
const isNarrator = !entry.speaker || entry.speaker === 'narrator' || (charData && charData.displayName === '');

if (isNarrator) {
  if (nameEnt) nameEnt.visible = false;
  if (spkEnt) spkEnt.visible = false;
} else {
  if (nameEnt) nameEnt.visible = true;
  if (spkEnt) {
    spkEnt.visible = true;
    let spkComp = spkEnt.components ? spkEnt.components.TextRenderer : false;
    if (!spkComp) {
      const children = context.entity.getChildren(spkEnt);
      for (let c = 0; c < children.length; c++) {
        if (children[c].components && children[c].components.TextRenderer) {
          spkComp = children[c].components.TextRenderer;
          break;
        }
      }
    }
    if (spkComp) {
      spkComp.value = parseVars(rawSpeaker);
      if (charData && charData.nameColor) {
        spkComp.color = charData.nameColor;
      }
    }
  }
}

const portEntId = inputs.portraitEntity || 'spriteCharacter';
if (portEntId) {
  const portEnt = context.entity.get(portEntId);
  if (portEnt) {
    let imgComp = portEnt.components ? (portEnt.components.SpriteRenderer ? portEnt.components.SpriteRenderer : portEnt.components.ImageRenderer) : false;
    let targetEnt = portEnt;
    if (!imgComp) {
      const children = context.entity.getChildren(portEnt);
      for (let c = 0; c < children.length; c++) {
        if (children[c].components && (children[c].components.SpriteRenderer || children[c].components.ImageRenderer)) {
          imgComp = children[c].components.SpriteRenderer ? children[c].components.SpriteRenderer : children[c].components.ImageRenderer;
          targetEnt = children[c];
          break;
        }
      }
    }
    let animComp = false;
    if (targetEnt.components && targetEnt.components.SpriteAnimator) {
      animComp = targetEnt.components.SpriteAnimator;
    } else if (portEnt.components && portEnt.components.SpriteAnimator) {
      animComp = portEnt.components.SpriteAnimator;
    }
    if (imgComp || animComp) {
      const charData = charMap ? charMap[entry.speaker] : false;
      let spriteVal = false;
      if (!isNarrator && charData && charData.sprites) {
        const emo = entry.emotion ? String(entry.emotion).trim() : '';
        if (emo && charData.sprites[emo]) {
          spriteVal = charData.sprites[emo];
        } else if (!emo) {
          spriteVal = charData.sprites.neutral || charData.sprites.default || false;
        } else {
          spriteVal = charData.sprites.neutral || charData.sprites.default || false;
        }
      }

      if (spriteVal) {
        let finalAssetId = spriteVal;
        if (context.asset && typeof context.asset.resolveId === 'function') {
          const resolved = context.asset.resolveId(spriteVal);
          if (resolved) {
            finalAssetId = resolved;
          }
        }
        if (imgComp) {
          imgComp.assetId = finalAssetId;
        }
        if (animComp && animComp.clips && Array.isArray(animComp.clips)) {
          const matchedClip = animComp.clips.find(c => 
            c.scriptId === spriteVal || 
            c.scriptId === entry.emotion || 
            c.id === spriteVal || 
            c.id === entry.emotion ||
            c.assetId === finalAssetId ||
            c.id === finalAssetId
          );
          if (matchedClip) {
            animComp.currentClip = matchedClip.id;
          }
        }
        portEnt.visible = true;
        if (targetEnt !== portEnt) targetEnt.visible = true;
      } else {
        portEnt.visible = false;
        if (targetEnt !== portEnt) targetEnt.visible = false;
      }
    }
  }
}

const rawSpeed = Number(inputs.speed);
const speed = isNaN(rawSpeed) ? 40 : Math.max(0, rawSpeed);

context.state.vnTargetText = fullText;
context.state.vnEmitCues = emitCues;
context.state.vnTimer = 0;
context.state.vnCompleted = false;

const currentPointer = context.input ? context.input.getPointer() : false;
context.state.vnWasDown = Boolean(currentPointer && currentPointer.down);

if (speed === 0 || fullText.length === 0) {
  context.state.vnIndex = fullText.length;
  context.state.vnIsTyping = false;
  textComp.value = fullText;
  triggerPendingEmits(fullText.length);
  if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
    context.state.vnCompleted = true;
    outputs.choices = entry.choices;
    outputs.onChoice = true;
    context.triggerFlow('onChoice');
  }
} else {
  context.state.vnIndex = 0;
  context.state.vnIsTyping = true;
  textComp.value = '';
  triggerPendingEmits(0);
}

context.onTick((tickDt) => {
  if (context.state.vnCompleted) return;

  const dtSec = (typeof tickDt === 'number' && tickDt > 0) ? tickDt : (context.dt || 0.016);
  const dt = dtSec * 1000;

  const pointer = context.input ? context.input.getPointer() : false;
  const isPointerDown = Boolean(pointer && pointer.down);
  const isNewPointerDown = isPointerDown && !context.state.vnWasDown;
  context.state.vnWasDown = isPointerDown;

  const kbd = context.input && context.input.keyboard;
  const isKeyAdvance = Boolean(
    kbd && (
      kbd.isPressed('Space') ||
      kbd.isPressed('Enter') ||
      kbd.isPressed('KeyZ')
    )
  );

  let isPointerClick = false;
  if (isNewPointerDown) {
    if (clickEnt) {
      if (clickEnt.active !== false && clickEnt.visible !== false) {
        if (context.input && typeof context.input.isPointerOver === 'function') {
          isPointerClick = Boolean(context.input.isPointerOver(clickEnt, true));
        }
      }
    } else if (!clickEntId) {
      isPointerClick = true;
    }
  }

  const isClick = isPointerClick || isKeyAdvance;

  if (context.state.vnIsTyping) {
    if (isClick) {
      context.state.vnIndex = context.state.vnTargetText.length;
      textComp.value = context.state.vnTargetText;
      context.state.vnIsTyping = false;
      triggerPendingEmits(context.state.vnTargetText.length);
      if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
        context.state.vnCompleted = true;
        outputs.choices = entry.choices;
        outputs.onChoice = true;
        context.triggerFlow('onChoice');
      }
      return;
    }

    const charSpeed = Math.max(1, speed);
    context.state.vnTimer += dt;
    while (context.state.vnTimer >= charSpeed && context.state.vnIndex < context.state.vnTargetText.length) {
      context.state.vnTimer -= charSpeed;
      context.state.vnIndex++;
      triggerPendingEmits(context.state.vnIndex);
    }
    textComp.value = context.state.vnTargetText.slice(0, context.state.vnIndex);

    if (context.state.vnIndex >= context.state.vnTargetText.length) {
      context.state.vnIsTyping = false;
      if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
        context.state.vnCompleted = true;
        outputs.choices = entry.choices;
        outputs.onChoice = true;
        context.triggerFlow('onChoice');
      }
    }
  } else {
    if (isClick) {
      context.state.vnCompleted = true;
      if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
        outputs.choices = entry.choices;
        outputs.onChoice = true;
        context.triggerFlow('onChoice');
      } else if (entry.next) {
        context.state.vnNextDialogId = entry.next;
        outputs.nextDialogId = entry.next;
        outputs.onNext = true;
        context.triggerFlow('onNext');
      } else {
        context.state.vnNextDialogId = false;
        outputs.onEnd = true;
        context.triggerFlow('onEnd');
      }
    }
  }
});
return;`
        }
      }
    },
    {
      type: 'vnChoicePresenter',
      label: 'Choice Presenter',
      description: 'Menampilkan tombol pilihan secara dinamis, mengelola interaksi klik pemain, dan memicu sinyal aksi.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Choice Presenter',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'choices', dataType: 'list', color: '#81C784' },
          { id: 'buttonEntities', dataType: 'list', color: '#81C784', defaultValue: ['btnChoice1', 'btnChoice2', 'btnChoice3'] },
          { id: 'textEntities', dataType: 'list', color: '#81C784', defaultValue: ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'] },
          { id: 'activationDelay', dataType: 'number', color: '#64B5F6', defaultValue: 250 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'nextDialogId', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            choices: [],
            buttonEntities: ['btnChoice1', 'btnChoice2', 'btnChoice3'],
            textEntities: ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'],
            activationDelay: 250
          },
          code: 
`const choices = inputs.choices;
const buttons = inputs.buttonEntities || ['btnChoice1', 'btnChoice2', 'btnChoice3'];
const textEntities = inputs.textEntities || ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'];

context.assert.isArray(choices, 'Choices must be a valid array');
context.assert.isArray(buttons, 'Button entities must be a valid array');

const splitArgs = (str) => {
  const args = [];
  let cur = '';
  let inQuote = false;
  let quoteChar = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inQuote) {
      cur += c;
      if (c === quoteChar && str[i - 1] !== '\\\\') {
        inQuote = false;
      }
    } else if (c === '"' || c === "'") {
      inQuote = true;
      quoteChar = c;
      cur += c;
    } else if (c === '(' || c === '[' || c === '{') {
      depth++;
      cur += c;
    } else if (c === ')' || c === ']' || c === '}') {
      depth--;
      cur += c;
    } else if (c === ',' && depth === 0) {
      if (cur.trim()) args.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
};

const parseSignalArg = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return false;
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) {
    return { signal: trimmed, value: true };
  }
  const signal = trimmed.slice(0, colonIdx).trim();
  const valRaw = trimmed.slice(colonIdx + 1).trim();
  if (valRaw === '') {
    return { signal, value: true };
  }
  try {
    return { signal, value: JSON.parse(valRaw) };
  } catch (e) {
    return { signal, value: valRaw };
  }
};

const parseVars = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\\{([^{}]+)\\}/g, (match, expression) => {
    const trimmed = expression.trim();
    if (!trimmed) return match;

    if (/^emit(?:Click)?\\s*\\(/i.test(trimmed)) {
      return match;
    }

    const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\\(([^)]+)\\))(.*)$/i);
    let scope = false;
    let varName = false;

    if (scopeMatch) {
      scope = scopeMatch[1].toLowerCase();
      varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
    } else {
      varName = trimmed;
    }

    if (!varName) return match;

    const resolveVar = (sc, name) => {
      try {
        if (sc === 'local' && typeof context.getLocal === 'function') {
          return { found: true, val: context.getLocal(name) };
        }
        if (sc === 'global' && typeof context.getGlobal === 'function') {
          return { found: true, val: context.getGlobal(name) };
        }
      } catch (e) {
        return { found: false };
      }
      return { found: false };
    };

    let result = false;
    let hasResult = false;

    if (scope === 'local') {
      const res = resolveVar('local', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else if (scope === 'global') {
      const res = resolveVar('global', varName);
      if (res.found) {
        result = res.val;
        hasResult = true;
      }
    } else {
      if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
        try {
          result = context.getVariable(varName);
          hasResult = true;
        } catch (e) {}
      }
      if (!hasResult) {
        const resLocal = resolveVar('local', varName);
        if (resLocal.found) {
          result = resLocal.val;
          hasResult = true;
        }
      }
      if (!hasResult) {
        const resGlobal = resolveVar('global', varName);
        if (resGlobal.found) {
          result = resGlobal.val;
          hasResult = true;
        }
      }
    }

    if (hasResult) {
      return typeof result === 'object' && result ? JSON.stringify(result) : String(result);
    }
    return match;
  });
};

for (let i = 0; i < buttons.length; i++) {
  const btnEnt = context.entity.get(buttons[i]);
  const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
  if (!btnEnt) continue;

  if (i < choices.length) {
    btnEnt.visible = true;
    if (txtEnt) txtEnt.visible = true;

    let textComp = txtEnt && txtEnt.components ? txtEnt.components.TextRenderer : false;
    if (!textComp) {
      textComp = btnEnt.components ? btnEnt.components.TextRenderer : false;
      if (!textComp) {
        const children = context.entity.getChildren(btnEnt);
        for (let c = 0; c < children.length; c++) {
          if (children[c].components && children[c].components.TextRenderer) {
            textComp = children[c].components.TextRenderer;
            break;
          }
        }
      }
    }
    if (textComp) {
      const rawText = choices[i].text || '';
      const textWithoutEmit = rawText.replace(/\\{emitClick\\s*\\([^)]*\\)\\}/gi, '').trim();
      textComp.value = parseVars(textWithoutEmit);
    }
  } else {
    btnEnt.visible = false;
    if (txtEnt) txtEnt.visible = false;
  }
}

context.state.choiceShowTime = Date.now();
const initPointer = context.input ? context.input.getPointer() : false;
context.state.choiceWasDown = Boolean(initPointer && initPointer.down);

context.onTick(() => {
  const pointer = context.input ? context.input.getPointer() : false;
  const isPointerDown = pointer && pointer.down;

  const rawDelay = Number(inputs.activationDelay);
  const delay = isNaN(rawDelay) ? 250 : Math.max(0, rawDelay);
  const now = Date.now();

  if (now - context.state.choiceShowTime < delay) {
    context.state.choiceWasDown = Boolean(isPointerDown);
    return;
  }

  const isClick = isPointerDown && !context.state.choiceWasDown;
  context.state.choiceWasDown = isPointerDown;

  if (!isClick) return;

  for (let i = 0; i < choices.length; i++) {
    if (i >= buttons.length) break;
    const btnEnt = context.entity.get(buttons[i]);
    if (!btnEnt || !btnEnt.visible) continue;
    const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
    let isHovering = false;
    if (context.input && typeof context.input.isPointerOver === 'function') {
      isHovering = context.input.isPointerOver(btnEnt, true);
      if (!isHovering && txtEnt) {
        isHovering = context.input.isPointerOver(txtEnt, true);
      }
      if (!isHovering) {
        isHovering = context.input.isPointerOver(btnEnt, false);
      }
      if (!isHovering && txtEnt) {
        isHovering = context.input.isPointerOver(txtEnt, false);
      }
    }
    if (isHovering) {
      const selected = choices[i];

      for (let j = 0; j < buttons.length; j++) {
        const b = context.entity.get(buttons[j]);
        if (b) b.visible = false;
        if (textEntities && textEntities[j]) {
          const t = context.entity.get(textEntities[j]);
          if (t) t.visible = false;
        }
      }

      context.state.vnNextDialogId = selected.next;
      outputs.nextDialogId = selected.next;

      const rawText = selected.text || '';
      const emitMatches = [...rawText.matchAll(/\\{emitClick\\s*\\(([^)]*)\\)\\}/gi)];
      for (let m = 0; m < emitMatches.length; m++) {
        const sigs = splitArgs(emitMatches[m][1]).map(parseSignalArg).filter(Boolean);
        for (let s = 0; s < sigs.length; s++) {
          context.signal.emit(sigs[s].signal, sigs[s].value);
        }
      }

      if (selected.signals && Array.isArray(selected.signals) && selected.signals.length > 0) {
        for (let s = 0; s < selected.signals.length; s++) {
          const sig = selected.signals[s];
          context.signal.emit(sig, true);
        }
      }

      outputs.execOut = true;
      context.triggerFlow('execOut');
      return;
    }
  }
});
return;`
        }
      }
    },
    {
      type: 'platformerController',
      label: 'Platformer Controller',
      description: 'All-in-one platformer movement helper (Left, Right, Jump, Drop-Through Platform, Land Detection).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Platformer Controller',
          headerColor: '#2E7D32',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 260 },
          { id: 'jumpForce', dataType: 'number', color: '#64B5F6', defaultValue: 520 },
          { id: 'keyLeft', dataType: 'string', color: '#F48FB1', defaultValue: 'a' },
          { id: 'keyRight', dataType: 'string', color: '#F48FB1', defaultValue: 'd' },
          { id: 'keyJump', dataType: 'string', color: '#F48FB1', defaultValue: 'space' },
          { id: 'keyDown', dataType: 'string', color: '#F48FB1', defaultValue: 's' },
          { id: 'oneWayTag', dataType: 'string', color: '#F48FB1', defaultValue: 'platform' },
          { id: 'dropNudge', dataType: 'number', color: '#64B5F6', defaultValue: 6 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onJump', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onLand', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onDrop', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isGrounded', dataType: 'boolean', color: '#81C784' },
          { id: 'movementState', dataType: 'string', color: '#F48FB1' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'velocityX', dataType: 'number', color: '#64B5F6' },
          { id: 'velocityY', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            speed: 260,
            jumpForce: 520,
            keyLeft: 'a',
            keyRight: 'd',
            keyJump: 'space',
            keyDown: 's',
            oneWayTag: 'platform',
            dropNudge: 6
          },
          code: 
`const targetId = inputs.targetEntity || 'self';
const target = context.assert.exists(context.entity.get(targetId));
const phys = target.components && target.components.Physics;
const keyboard = context.input.keyboard;

if (!context.state.platformer) {
  context.state.platformer = { wasGrounded: false };
}
const state = context.state.platformer;

const keyLeft = String(inputs.keyLeft || 'a').trim().toLowerCase();
const keyRight = String(inputs.keyRight || 'd').trim().toLowerCase();
const keyJump = String(inputs.keyJump || 'space').trim().toLowerCase();
const keyDown = String(inputs.keyDown || 's').trim().toLowerCase();

const speed = Number(inputs.speed !== undefined ? inputs.speed : 260);
const jumpForce = Number(inputs.jumpForce !== undefined ? inputs.jumpForce : 520);
const dropNudge = Number(inputs.dropNudge !== undefined ? inputs.dropNudge : 6);

const dt = Number(context.dt || context.deltaTime || 0.016);
const combatState = target._combat;
const isCombatAttacking = Boolean(combatState && combatState.isAttacking);

const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
if (isKnockedBack) {
  target._knockback.duration -= dt;
}

let moveDirX = 0;
if (!isCombatAttacking && !isKnockedBack) {
  if (keyboard.isDown(keyRight)) moveDirX += 1;
  if (keyboard.isDown(keyLeft)) moveDirX -= 1;
}

const isGrounded = Boolean(phys ? phys.isGrounded : true);
const isDownPressed = keyboard.isDown(keyDown);
const isJumpTriggered = !isCombatAttacking && !isKnockedBack && keyboard.isPressed(keyJump);

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
} else {
  const moveX = moveDirX * speed * dt;
  context.collider.moveAndSlide(target, moveX, 0);
}

if (!state.wasGrounded && isGrounded && !didDrop && !didJump) {
  outputs.onLand = true;
}
state.wasGrounded = isGrounded;

outputs.isGrounded = isGrounded;
outputs.movementState = isCombatAttacking ? 'attack' : (phys ? phys.movementState : (moveDirX !== 0 ? 'running' : 'idle'));
outputs.facingDirection = phys ? (phys.facingDirection || 'right') : (moveDirX < 0 ? 'left' : 'right');
outputs.velocityX = phys ? phys.velocityX : (moveDirX * speed);
outputs.velocityY = phys ? phys.velocityY : 0;
outputs.execOut = true;

return;`
        }
      }
    },
    {
      type: 'platformerAnimator',
      label: 'Platformer Animator',
      description: 'Smart platformer animator helper (idle, run, jump, fall, auto left/right orientation and auto-flip).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Platformer Animator',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'idleClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'walkClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'runClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'jumpClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'fallClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'hitClips', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'isHit', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'movementState', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'autoFlipX', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onClipChanged', dataType: 'execution', color: '#FFFFFF' },
          { id: 'currentClip', dataType: 'string', color: '#F48FB1' },
          { id: 'activeState', dataType: 'string', color: '#F48FB1' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'isFlipped', dataType: 'boolean', color: '#81C784' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            idleClips: '',
            walkClips: '',
            runClips: '',
            jumpClips: '',
            fallClips: '',
            hitClips: '',
            isHit: false,
            movementState: '',
            facingDirection: '',
            autoFlipX: true
          },
          code: 
`const targetId = inputs.targetEntity || 'self';
const target = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(target, 'SpriteAnimator');
const phys = target.components && target.components.Physics;
const transform = target.components && target.components.Transform;

if (!context.state.platformerAnim) {
  context.state.platformerAnim = {
    lastState: 'idle',
    lastFacing: 'right',
    lastClip: '',
    prevX: transform ? transform.x : 0,
    prevY: transform ? transform.y : 0
  };
}
const state = context.state.platformerAnim;

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

const idleInput = String(inputs.idleClips || (node.data && node.data.values && node.data.values.idleClips) || '');
const walkInput = String(inputs.walkClips || (node.data && node.data.values && node.data.values.walkClips) || '');
const runInput = String(inputs.runClips || (node.data && node.data.values && node.data.values.runClips) || '');
const jumpInput = String(inputs.jumpClips || (node.data && node.data.values && node.data.values.jumpClips) || '');
const fallInput = String(inputs.fallClips || (node.data && node.data.values && node.data.values.fallClips) || '');
const hitInput = String(inputs.hitClips || (node.data && node.data.values && node.data.values.hitClips) || '');

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
  const dx = transform.x - state.prevX;
  if (dx < -0.2) facing = 'left';
  else if (dx > 0.2) facing = 'right';
}

if (!facing) {
  facing = state.lastFacing || 'right';
}
state.lastFacing = facing;

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

const dt = Number(context.dt || context.deltaTime || 0.016);
if (isKnockedBack && !target._ai && (!phys || phys._isIntentionalMove === undefined)) {
  target._knockback.duration -= dt;
}

if (!isHit && state.lastState === 'hit' && hitCfg) {
  const currentClipId = animator.currentClip || state.lastClip;
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
  const combatState = target._combat || context.state.platformerCombat;
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
    state.prevX = transform.x;
    state.prevY = transform.y;
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

  state.lastState = 'hit';
  state.lastClip = animator.currentClip || resolvedClipId;

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

const combatState = target._combat || context.state.platformerCombat;
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
    state.prevX = transform.x;
    state.prevY = transform.y;
  }
  state.lastState = 'attack';
  state.lastClip = animator.currentClip || '';
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
    const dy = (typeof transform.y === 'number') ? transform.y - state.prevY : 0;
    const dx = (typeof transform.x === 'number') ? transform.x - state.prevX : 0;
    if (dy < -0.5) moveState = 'jump';
    else if (dy > 0.5) moveState = 'fall';
    else if (Math.abs(dx) > 0.2) {
      if (walkCfg && !runCfg) moveState = 'walk';
      else moveState = 'run';
    } else {
      moveState = 'idle';
    }
  } else {
    moveState = state.lastState || 'idle';
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

let targetClipName = '';
let isSingle = false;
if (selectedCfg) {
  targetClipName = (facing === 'left') ? selectedCfg.left : selectedCfg.right;
  isSingle = Boolean(selectedCfg.isSingle);
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

let autoFlipX = true;
if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
  autoFlipX = false;
}

let shouldFlip = false;
if (isSingle && autoFlipX) {
  shouldFlip = (facing === 'left');
}

if (transform) {
  transform.flipX = shouldFlip;
}

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
  state.prevX = transform.x;
  state.prevY = transform.y;
}
state.lastState = resolvedState;
state.lastClip = animator.currentClip || resolvedClipId;

outputs.execOut = true;
outputs.currentClip = animator.currentClip || resolvedClipId || '';
outputs.activeState = resolvedState;
outputs.facingDirection = facing;
outputs.isFlipped = shouldFlip;

if (clipChanged) {
  outputs.onClipChanged = true;
}

return;`
        }
      }
    },
    {
      type: 'platformerCombat',
      label: 'Platformer Combat',
      description: 'All-in-one platformer combat helper (ground combos, air attacks, frame-accurate hitbox activation, auto clip playing, facing detection, and target damage).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Platformer Combat',
          headerColor: '#D32F2F',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'triggerAttack', dataType: 'boolean', color: '#81C784', defaultValue: false },
          { id: 'keyAttack', dataType: 'string', color: '#F48FB1', defaultValue: 'j' },
          { id: 'targetTag', dataType: 'string', color: '#F48FB1', defaultValue: 'enemy' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'isGrounded', dataType: 'boolean', color: '#81C784', defaultValue: true },
          { id: 'attacksConfig', dataType: 'map', color: '#FF8A65' },
          { id: 'attackCooldown', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'comboBufferTime', dataType: 'number', color: '#64B5F6', defaultValue: 0.35 },
          { id: 'autoLockMovement', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackStart', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHitboxActive', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isAttacking', dataType: 'boolean', color: '#81C784' },
          { id: 'canMove', dataType: 'boolean', color: '#81C784' },
          { id: 'isCoolingDown', dataType: 'boolean', color: '#81C784' },
          { id: 'cooldownRemaining', dataType: 'number', color: '#64B5F6' },
          { id: 'currentCombo', dataType: 'number', color: '#64B5F6' },
          { id: 'currentClip', dataType: 'string', color: '#F48FB1' },
          { id: 'hitTarget', dataType: 'string', color: '#F48FB1' },
          { id: 'damage', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            triggerAttack: false,
            keyAttack: 'j',
            targetTag: 'enemy',
            facingDirection: '',
            isGrounded: true,
            attackCooldown: 0,
            comboBufferTime: 0.35,
            autoLockMovement: true,
            attacksConfig: {
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
            }
          },
          code: 
`const targetId = inputs.targetEntity || 'self';
const target = context.assert.exists(context.entity.get(targetId));
const animator = target.components && target.components.SpriteAnimator;
const phys = target.components && target.components.Physics;
const transform = target.components && target.components.Transform;
const keyboard = context.input.keyboard;
const dt = Number(context.dt || context.deltaTime || 0.016);

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
const state = target._combat;

if (state.cooldownTimer > 0) {
  state.cooldownTimer -= dt;
  if (state.cooldownTimer < 0) state.cooldownTimer = 0;
}

let config = inputs.attacksConfig;
if (!config && node.data && node.data.values && node.data.values.attacksConfig) {
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
    facing = state.lastFacing || 'right';
  }
}
state.lastFacing = facing;

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

const attackCooldown = Number(inputs.attackCooldown ?? (node.data?.values?.attackCooldown || 0));
const comboBufferTime = Number(inputs.comboBufferTime ?? 0.35);
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
  state.isAttacking = true;
  state.currentCombo = comboIdx;
  state.comboTimer = comboBufferTime;
  state.bufferAttack = false;
  state.hasTriggeredHitboxActive = false;
  state.hitEntitiesThisAttack = [];
  state.currentAttackDef = attackDef;

  if (animator && attackDef && attackDef.clip) {
    const rawClips = animator.clips;
    const clipObj = findClip(rawClips, attackDef.clip);
    const resolvedId = clipObj ? clipObj.id : attackDef.clip;
    animator.currentClip = resolvedId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (clipObj) clipObj.frameIndex = 0;
    state.activeClipId = resolvedId;
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

const canStartAttack = !state.isAttacking && (state.cooldownTimer <= 0);

if (!state.isAttacking) {
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.currentCombo = 0;
    }
  }

  if (canStartAttack && isAttackTriggered) {
    const nextCombo = (state.comboTimer > 0 && isGrounded && attackCooldown <= 0) ? (state.currentCombo + 1) : 0;
    triggerAttack(nextCombo);
  }
} else {
  if (isAttackTriggered) {
    state.bufferAttack = true;
  }

  const attackDef = state.currentAttackDef;
  const activeClipId = animator ? (animator.currentClip || state.activeClipId) : state.activeClipId;
  const rawClips = animator ? animator.clips : [];
  const clipObj = findClip(rawClips, activeClipId);

  const currentFrame = (clipObj && typeof clipObj.frameIndex === 'number') ? clipObj.frameIndex : 0;
  const totalFrames = (clipObj && Array.isArray(clipObj.frames)) ? clipObj.frames.length : 1;
  const isAnimFinished = animator ? (!animator.isPlaying || currentFrame >= totalFrames - 1) : false;

  const startFrame = attackDef ? (attackDef.startFrame ?? (attackDef.hitbox && attackDef.hitbox.startFrame) ?? 1) : 1;
  const endFrame = attackDef ? (attackDef.endFrame ?? (attackDef.hitbox && attackDef.hitbox.endFrame) ?? Math.max(startFrame, totalFrames - 1)) : 1;

  const isHitboxFrame = currentFrame >= startFrame && currentFrame <= endFrame;
  const colScriptId = attackDef?.colliderScriptId || attackDef?.colliderId;

  if (isHitboxFrame) {
    if (!state.hasTriggeredHitboxActive) {
      outputs.onHitboxActive = true;
      state.hasTriggeredHitboxActive = true;
    }

    if (colScriptId && context.collider?.setShapeEnabled) {
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

        let hbW = 40, hbH = 32, hbOffX = 32, hbOffY = 0;
        if (colScriptId && target.components?.Collider?.data) {
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
          hbOffX = Number(hb.offsetX ?? 32);
          hbOffY = Number(hb.offsetY ?? 0);
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
          if (state.hitEntitiesThisAttack.includes(other.id)) continue;

          let overlaps = false;
          const otherCollider = other.components?.Collider;
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
              const oW = (oT.width || 32) * Math.abs(oT.scaleX ?? 1);
              const oH = (oT.height || 32) * Math.abs(oT.scaleY ?? 1);
              const oPivotX = oT.pivotX ?? 0.5;
              const oPivotY = oT.pivotY ?? 0.5;
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
      if (!other || state.hitEntitiesThisAttack.includes(other.id)) continue;
      state.hitEntitiesThisAttack.push(other.id);
      const dmg = Number(attackDef ? attackDef.damage : 10) || 10;
      
      if (other.components && other.components.Health) {
        other.components.Health.current = Math.max(0, (other.components.Health.current ?? 100) - dmg);
      } else if (typeof other.hp === 'number') {
        other.hp = Math.max(0, other.hp - dmg);
      }

      const kbX = (attackDef?.knockbackX ?? attackDef?.knockback?.x ?? 150) * sign;
      const kbY = Number(attackDef?.knockbackY ?? attackDef?.knockback?.y ?? -50);

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
    if (colScriptId && context.collider?.setShapeEnabled) {
      context.collider.setShapeEnabled(target, colScriptId, false);
    }
  }

  if (isAnimFinished) {
    if (colScriptId && context.collider?.setShapeEnabled) {
      context.collider.setShapeEnabled(target, colScriptId, false);
    }
    if (state.bufferAttack && isGrounded && attackCooldown <= 0) {
      triggerAttack(state.currentCombo + 1);
    } else {
      state.isAttacking = false;
      state.comboTimer = comboBufferTime;
      if (attackCooldown > 0) {
        state.cooldownTimer = attackCooldown;
      }
      outputs.onAttackEnd = true;
    }
  }
}

const canMove = !(autoLockMovement && state.isAttacking && isGrounded);

outputs.execOut = true;
outputs.isAttacking = state.isAttacking;
outputs.canMove = canMove;
outputs.isCoolingDown = state.cooldownTimer > 0;
outputs.cooldownRemaining = Math.max(0, state.cooldownTimer || 0);
outputs.currentCombo = state.currentCombo;
outputs.currentClip = animator ? (animator.currentClip || state.activeClipId || '') : (state.activeClipId || '');
if (!outputs.damage) outputs.damage = state.currentAttackDef ? (state.currentAttackDef.damage || 0) : 0;
if (!outputs.hitTarget) outputs.hitTarget = '';

return;`
        }
      }
    },
    {
      type: 'enemyChaser',
      label: 'Enemy Chaser',
      description: 'Smart enemy platformer AI with patrol, player chasing, attack range detection, and movement states.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Enemy Chaser',
          headerColor: '#FF6F00',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'playerTag', dataType: 'string', color: '#F48FB1', defaultValue: 'player' },
          { id: 'detectRadius', dataType: 'number', color: '#64B5F6', defaultValue: 250 },
          { id: 'loseRadius', dataType: 'number', color: '#64B5F6', defaultValue: 350 },
          { id: 'stopRadius', dataType: 'number', color: '#64B5F6', defaultValue: 45 },
          { id: 'chaseSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 160 },
          { id: 'patrolSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 70 },
          { id: 'patrolDistance', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'autoFlipX', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onTargetAcquired', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onTargetLost', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onInAttackRange', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isChasing', dataType: 'boolean', color: '#81C784' },
          { id: 'inAttackRange', dataType: 'boolean', color: '#81C784' },
          { id: 'movementState', dataType: 'string', color: '#F48FB1' },
          { id: 'distanceToTarget', dataType: 'number', color: '#64B5F6' },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1' },
          { id: 'targetPlayer', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            playerTag: 'player',
            detectRadius: 250,
            loseRadius: 350,
            stopRadius: 45,
            chaseSpeed: 160,
            patrolSpeed: 70,
            patrolDistance: 100,
            autoFlipX: true
          },
          code:
`const targetId = inputs.targetEntity || 'self';
const target = context.assert.exists(context.entity.get(targetId));
const phys = target.components && target.components.Physics;
const transform = target.components && target.components.Transform;
const dt = Number(context.dt || context.deltaTime || 0.016);

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
const detectRadius = Number(inputs.detectRadius ?? 250);
const loseRadius = Number(inputs.loseRadius ?? 350);
const stopRadius = Number(inputs.stopRadius ?? 45);
const chaseSpeed = Number(inputs.chaseSpeed ?? 160);
const patrolSpeed = Number(inputs.patrolSpeed ?? 70);
const patrolDistance = Number(inputs.patrolDistance ?? 100);
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
  if (patrolDistance > 0 && transform) {
    const minX = ai.spawnX - patrolDistance;
    const maxX = ai.spawnX + patrolDistance;
    if (transform.x <= minX) ai.patrolDir = 1;
    else if (transform.x >= maxX) ai.patrolDir = -1;
    ai.facing = ai.patrolDir < 0 ? 'left' : 'right';
    moveVelX = ai.patrolDir * patrolSpeed;
    movementState = 'walk';
  } else {
    moveVelX = 0;
    movementState = 'idle';
  }
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
} else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
  context.collider.moveAndSlide(target, moveVelX * dt, 0);
} else if (transform) {
  transform.x += moveVelX * dt;
}

if (transform && autoFlipX) {
  transform.flipX = (ai.facing === 'left');
}

outputs.execOut = true;
outputs.isChasing = isChasing;
outputs.inAttackRange = inAttackRange;
outputs.movementState = movementState;
outputs.distanceToTarget = isFinite(minDistance) ? minDistance : -1;
outputs.facingDirection = ai.facing;
outputs.targetPlayer = ai.targetId || '';

return;`
        }
      }
    },
    {
      type: 'enemyCombat',
      label: 'Enemy Combat',
      description: 'All-in-one enemy attack helper with cooldown, frame-accurate hitbox window, auto clip playing, damage, and player knockback.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Enemy Combat',
          headerColor: '#C2185B',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'triggerAttack', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'playerTag', dataType: 'string', color: '#F48FB1', defaultValue: 'player' },
          { id: 'attackClip', dataType: 'string', color: '#F48FB1', defaultValue: 'attack' },
          { id: 'attackCooldown', dataType: 'number', color: '#64B5F6', defaultValue: 1.5 },
          { id: 'startFrame', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'endFrame', dataType: 'number', color: '#64B5F6', defaultValue: 3 },
          { id: 'hitboxConfig', dataType: 'map', color: '#FF8A65' },
          { id: 'damage', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'knockbackX', dataType: 'number', color: '#64B5F6', defaultValue: 180 },
          { id: 'knockbackY', dataType: 'number', color: '#64B5F6', defaultValue: -60 },
          { id: 'autoTriggerInRange', dataType: 'boolean', color: '#E57373', defaultValue: true },
          { id: 'facingDirection', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackStart', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHitboxActive', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onAttackEnd', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isAttacking', dataType: 'boolean', color: '#81C784' },
          { id: 'isCoolingDown', dataType: 'boolean', color: '#81C784' },
          { id: 'cooldownRemaining', dataType: 'number', color: '#64B5F6' },
          { id: 'currentClip', dataType: 'string', color: '#F48FB1' },
          { id: 'damageDealt', dataType: 'number', color: '#64B5F6' },
          { id: 'hitPlayer', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            playerTag: 'player',
            attackClip: 'attack',
            attackCooldown: 1.5,
            startFrame: 1,
            endFrame: 3,
            hitboxConfig: { offsetX: 30, offsetY: 0, width: 36, height: 32 },
            damage: 10,
            knockbackX: 180,
            knockbackY: -60,
            autoTriggerInRange: true,
            facingDirection: ''
          },
          code:
`const targetId = inputs.targetEntity || 'self';
const target = context.assert.exists(context.entity.get(targetId));
const animator = target.components && target.components.SpriteAnimator;
const phys = target.components && target.components.Physics;
const transform = target.components && target.components.Transform;
const dt = Number(context.dt || context.deltaTime || 0.016);

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
const state = target._combat;

if (state.cooldownTimer > 0) {
  state.cooldownTimer = Math.max(0, state.cooldownTimer - dt);
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
    facing = state.lastFacing || 'right';
  }
}
state.lastFacing = facing;

let hb = inputs.hitboxConfig;
if (!hb && node.data && node.data.values && node.data.values.hitboxConfig) {
  hb = node.data.values.hitboxConfig;
}
if (typeof hb === 'string') {
  try { hb = JSON.parse(hb); } catch (e) { hb = null; }
}
const hitbox = (hb && typeof hb === 'object') ? hb : { offsetX: 30, offsetY: 0, width: 36, height: 32 };

const attackClipName = String(inputs.attackClip || (node.data && node.data.values && node.data.values.attackClip) || 'attack').trim();
const attackCooldown = Number(inputs.attackCooldown ?? 1.5);
const startFrame = Number(inputs.startFrame ?? 1);
const endFrame = Number(inputs.endFrame ?? 3);
const damage = Number(inputs.damage ?? 10);
const knockbackX = Number(inputs.knockbackX ?? 180);
const knockbackY = Number(inputs.knockbackY ?? -60);
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
  state.isAttacking = true;
  state.hasTriggeredHitboxActive = false;
  state.hitEntitiesThisAttack = [];

  if (animator && attackClipName) {
    const rawClips = animator.clips;
    const clipObj = findClip(rawClips, attackClipName);
    const resolvedId = clipObj ? clipObj.id : attackClipName;
    animator.currentClip = resolvedId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (clipObj) clipObj.frameIndex = 0;
    state.activeClipId = resolvedId;
  }

  outputs.onAttackStart = true;
}

const canAttack = !state.isAttacking && state.cooldownTimer <= 0;
const isExplicitTrigger = Boolean(inputs.triggerAttack === true);
const isInRange = Boolean(target._ai && target._ai.inAttackRange);

if (canAttack && (isExplicitTrigger || (autoTriggerInRange && isInRange))) {
  startAttack();
}

if (state.isAttacking) {
  const activeClipId = animator ? (animator.currentClip || state.activeClipId) : state.activeClipId;
  const rawClips = animator ? animator.clips : [];
  const clipObj = findClip(rawClips, activeClipId);

  const currentFrame = (clipObj && typeof clipObj.frameIndex === 'number') ? clipObj.frameIndex : 0;
  const totalFrames = (clipObj && Array.isArray(clipObj.frames)) ? clipObj.frames.length : 1;
  const isAnimFinished = animator ? (!animator.isPlaying || currentFrame >= totalFrames - 1) : false;

  const isHitboxFrame = (currentFrame >= startFrame && currentFrame <= endFrame);
  const colScriptId = hitbox?.colliderScriptId || (node.data && node.data.values && node.data.values.colliderScriptId);

  if (isHitboxFrame) {
    if (!state.hasTriggeredHitboxActive) {
      outputs.onHitboxActive = true;
      state.hasTriggeredHitboxActive = true;
    }

    if (colScriptId && context.collider?.setShapeEnabled) {
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
        let hbW = 36, hbH = 32, hbOffX = 30, hbOffY = 0;
        if (colScriptId && target.components?.Collider?.data) {
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
          hbOffX = Number(hitbox.offsetX ?? 30);
          hbOffY = Number(hitbox.offsetY ?? 0);
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
          if (state.hitEntitiesThisAttack.includes(player.id)) continue;

          let overlaps = false;
          const playerCollider = player.components?.Collider;
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
              const pW = (pT.width || 32) * Math.abs(pT.scaleX ?? 1);
              const pH = (pT.height || 32) * Math.abs(pT.scaleY ?? 1);
              const pPivotX = pT.pivotX ?? 0.5;
              const pPivotY = pT.pivotY ?? 0.5;
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
      if (!player || state.hitEntitiesThisAttack.includes(player.id)) continue;
      state.hitEntitiesThisAttack.push(player.id);

      if (player.components && player.components.Health) {
        player.components.Health.current = Math.max(0, (player.components.Health.current ?? 100) - damage);
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
    if (colScriptId && context.collider?.setShapeEnabled) {
      context.collider.setShapeEnabled(target, colScriptId, false);
    }
  }

  if (isAnimFinished) {
    if (colScriptId && context.collider?.setShapeEnabled) {
      context.collider.setShapeEnabled(target, colScriptId, false);
    }
    state.isAttacking = false;
    state.cooldownTimer = attackCooldown;
    outputs.onAttackEnd = true;
  }
}

outputs.execOut = true;
outputs.isAttacking = state.isAttacking;
outputs.isCoolingDown = state.cooldownTimer > 0;
outputs.cooldownRemaining = state.cooldownTimer;
outputs.currentClip = animator ? (animator.currentClip || state.activeClipId || '') : (state.activeClipId || '');
if (!outputs.damageDealt) outputs.damageDealt = damage;
if (!outputs.hitPlayer) outputs.hitPlayer = '';

return;`
        }
      }
    }
  ]
};

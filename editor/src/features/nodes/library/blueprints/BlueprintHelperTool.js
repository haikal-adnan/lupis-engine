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
      description: 'Mengatur slider modular berbasis nilai bebas (misal 0-160), mendukung bar shape/sprite, knob independen atau child, serta pembulatan step.',
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
          { id: 'isInteractive', dataType: 'boolean', color: '#81C784' }
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
            isInteractive: true
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

function updateVisual(val) {
  const f = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
  const baseW = context.state.baseW;
  const pivotX = context.state.pivotX;
  const baseX = context.state.baseX;
  const w = Math.max(0, baseW * f);

  tBar.width = w;
  tBar.x = baseX - (pivotX * baseW * (1 - f));

  if (barEnt.components && barEnt.components.ShapeRenderer) {
    barEnt.components.ShapeRenderer.width = w;
  }
  if (barEnt.components && barEnt.components.SpriteRenderer) {
    barEnt.components.SpriteRenderer.sourceX = context.state.baseSX;
    barEnt.components.SpriteRenderer.sourceWidth = Math.max(0, context.state.baseSW * f);
  }

  const tHandler = handlerEnt && handlerEnt.components ? (handlerEnt.components.UITransform || handlerEnt.components.Transform) : false;
  if (tHandler) {
    if (context.state.isChild) {
      tHandler.x = (baseX - (pivotX * baseW) + (f * baseW)) - tBar.x;
    } else {
      const localLeft = baseX - (pivotX * baseW);
      tHandler.x = localLeft + (f * baseW);
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
    const computedVal = minVal + (fill * (maxVal - minVal));
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
    }
  ]
};

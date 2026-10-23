import { Film } from 'lucide-vue-next';

export const BlueprintAnimation = {
  id: 'game_animation',
  label: 'Animation',
  color: '#E91E63',
  icon: Film,
  items: [
{
      type: 'logicTweenValue',
      label: 'Tween Value',
      description: 'Generates interpolated numeric values over time with a single execution trigger.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Tween Value',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'startValue', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'endValue', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 1.0 }
        ],
        outputs: [
          { id: 'onUpdate', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', dataType: 'number', color: '#64B5F6' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            startValue: 0,
            endValue: 100,
            duration: 1.0,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' }
            ]
          },
          code: 
`const start = Number(inputs.startValue) || 0;
const end = Number(inputs.endValue) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

if (duration <= 0) {
  outputs.value = end;
  outputs.onUpdate = true;
  outputs.onComplete = true;
  context.triggerFlow('onUpdate');
  context.triggerFlow('onComplete');
  return;
}

context.state.start = start;
context.state.end = end;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  outputs.value = context.state.start + (context.state.end - context.state.start) * factor;
  outputs.onUpdate = true;
  context.triggerFlow('onUpdate');

  if (progress >= 1.0) {
    context.state.isActive = false;
    outputs.value = context.state.end;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.value = start;
outputs.onUpdate = false;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenMoveTo',
      label: 'Move To',
      description: 'Animates entity position towards target coordinates over a duration.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Move To',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'x', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 1.0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            x: 0,
            y: 0,
            duration: 1.0,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' },
              { label: 'Ease Out Bounce', value: 'ease_out_bounce' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const targetX = Number(inputs.x) || 0;
const targetY = Number(inputs.y) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.x = targetX;
  t.y = targetY;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startX = t.x;
context.state.startY = t.y;
context.state.targetX = targetX;
context.state.targetY = targetY;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.x = context.state.startX + (context.state.targetX - context.state.startX) * factor;
  t.y = context.state.startY + (context.state.targetY - context.state.startY) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.x = context.state.targetX;
    t.y = context.state.targetY;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenScaleTo',
      label: 'Scale To',
      description: 'Animates entity scale towards target values over a duration.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Scale To',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'scaleX', dataType: 'number', color: '#64B5F6', defaultValue: 1.0 },
          { id: 'scaleY', dataType: 'number', color: '#64B5F6', defaultValue: 1.0 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 0.5,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' },
              { label: 'Ease Out Bounce', value: 'ease_out_bounce' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const targetScaleX = Number(inputs.scaleX) || 1;
const targetScaleY = Number(inputs.scaleY) || 1;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.scaleX = targetScaleX;
  t.scaleY = targetScaleY;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startScaleX = typeof t.scaleX === 'number' ? t.scaleX : 1;
context.state.startScaleY = typeof t.scaleY === 'number' ? t.scaleY : 1;
context.state.targetScaleX = targetScaleX;
context.state.targetScaleY = targetScaleY;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.scaleX = context.state.startScaleX + (context.state.targetScaleX - context.state.startScaleX) * factor;
  t.scaleY = context.state.startScaleY + (context.state.targetScaleY - context.state.startScaleY) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.scaleX = context.state.targetScaleX;
    t.scaleY = context.state.targetScaleY;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenRotateTo',
      label: 'Rotate To',
      description: 'Animates entity rotation (degrees) towards target angle over a duration.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Rotate To',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'rotation', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            rotation: 0,
            duration: 0.5,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' },
              { label: 'Ease Out Bounce', value: 'ease_out_bounce' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const targetRotation = Number(inputs.rotation) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.rotation = targetRotation;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startRotation = typeof t.rotation === 'number' ? t.rotation : 0;
context.state.targetRotation = targetRotation;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.rotation = context.state.startRotation + (context.state.targetRotation - context.state.startRotation) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.rotation = context.state.targetRotation;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenResizeTo',
      label: 'Resize To',
      description: 'Animates entity width and height towards target size over a duration.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Resize To',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'width', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'height', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            width: 100,
            height: 100,
            duration: 0.5,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' },
              { label: 'Ease Out Bounce', value: 'ease_out_bounce' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const targetWidth = Number(inputs.width) || 0;
const targetHeight = Number(inputs.height) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0) {
  t.width = targetWidth;
  t.height = targetHeight;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startWidth = typeof t.width === 'number' ? t.width : 0;
context.state.startHeight = typeof t.height === 'number' ? t.height : 0;
context.state.targetWidth = targetWidth;
context.state.targetHeight = targetHeight;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  if (type === 'ease_out_bounce') {
    const n1 = 7.5625, d1 = 2.75;
    let s = p;
    if (s < 1 / d1) return n1 * s * s;
    if (s < 2 / d1) return n1 * (s -= 1.5 / d1) * s + 0.75;
    if (s < 2.5 / d1) return n1 * (s -= 2.25 / d1) * s + 0.9375;
    return n1 * (s -= 2.625 / d1) * s + 0.984375;
  }
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  t.width = context.state.startWidth + (context.state.targetWidth - context.state.startWidth) * factor;
  t.height = context.state.startHeight + (context.state.targetHeight - context.state.startHeight) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.width = context.state.targetWidth;
    t.height = context.state.targetHeight;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenFadeTo',
      label: 'Fade To',
      description: 'Animates opacity (0.0 - 1.0) for SpriteRenderer, ShapeRenderer, and TextRenderer over a duration.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Fade To',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'opacity', dataType: 'number', color: '#64B5F6', defaultValue: 1.0 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            opacity: 1.0,
            duration: 0.5,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const targetOpacity = Math.max(0, Math.min(1, Number(inputs.opacity) || 0));
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'smooth';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');

const comps = [];
if ((entity.components && entity.components.SpriteRenderer)) comps.push(entity.components.SpriteRenderer);
if ((entity.components && entity.components.ShapeRenderer)) comps.push(entity.components.ShapeRenderer);
if ((entity.components && entity.components.TextRenderer)) comps.push(entity.components.TextRenderer);

context.assert.isTrue(comps.length > 0, 'Target entity must have SpriteRenderer, ShapeRenderer, or TextRenderer');

const initialOpacity = typeof comps[0].opacity === 'number' ? comps[0].opacity : 1;

if (duration <= 0) {
  for (let i = 0; i < comps.length; i++) {
    comps[i].opacity = targetOpacity;
  }
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startOpacity = initialOpacity;
context.state.targetOpacity = targetOpacity;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);
  const currentOpacity = context.state.startOpacity + (context.state.targetOpacity - context.state.startOpacity) * factor;

  for (let i = 0; i < comps.length; i++) {
    comps[i].opacity = currentOpacity;
  }

  if (progress >= 1.0) {
    context.state.isActive = false;
    for (let i = 0; i < comps.length; i++) {
      comps[i].opacity = context.state.targetOpacity;
    }
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenCropTo',
      label: 'Crop Image',
      description: 'Animates sprite source rect (sourceX, sourceY, sourceWidth, sourceHeight) over a duration.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Crop Image',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'sourceX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'sourceY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'sourceWidth', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'sourceHeight', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            sourceX: 0,
            sourceY: 0,
            sourceWidth: 100,
            sourceHeight: 100,
            duration: 0.5,
            easing: 'linear'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Ease In', value: 'ease_in' },
              { label: 'Ease Out', value: 'ease_out' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const targetSX = Number(inputs.sourceX) || 0;
const targetSY = Number(inputs.sourceY) || 0;
const targetSW = Number(inputs.sourceWidth) || 0;
const targetSH = Number(inputs.sourceHeight) || 0;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'linear';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const comp = context.assert.hasComponent(entity, 'SpriteRenderer');

if (duration <= 0) {
  comp.sourceX = targetSX;
  comp.sourceY = targetSY;
  comp.sourceWidth = targetSW;
  comp.sourceHeight = targetSH;
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startSX = typeof comp.sourceX === 'number' ? comp.sourceX : 0;
context.state.startSY = typeof comp.sourceY === 'number' ? comp.sourceY : 0;
context.state.startSW = typeof comp.sourceWidth === 'number' ? comp.sourceWidth : 0;
context.state.startSH = typeof comp.sourceHeight === 'number' ? comp.sourceHeight : 0;
context.state.targetSX = targetSX;
context.state.targetSY = targetSY;
context.state.targetSW = targetSW;
context.state.targetSH = targetSH;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  if (type === 'ease_in') return p * p;
  if (type === 'ease_out') return p * (2 - p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);

  comp.sourceX = context.state.startSX + (context.state.targetSX - context.state.startSX) * factor;
  comp.sourceY = context.state.startSY + (context.state.targetSY - context.state.startSY) * factor;
  comp.sourceWidth = context.state.startSW + (context.state.targetSW - context.state.startSW) * factor;
  comp.sourceHeight = context.state.startSH + (context.state.targetSH - context.state.startSH) * factor;

  if (progress >= 1.0) {
    context.state.isActive = false;
    comp.sourceX = context.state.targetSX;
    comp.sourceY = context.state.targetSY;
    comp.sourceWidth = context.state.targetSW;
    comp.sourceHeight = context.state.targetSH;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'tweenFillAmount',
      label: 'Fill Amount',
      description: 'Sets or animates fill percentage (0 to 100%) with 4-directional wipe (Left to Right, Right to Left, Top to Bottom, Bottom to Top). Set duration to 0 for instant fill.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Fill Amount',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'fill', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'direction', dataType: 'string', color: '#F48FB1', defaultValue: 'left_to_right' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            fill: 100,
            direction: 'left_to_right',
            duration: 0,
            easing: 'linear'
          },
          options: {
            direction: [
              { label: 'Left to Right', value: 'left_to_right' },
              { label: 'Right to Left', value: 'right_to_left' },
              { label: 'Top to Bottom', value: 'top_to_bottom' },
              { label: 'Bottom to Top', value: 'bottom_to_top' }
            ],
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' }
            ]
          },
          code: 
`const targetId = inputs.targetEntity;
const rawFill = Number(inputs.fill);
const targetPercent = isNaN(rawFill) ? 100 : Math.max(0, Math.min(100, rawFill));
const targetFill = targetPercent / 100;
let dir = inputs.direction || 'left_to_right';
if (dir === 'horizontal') dir = 'left_to_right';
if (dir === 'vertical') dir = 'bottom_to_top';

const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0 : Math.max(0, rawDuration);
const easing = (node.data && node.data.values && node.data.values.easing) ? node.data.values.easing : 'linear';

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = (entity.components && entity.components.UITransform) || (entity.components && entity.components.Transform);
context.assert.exists(t, 'Target entity must have Transform or UITransform component');

const sprite = (entity.components && entity.components.SpriteRenderer) || false;
const shape = (entity.components && entity.components.ShapeRenderer) || false;

if (typeof context.state.baseW !== 'number') {
  context.state.baseX = typeof t.x === 'number' ? t.x : 0;
  context.state.baseY = typeof t.y === 'number' ? t.y : 0;
  context.state.baseW = t.width || 100;
  context.state.baseH = t.height || 100;
  context.state.pivotX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
  context.state.pivotY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;

  if (sprite) {
    context.state.baseSX = typeof sprite.sourceX === 'number' ? sprite.sourceX : 0;
    context.state.baseSY = typeof sprite.sourceY === 'number' ? sprite.sourceY : 0;
    context.state.baseSW = sprite.sourceWidth || context.state.baseW;
    context.state.baseSH = sprite.sourceHeight || context.state.baseH;
  }
}

const baseW = context.state.baseW;
const baseH = context.state.baseH;
const baseX = context.state.baseX;
const baseY = context.state.baseY;
const px = context.state.pivotX;
const py = context.state.pivotY;
const baseSX = context.state.baseSX || 0;
const baseSY = context.state.baseSY || 0;
const baseSW = context.state.baseSW || baseW;
const baseSH = context.state.baseSH || baseH;

function applyFill(currentFill) {
  const f = Math.max(0, Math.min(1, currentFill));

  if (dir === 'left_to_right') {
    const w = baseW * f;
    t.width = w;
    t.x = baseX - px * baseW * (1 - f);
    if (shape) shape.width = w;
    if (sprite) {
      sprite.sourceX = baseSX;
      sprite.sourceWidth = baseSW * f;
    }
  } else if (dir === 'right_to_left') {
    const w = baseW * f;
    t.width = w;
    t.x = baseX + (1 - px) * baseW * (1 - f);
    if (shape) shape.width = w;
    if (sprite) {
      sprite.sourceX = baseSX + baseSW * (1 - f);
      sprite.sourceWidth = baseSW * f;
    }
  } else if (dir === 'bottom_to_top') {
    const h = baseH * f;
    t.height = h;
    t.y = baseY + (1 - py) * baseH * (1 - f);
    if (shape) shape.height = h;
    if (sprite) {
      sprite.sourceY = baseSY + baseSH * (1 - f);
      sprite.sourceHeight = baseSH * f;
    }
  } else if (dir === 'top_to_bottom') {
    const h = baseH * f;
    t.height = h;
    t.y = baseY - py * baseH * (1 - f);
    if (shape) shape.height = h;
    if (sprite) {
      sprite.sourceY = baseSY;
      sprite.sourceHeight = baseSH * f;
    }
  }
}

const currentFill = (dir === 'left_to_right' || dir === 'right_to_left')
  ? (baseW > 0 ? (t.width / baseW) : 1)
  : (baseH > 0 ? (t.height / baseH) : 1);

if (duration <= 0) {
  applyFill(targetFill);
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.startFill = currentFill;
context.state.targetFill = targetFill;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

function easeFactor(type, p) {
  if (type === 'smooth') return p * p * (3 - 2 * p);
  return p;
}

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const factor = easeFactor(easing, progress);
  const fillNow = context.state.startFill + (context.state.targetFill - context.state.startFill) * factor;

  applyFill(fillNow);

  if (progress >= 1.0) {
    context.state.isActive = false;
    applyFill(context.state.targetFill);
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'actionShakeTransform',
      label: 'Shake Transform',
      description: 'Procedural shake effect with decay, perfect for impacts, explosions, or UI feedback.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Shake Transform',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'intensity', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            intensity: 10,
            duration: 0.5
          },
          code: 
`const targetId = inputs.targetEntity;
const intensity = Number(inputs.intensity) || 10;
const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);

const entity = context.assert.exists(context.entity.get(targetId), 'Target entity must exist');
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

if (duration <= 0 || intensity <= 0) {
  outputs.execOut = true;
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
  return;
}

context.state.baseX = typeof context.state.baseX === 'number' ? context.state.baseX : t.x;
context.state.baseY = typeof context.state.baseY === 'number' ? context.state.baseY : t.y;
context.state.intensity = intensity;
context.state.duration = duration;
context.state.elapsed = 0;
context.state.isActive = true;

context.onTick((dt) => {
  if (!context.state.isActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.elapsed += deltaSec;

  const progress = Math.min(context.state.elapsed / context.state.duration, 1.0);
  const currentIntensity = context.state.intensity * (1.0 - progress);

  const offsetX = (Math.random() * 2 - 1) * currentIntensity;
  const offsetY = (Math.random() * 2 - 1) * currentIntensity;

  t.x = context.state.baseX + offsetX;
  t.y = context.state.baseY + offsetY;

  if (progress >= 1.0) {
    context.state.isActive = false;
    t.x = context.state.baseX;
    t.y = context.state.baseY;
    delete context.state.baseX;
    delete context.state.baseY;
    outputs.onComplete = true;
    context.triggerFlow('onComplete');
  }
});

outputs.execOut = true;
outputs.onComplete = false;
return;`
        }
      }
    },
{
      type: 'uiButtonScaleEffect',
      label: 'Button Scale Effect',
      description: 'Handles button hover, click, and scale interpolation (Lerp) automatically within a single node.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Button Scale',
          headerColor: '#E91E63',
          category: 'Animation & Tweens'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'useRaycast', dataType: 'boolean', color: '#E57373', defaultValue: true },
          { id: 'scaleNormal', dataType: 'number', color: '#64B5F6', defaultValue: 1.0 },
          { id: 'scaleHover', dataType: 'number', color: '#64B5F6', defaultValue: 1.1 },
          { id: 'scalePressed', dataType: 'number', color: '#64B5F6', defaultValue: 0.9 },
          { id: 'lerpSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 0.2 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onClick', dataType: 'execution', color: '#FFFFFF' },
          { id: 'selfEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            scaleNormal: 1.0,
            scaleHover: 1.1,
            scalePressed: 0.9,
            lerpSpeed: 0.2,
            useRaycast: true
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const t = entity.components.UITransform || entity.components.Transform;
context.assert.exists(t, 'Entity must have UITransform or Transform component');

if (!context.state.wasDownMap) context.state.wasDownMap = new Map();
if (!context.state.scaleMap) context.state.scaleMap = new Map();

let currentScale = context.state.scaleMap.get(entity.scriptId) || t.scaleX || inputs.scaleNormal;
let wasDown = context.state.wasDownMap.get(entity.scriptId) || false;

outputs.selfEntity = entity.scriptId;
outputs.execOut = true;

const pointer = context.input.getPointer(entity) || context.input.getPointer();
const isLayerFrozen = Boolean(entity.layerId && context.layer && typeof context.layer.isInputFrozen === 'function' && context.layer.isInputFrozen(entity.layerId, 'pointer'));
const isFrozen = !pointer || isLayerFrozen;

if (isFrozen) {
  currentScale += (inputs.scaleNormal - currentScale) * inputs.lerpSpeed;
  t.scaleX = currentScale;
  t.scaleY = currentScale;
  context.state.scaleMap.set(entity.scriptId, currentScale);
  context.state.wasDownMap.set(entity.scriptId, false);
  return;
}

const isHovering = Boolean(context.input.isPointerOver(entity, inputs.useRaycast));
const isPointerDown = pointer ? Boolean(pointer.down) : false;

let targetScale = inputs.scaleNormal;
if (isHovering) {
  targetScale = isPointerDown ? inputs.scalePressed : inputs.scaleHover;
}

currentScale += (targetScale - currentScale) * inputs.lerpSpeed;
t.scaleX = currentScale;
t.scaleY = currentScale;

context.state.scaleMap.set(entity.scriptId, currentScale);

let clicked = false;
if (isHovering && !isPointerDown && wasDown) {
  clicked = true;
}

context.state.wasDownMap.set(entity.scriptId, isPointerDown);

if (clicked) {
  outputs.onClick = true;
}
return;`
        }
      }
    },
{
      type: 'playAnimation',
      label: 'Play Animation',
      description: 'Plays the animation. Use On Complete for logic execution after the animation finishes.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Play Animation', headerColor: '#8E24AA', category: 'Animation & Tweens' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'clipId', dataType: 'string', color: '#F48FB1' },
          { id: 'reset', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onStart', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            clipId: '',
            reset: true
          },
          code: 
`const targetId = inputs.targetEntity;
const clipIdInput = inputs.clipId;
const reset = inputs.reset;
const entity = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(entity, 'SpriteAnimator');
const targetStr = clipIdInput;

const rawClips = animator.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
const targetClip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

animator.currentClip = targetClip ? targetClip.id : targetStr;
animator.isPlaying = true;

if (reset !== false) {
  animator._activeClipId = null;
  if (targetClip) {
    targetClip.frameIndex = 0;
  }
}

animator._onCompleteCallback = () => {
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
};

outputs.execOut = true;
outputs.onStart = true;
return;`
        }
      }
    },
{
      type: 'pauseAnimation',
      label: 'Pause Animation',
      description: 'Temporarily pauses the animation at the current frame.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Pause Animation', headerColor: '#8E24AA', category: 'Animation & Tweens' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(entity, 'SpriteAnimator');

animator.isPlaying = false;

outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getAnimator',
      label: 'Get Animator',
      description: 'Mendapatkan properti animator dari entity target.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: { headerTitle: 'Get Animator', headerColor: '#8E24AA', category: 'Animation & Tweens' },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'currentClip', label: 'Current Clip ID', type: 'string', color: '#F48FB1' },
            { value: 'isPlaying', label: 'Is Playing?', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Is Enabled?', type: 'boolean', color: '#E57373' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const rawClips = comp.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
const clip = clips.find(c => c.scriptId === comp.currentClip || c.id === comp.currentClip);

outputs.currentClip = comp.currentClip;
outputs.isPlaying = comp.isPlaying;
outputs.active = comp.active;
outputs.flipX = clip ? clip.flipX : false;
return;`
        }
      }
    },
{
      type: 'setAnimator',
      label: 'Set Animator',
      description: 'Mengatur properti animator pada entity target.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: { headerTitle: 'Set Animator', headerColor: '#8E24AA', category: 'Animation & Tweens' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'currentClip', label: 'Set Current Clip', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Is Enabled', type: 'boolean', color: '#E57373' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const rawClips = comp.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

if ('currentClip' in inputs) {
  const targetStr = inputs.currentClip;
  const targetClip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);
  const resolvedId = targetClip ? targetClip.id : targetStr;

  if (comp.currentClip !== resolvedId) {
    comp.currentClip = resolvedId;
    comp._elapsedTime = 0;
    comp.isPlaying = true;
    if (targetClip) targetClip.frameIndex = 0;
  }
}

if ('active' in inputs) {
  comp.active = inputs.active;
}

if ('flipX' in inputs) {
  const clip = clips.find(c => c.scriptId === comp.currentClip || c.id === comp.currentClip);
  if (clip) clip.flipX = inputs.flipX;
}

outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getClipProp',
      label: 'Get Clip Prop',
      description: 'Mendapatkan properti spesifik dari animasi clip.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: { headerTitle: 'Get Clip Property', headerColor: '#8E24AA', category: 'Animation & Tweens' },
        inputs: [
          { id: 'clipId', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [],
        data: {
          values: {
            clipId: ''
          },
          propertyOptions: [
            { value: 'fps', label: 'Frame Rate', type: 'number', color: '#64B5F6' },
            { value: 'isLooping', label: 'Is Looping?', type: 'boolean', color: '#E57373' },
            { value: 'frameCount', label: 'Total Frames', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const clipIdInput = inputs.clipId;
const entity = context.assert.exists(context.owner);
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const targetStr = clipIdInput;
const clip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

if (clip) {
  outputs.fps = clip.fps;
  outputs.isLooping = clip.isLooping;
  outputs.frameCount = clip.frames ? clip.frames.length : 0;
}
return;`
        }
      }
    },
{
      type: 'setClipProp',
      label: 'Set Clip Prop',
      description: 'Mengatur properti spesifik dari animasi clip.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: { headerTitle: 'Set Clip Property', headerColor: '#8E24AA', category: 'Animation & Tweens' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'clipId', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            clipId: ''
          },
          propertyOptions: [
            { value: 'fps', label: 'Set FPS', type: 'number', color: '#64B5F6' },
            { value: 'isLooping', label: 'Set Looping', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const clipIdInput = inputs.clipId;
const entity = context.assert.exists(context.owner);
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const targetStr = clipIdInput;
const clip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

if (clip) {
  if ('fps' in inputs) clip.fps = inputs.fps;
  if ('isLooping' in inputs) clip.isLooping = inputs.isLooping;
}

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'onAnimationFrame',
      label: 'On Animation Frame',
      description: 'Fires execution triggers when an animation clip enters, stays active in, or exits a specific frame range.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Animation Frame',
          headerColor: '#AB47BC',
          category: 'Animation & Tween'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'clipId', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'frameIndex', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'endFrame', dataType: 'number', color: '#64B5F6' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onFrameEnter', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onFrameActive', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onFrameExit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'currentFrame', dataType: 'number', color: '#64B5F6' },
          { id: 'isActive', dataType: 'boolean', color: '#81C784' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            clipId: '',
            frameIndex: 1
          },
          code:
`const targetId = inputs.targetEntity || 'self';
let entity = false;
if (context.entity && typeof context.entity.get === 'function') {
  entity = context.entity.get(targetId);
}
if (!entity && context.owner && (targetId === 'self' || targetId === '')) {
  entity = context.owner;
}
if (!entity) {
  outputs.execOut = true;
  outputs.isActive = false;
  outputs.currentFrame = 0;
  return;
}

const anim = entity.components && entity.components.SpriteAnimator;
if (!anim) {
  outputs.execOut = true;
  outputs.isActive = false;
  outputs.currentFrame = 0;
  return;
}

const rawClips = anim.clips;
const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
const currentClipId = anim.currentClip;
let activeClip = false;
for (let i = 0; i < clips.length; i++) {
  const c = clips[i];
  if (c.id === currentClipId || c.scriptId === currentClipId || c.name === currentClipId) {
    activeClip = c;
    break;
  }
}

const curFrame = (activeClip && typeof activeClip.frameIndex === 'number') ? activeClip.frameIndex : 0;
outputs.currentFrame = curFrame;

let clipMatches = true;
const targetClip = String(inputs.clipId || '').trim();
if (targetClip) {
  clipMatches = Boolean(
    activeClip && (
      activeClip.id === targetClip ||
      activeClip.scriptId === targetClip ||
      activeClip.name === targetClip
    )
  );
}

const startFrame = Number(inputs.frameIndex) || 0;
const rawEnd = Number(inputs.endFrame);
const endFrame = isNaN(rawEnd) ? startFrame : rawEnd;

const isWithinRange = Boolean(clipMatches && curFrame >= startFrame && curFrame <= endFrame);
outputs.isActive = isWithinRange;

const stateKey = '_animFrame_' + (entity.id || targetId);
const prevState = Boolean(context.state[stateKey]);
context.state[stateKey] = isWithinRange;

if (isWithinRange && !prevState) {
  outputs.onFrameEnter = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFrameEnter');
}
if (isWithinRange) {
  outputs.onFrameActive = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFrameActive');
}
if (!isWithinRange && prevState) {
  outputs.onFrameExit = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onFrameExit');
}

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};

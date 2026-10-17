import { GitMerge } from 'lucide-vue-next';

export const BlueprintHelper = {
  id: 'category_flow_helpers',
  label: 'Flow Helpers',
  color: '#607D8B',
  icon: GitMerge,
  items: [
    {
      type: 'logicFlowMerge',
      label: 'Flow Merge',
      description: 'Merges multiple execution streams into a single output.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: {
          headerTitle: 'Flow Merge',
          headerColor: '#607D8B',
          category: 'Flow Helpers'
        },
        inputs: [
          { id: 'v0', dataType: 'execution', color: '#FFFFFF' },
          { id: 'v1', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {},
          code: 
`outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'logicDelay',
      label: 'Delay',
      description: 'Delays execution for a specified duration in milliseconds.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Delay',
          headerColor: '#607D8B',
          category: 'Flow Helpers'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 500 }
        ],
        outputs: [
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { duration: 500 },
          code: 
`const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 500 : Math.max(0, rawDuration);

if (duration <= 0) {
  outputs.completed = true;
  context.triggerFlow('completed');
  return;
}

context.state.delayRemaining = duration;
context.state.isDelayActive = true;

context.onTick((dt) => {
  if (!context.state.isDelayActive) return;
  const deltaMs = (typeof dt === 'number' ? dt : context.dt) * 1000;
  context.state.delayRemaining -= deltaMs;

  if (context.state.delayRemaining <= 0) {
    context.state.isDelayActive = false;
    outputs.completed = true;
    context.triggerFlow('completed');
  }
});
return;`
        }
      }
    },
    {
      type: 'logicCooldown',
      label: 'Cooldown / Interval',
      description: 'Passes execution only if the cooldown duration (ms) has been reached.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Cooldown',
          headerColor: '#607D8B',
          category: 'Flow Helpers'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 500 }
        ],
        outputs: [
          { id: 'onReady', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onCooling', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { duration: 500 },
          code: 
`const rawDuration = Number(inputs.duration);
const targetDuration = isNaN(rawDuration) ? 500 : Math.max(0, rawDuration);
const currentTime = Date.now();

const lastTime = typeof context.state.lastExecuteTime === 'number' ? context.state.lastExecuteTime : 0;
const elapsed = currentTime - lastTime;

if (elapsed >= targetDuration) {
  context.state.lastExecuteTime = currentTime;
  outputs.onReady = true;
  outputs.onCooling = false;
  context.triggerFlow('onReady');
} else {
  outputs.onReady = false;
  outputs.onCooling = true;
  context.triggerFlow('onCooling');
}
return;`
        }
      }
    },
    {
      type: 'logicTweenValue',
      label: 'Tween Value',
      description: 'Generates interpolated values over time.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Tween Value',
          headerColor: '#EC4899',
          category: 'Flow Helpers'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'startValue', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'endValue', dataType: 'number', color: '#64B5F6', defaultValue: 100 },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 1000 }
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
            duration: 1000,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Accelerate (Ease In)', value: 'ease_in' }
            ]
          },
          code: 
`const start = inputs.startValue;
const end = inputs.endValue;
const duration = inputs.duration;
const easing = node.data.values.easing || 'smooth';

context.state.tweenElapsed = context.state.tweenElapsed || 0;

const dt = context.dt * 1000;
context.state.tweenElapsed += dt;

let progress = duration > 0 ? Math.min(context.state.tweenElapsed / duration, 1.0) : 1.0;
let t = progress;

if (easing === 'smooth') t = progress * progress * (3 - 2 * progress);
if (easing === 'ease_in') t = progress * progress;

context.state.currentValue = start + (end - start) * t;

outputs.value = context.state.currentValue;
outputs.onUpdate = true;

if (progress >= 1.0) {
  context.state.tweenElapsed = 0;
  outputs.onComplete = true;
}
return;`
        }
      }
    },
    {
      type: 'logicTypewriter',
      label: 'Typewriter Effect',
      description: 'Animates text character by character.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Typewriter',
          headerColor: '#FFB300',
          category: 'Flow Helpers'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'text', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 50 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isTyping', dataType: 'boolean', color: '#E57373' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { speed: 50, targetEntity: 'self', text: '' },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const comp = context.assert.hasComponent(entity, 'TextRenderer');

const speed = Math.max(1, Number(inputs.speed) || 50);
const inputText = inputs.text;

if (!context.state.isTyping) {
  context.state.isTyping = true;
  context.state.cachedTarget = inputText !== '' ? inputText : comp.value;
  context.state.typewriterIndex = 0;
  context.state.typewriterTimer = 0;
  comp.value = '';
}

const dt = context.dt * 1000;
context.state.typewriterTimer += dt;

while (context.state.typewriterTimer >= speed && context.state.typewriterIndex < context.state.cachedTarget.length) {
  context.state.typewriterTimer -= speed;
  context.state.typewriterIndex++;
}

comp.value = context.state.cachedTarget.slice(0, context.state.typewriterIndex);

if (context.state.typewriterIndex >= context.state.cachedTarget.length) {
  context.state.isTyping = false;
  context.state.typewriterTimer = 0;
  outputs.isTyping = false;
  outputs.onComplete = true;
} else {
  outputs.isTyping = true;
  outputs.execOut = true;
}
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
          category: 'Flow Helpers'
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

const isHovering = context.input.isPointerOver(entity, inputs.useRaycast);
const isPointerDown = context.input.getPointer().down;

if (!context.state.wasDownMap) context.state.wasDownMap = new Map();
if (!context.state.scaleMap) context.state.scaleMap = new Map();

let currentScale = context.state.scaleMap.get(entity.scriptId) || t.scaleX || inputs.scaleNormal;
let wasDown = context.state.wasDownMap.get(entity.scriptId) || false;

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

outputs.execOut = true;

if (clicked) {
  outputs.selfEntity = entity.scriptId;
  outputs.onClick = true;
}
return;`
        }
      }
    }
  ]
};
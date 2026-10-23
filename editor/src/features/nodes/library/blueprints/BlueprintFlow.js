import { GitBranch } from 'lucide-vue-next';

export const BlueprintFlow = {
  id: 'flow_logic',
  label: 'Flow & Logic',
  color: '#3F51B5',
  icon: GitBranch,
  items: [
{
      type: 'logicBranch',
      label: 'Branch (If/Else)',
      description: 'Splits the execution path based on a boolean condition.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Branch',
          headerColor: '#3F51B5',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'condition', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'onTrue', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onFalse', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            condition: false
          },
          branches: [],
          code: 
`const condition = Boolean(inputs.condition);
outputs.onTrue = condition;
outputs.onFalse = !condition;
return;`
        }
      }
    },
{
      type: 'logicSwitch',
      label: 'Switch',
      description: 'Directs execution to a specific path based on the data type and its value.',
      dynamicMode: 'switch',
      defaultData: {
        settings: {
          headerTitle: 'Switch',
          headerColor: '#3F51B5',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'case0', dataType: 'string', color: '#F48FB1', defaultValue: 'right' },
          { id: 'case1', dataType: 'string', color: '#F48FB1', defaultValue: 'left' }
        ],
        outputs: [
          { id: 'onCase0', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onCase1', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onDefault', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            value: '',
            case0: 'right',
            case1: 'left'
          },
          dataType: 'string',
          cases: ['right', 'left'],
          code: 
`const rawValue = inputs.value;
let matched = false;

if (rawValue == inputs.case0) {
  outputs.onCase0 = true;
  matched = true;
} else if (rawValue == inputs.case1) {
  outputs.onCase1 = true;
  matched = true;
} else {
  const caseKeys = Object.keys(inputs)
    .filter(k => k.startsWith('case') && k !== 'case0' && k !== 'case1')
    .sort((a, b) => {
      const idxA = parseInt(a.replace('case', ''), 10) || 0;
      const idxB = parseInt(b.replace('case', ''), 10) || 0;
      return idxA - idxB;
    });

  for (let i = 0; i < caseKeys.length; i++) {
    const k = caseKeys[i];
    const caseVal = inputs[k];
    const caseIndex = k.replace('case', '');
    if (rawValue == caseVal) {
      outputs[\`onCase\${caseIndex}\`] = true;
      matched = true;
      break;
    }
  }
}

if (!matched) {
  outputs.onDefault = true;
}
return;`
        }
      }
    },
{
      type: 'logicCompare',
      label: 'Compare',
      description: 'Compares two values (numbers or strings) based on an operator.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Compare',
          headerColor: '#3F51B5',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'a', dataType: 'any', color: '#B0BEC5' },
          { id: 'b', dataType: 'any', color: '#B0BEC5' },
          { id: 'compare', dataType: 'string', color: '#F48FB1', defaultValue: 'equal' }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            a: 0,
            b: 0,
            compare: 'equal'
          },
          options: {
            compare: [
              { label: 'Equal (==)', value: 'equal' },
              { label: 'Not Equal (!=)', value: 'not_equal' },
              { label: 'Greater Than (>)', value: 'greater' },
              { label: 'Less Than (<)', value: 'less' },
              { label: 'Greater Than or Equal (>=)', value: 'greater_equal' },
              { label: 'Less Than or Equal (<=)', value: 'less_equal' }
            ]
          },
          code: 
`const a = inputs.a;
const b = inputs.b;
const op = inputs.compare;

let res = false;
switch (op) {
  case 'equal': res = (a == b); break;
  case 'not_equal': res = (a != b); break;
  case 'greater': res = (a > b); break;
  case 'less': res = (a < b); break;
  case 'greater_equal': res = (a >= b); break;
  case 'less_equal': res = (a <= b); break;
  default: res = false;
}

outputs.result = res;
return;`
        }
      }
    },
{
      type: 'logicAnd',
      label: 'And',
      description: 'True if all dynamic inputs are true.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: { headerTitle: 'And', headerColor: '#E57373', category: 'Flow & Logic' },
        inputs: [
          { id: 'v0', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'v1', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            v0: false,
            v1: false
          },
          code: 
`const v0 = inputs.v0;
const v1 = inputs.v1;
const values = Object.values(inputs);
outputs.result = values.length > 0 ? values.every(v => v === true) : false;
return;`
        }
      }
    },
{
      type: 'logicOr',
      label: 'Or',
      description: 'True if at least one input is true.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: { headerTitle: 'Or', headerColor: '#E57373', category: 'Flow & Logic' },
        inputs: [
          { id: 'v0', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'v1', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            v0: false,
            v1: false
          },
          code: 
`const v0 = inputs.v0;
const v1 = inputs.v1;
const values = Object.values(inputs);
outputs.result = values.some(v => v === true);
return;`
        }
      }
    },
{
      type: 'logicNot',
      label: 'Not',
      description: 'Inverts the boolean value.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Not', headerColor: '#E57373', category: 'Flow & Logic' },
        inputs: [
          { id: 'value', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            value: false
          },
          code: 
`outputs.result = !inputs.value;
return;`
        }
      }
    },
{
      type: 'logicLoop',
      label: 'For Loop',
      description: 'Repeats execution from a Start value to an End value, incrementing by the specified Step.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'For Loop',
          headerColor: '#4CAF50',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'start', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'end', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'step', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'loopBody', dataType: 'execution', color: '#FFFFFF' },
          { id: 'index', dataType: 'number', color: '#64B5F6' },
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { start: 0, end: 10, step: 1 },
          code: 
`const start = inputs.start;
const end = inputs.end;
let step = inputs.step;

if (step === 0) step = 1;

if (step > 0) {
  for (let i = start; i <= end; i += step) {
    outputs.index = i;
    outputs.loopBody = true;
  }
} else {
  for (let i = start; i >= end; i += step) {
    outputs.index = i;
    outputs.loopBody = true;
  }
}

outputs.completed = true;
return;`
        }
      }
    },
{
      type: 'logicForEach',
      label: 'For Each',
      description: 'Repeats execution for each individual item contained within the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'For Each',
          headerColor: '#4CAF50',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'loopBody', dataType: 'execution', color: '#FFFFFF' },
          { id: 'item', dataType: 'any', color: '#B0BEC5' },
          { id: 'index', dataType: 'number', color: '#64B5F6' },
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`const list = inputs.list;

for (let i = 0; i < list.length; i++) {
  outputs.item = list[i];
  outputs.index = i;
  outputs.loopBody = true;
}

outputs.completed = true;
return;`
        }
      }
    },
{
      type: 'logicWhile',
      label: 'While Loop',
      description: 'Continuously loops execution as long as the input condition remains true.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'While Loop',
          headerColor: '#4CAF50',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'condition', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'loopBody', dataType: 'execution', color: '#FFFFFF' },
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            condition: false
          },
          code: 
`let iterations = 0;
const LIMIT = 5000;
const cond = inputs.condition;

while (cond) {
  iterations++;
  if (iterations > LIMIT) {
    break;
  }
  outputs.loopBody = true;
}

outputs.completed = true;
return;`
        }
      }
    },
{
      type: 'logicFlowMerge',
      label: 'Flow Merge',
      description: 'Merges multiple execution streams into a single output.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: {
          headerTitle: 'Flow Merge',
          headerColor: '#607D8B',
          category: 'Flow & Logic'
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
      description: 'Delays execution for a specified duration in seconds.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Delay',
          headerColor: '#607D8B',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { duration: 1 },
          code: 
`const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);

if (duration <= 0) {
  outputs.completed = true;
  context.triggerFlow('completed');
  return;
}

context.state.delayRemaining = duration;
context.state.isDelayActive = true;

context.onTick((dt) => {
  if (!context.state.isDelayActive) return;
  const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
  context.state.delayRemaining -= deltaSec;

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
      description: 'Passes execution only if the cooldown duration in seconds has been reached.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Cooldown',
          headerColor: '#607D8B',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.5 }
        ],
        outputs: [
          { id: 'onReady', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onCooling', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { duration: 0.5 },
          code: 
`const rawDuration = Number(inputs.duration);
const targetDuration = isNaN(rawDuration) ? 0.5 : Math.max(0, rawDuration);
const currentTime = Date.now();

const lastTime = typeof context.state.lastExecuteTime === 'number' ? context.state.lastExecuteTime : 0;
const elapsed = (currentTime - lastTime) / 1000;

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
      type: 'logicTimer',
      label: 'Timer',
      description: 'Runs a countdown or looping timer in seconds with update progress and completion triggers.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Timer',
          headerColor: '#607D8B',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'isLooping', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'reset', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'onUpdate', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' },
          { id: 'elapsedTime', dataType: 'number', color: '#64B5F6' },
          { id: 'remainingTime', dataType: 'number', color: '#64B5F6' },
          { id: 'progress', dataType: 'number', color: '#64B5F6' },
          { id: 'isActive', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            duration: 1,
            isLooping: false,
            reset: false
          },
          code: 
`const rawDuration = Number(inputs.duration);
const duration = isNaN(rawDuration) ? 1 : Math.max(0, rawDuration);
const isLooping = Boolean(inputs.isLooping);
const isReset = Boolean(inputs.reset);

if (isReset) {
  context.state.isActive = false;
  context.state.elapsedTime = 0;
  outputs.elapsedTime = 0;
  outputs.remainingTime = duration;
  outputs.progress = 0;
  outputs.isActive = false;
  outputs.onUpdate = false;
  outputs.onComplete = false;
  return;
}

if (duration <= 0) {
  outputs.elapsedTime = 0;
  outputs.remainingTime = 0;
  outputs.progress = 1;
  outputs.isActive = false;
  outputs.onUpdate = false;
  outputs.onComplete = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');
  return;
}

context.state.duration = duration;
context.state.isLooping = isLooping;
context.state.elapsedTime = 0;
context.state.isActive = true;

outputs.elapsedTime = 0;
outputs.remainingTime = duration;
outputs.progress = 0;
outputs.isActive = true;
outputs.onUpdate = false;
outputs.onComplete = false;

if (typeof context.onTick === 'function') {
  context.onTick((dt) => {
    if (!context.state.isActive) return;

    const deltaSec = typeof dt === 'number' ? dt : Number(context.dt || 0.016);
    context.state.elapsedTime += deltaSec;

    const targetDuration = context.state.duration;
    const isFinished = context.state.elapsedTime >= targetDuration;

    let currentElapsed = context.state.elapsedTime;
    if (isFinished && !context.state.isLooping) {
      currentElapsed = targetDuration;
    }

    const clampedElapsed = Math.min(currentElapsed, targetDuration);
    const remaining = Math.max(0, targetDuration - clampedElapsed);
    const ratio = targetDuration > 0 ? Math.min(1, clampedElapsed / targetDuration) : 1;

    outputs.elapsedTime = clampedElapsed;
    outputs.remainingTime = remaining;
    outputs.progress = ratio;
    outputs.isActive = context.state.isActive;

    outputs.onUpdate = true;
    if (typeof context.triggerFlow === 'function') context.triggerFlow('onUpdate');

    if (isFinished) {
      outputs.onComplete = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');

      if (context.state.isLooping) {
        context.state.elapsedTime = context.state.elapsedTime % targetDuration;
      } else {
        context.state.isActive = false;
        outputs.isActive = false;
      }
    }
  });
}
return;`
        }
      }
    },
    {
      type: 'logicTypewriter',
      label: 'Typewriter Effect',
      description: 'Animates text character by character with skip support and character pulse triggers.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Typewriter',
          headerColor: '#FFB300',
          category: 'Flow & Logic'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'skip', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'text', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'speed', dataType: 'number', color: '#64B5F6', defaultValue: 50 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChar', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isTyping', dataType: 'boolean', color: '#E57373' },
          { id: 'currentText', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { speed: 50, targetEntity: 'self', text: '' },
          code:
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const comp = entity.components && entity.components.TextRenderer ? entity.components.TextRenderer : false;

const speed = Math.max(1, Number(inputs.speed) || 50);
const rawInput = inputs.text;
const isSkip = Boolean(inputs.skip);

if (isSkip && context.state.isTyping) {
  context.state.typewriterIndex = context.state.cachedTarget.length;
  context.state.isTyping = false;
  const fullText = context.state.cachedTarget;
  if (comp) comp.value = fullText;
  outputs.currentText = fullText;
  outputs.isTyping = false;
  outputs.onComplete = true;
  if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');
  outputs.execOut = true;
  return;
}

if (!context.state.isTyping) {
  context.state.isTyping = true;
  context.state.cachedTarget = typeof rawInput === 'string' && rawInput.length > 0 ? rawInput : (comp && comp.value ? comp.value : '');
  context.state.typewriterIndex = 0;
  context.state.typewriterTimer = 0;
  if (comp) comp.value = '';
}

function advanceStep(deltaMs) {
  context.state.typewriterTimer += deltaMs;
  let advanced = false;
  while (context.state.typewriterTimer >= speed && context.state.typewriterIndex < context.state.cachedTarget.length) {
    context.state.typewriterTimer -= speed;
    context.state.typewriterIndex++;
    advanced = true;
  }
  const cur = context.state.cachedTarget.slice(0, context.state.typewriterIndex);
  if (comp) comp.value = cur;
  outputs.currentText = cur;
  if (advanced) {
    outputs.onChar = true;
    if (typeof context.triggerFlow === 'function') context.triggerFlow('onChar');
  }
  if (context.state.typewriterIndex >= context.state.cachedTarget.length) {
    context.state.isTyping = false;
    context.state.typewriterTimer = 0;
    outputs.isTyping = false;
    outputs.onComplete = true;
    if (typeof context.triggerFlow === 'function') context.triggerFlow('onComplete');
  } else {
    outputs.isTyping = true;
    outputs.execOut = true;
  }
}

if (typeof context.onTick === 'function') {
  if (!context.state._boundTick) {
    context.state._boundTick = true;
    context.onTick((tickDt) => {
      if (!context.state.isTyping) return;
      const dMs = (typeof tickDt === 'number' ? tickDt : Number(context.dt || 0.016)) * 1000;
      advanceStep(dMs);
    });
  }
} else {
  const dMs = Number(context.dt || context.deltaTime || 0.016) * 1000;
  advanceStep(dMs);
}

outputs.currentText = context.state.cachedTarget.slice(0, context.state.typewriterIndex);
outputs.isTyping = context.state.isTyping;
return;`
        }
      }
    }
  ]
};

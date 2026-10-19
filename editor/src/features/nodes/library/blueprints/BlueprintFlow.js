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
`const branches = node.data.branches;
const cond0 = inputs.condition;

if (cond0) {
  outputs.onTrue = true;
  return;
}

for (let i = 0; i < branches.length; i++) {
  const bType = branches[i];
  if (bType === 'else_if') {
    const condVal = inputs[\`condition\${i + 1}\`];
    if (condVal) {
      outputs[\`onElseIf\${i + 1}\`] = true;
      return;
    }
  } else if (bType === 'else') {
    outputs.onElse = true;
    return;
  }
}

outputs.onFalse = true;
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

const caseKeys = Object.keys(inputs)
  .filter(k => k.startsWith('case'))
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

const nodeData = (node && node.data) || {};
const legacyCases = nodeData.cases;
if (!matched && Array.isArray(legacyCases)) {
  const matchIndex = legacyCases.indexOf(rawValue);
  if (matchIndex >= 0) {
    outputs[\`onCase\${matchIndex}\`] = true;
    matched = true;
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
`const values = Object.values(inputs);
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
`const values = Object.values(inputs);
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
      description: 'Delays execution for a specified duration in milliseconds.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Delay',
          headerColor: '#607D8B',
          category: 'Flow & Logic'
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
          category: 'Flow & Logic'
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
      type: 'logicTypewriter',
      label: 'Typewriter Effect',
      description: 'Animates text character by character.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Typewriter',
          headerColor: '#FFB300',
          category: 'Flow & Logic'
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
    }
  ]
};

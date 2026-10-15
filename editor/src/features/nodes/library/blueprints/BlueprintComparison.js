import { GitCompare } from 'lucide-vue-next';

export const BlueprintComparison = {
  id: 'category_comparison',
  label: 'Logic & Compare',
  color: '#3F51B5',
  icon: GitCompare,
  items: [
    {
      type: 'logicCompare',
      label: 'Compare',
      description: 'Compares two values (numbers or strings) based on an operator.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Compare',
          headerColor: '#3F51B5',
          category: 'Logic & Compare'
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
      type: 'logicBranch',
      label: 'Branch (If/Else)',
      description: 'Splits the execution path based on a boolean condition.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Branch',
          headerColor: '#3F51B5',
          category: 'Logic & Compare'
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Switch',
          headerColor: '#3F51B5',
          category: 'Logic & Compare'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'onCase0', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onCase1', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onDefault', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            value: ''
          },
          dataType: 'string',
          cases: ['right', 'left'],
          code: 
`const rawValue = inputs.value;
const cases = node.data.cases;
const matchIndex = cases.indexOf(rawValue);

if (matchIndex !== -1) {
  outputs[\`onCase\${matchIndex}\`] = true;
} else {
  outputs.onDefault = true;
}
return;`
        }
      }
    }
  ]
};
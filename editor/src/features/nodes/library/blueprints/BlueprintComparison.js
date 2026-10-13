import { Scale } from 'lucide-vue-next';

export const BlueprintComparison = {
  id: 'comparison',
  label: 'Logic & Compare',
  color: '#3F51B5',
  icon: Scale,
  items: [
    {
      type: 'logic_compare',
      label: 'Compare',
      description: 'Compares two values (A vs B).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Compare',
          headerColor: '#3F51B5',
          category: 'Logic & Compare'
        },
        inputs: [
          { id: 'a', label: 'A', dataType: 'any', color: '#B0BEC5' },
          { id: 'b', label: 'B', dataType: 'any', color: '#B0BEC5' },
          { id: 'compare', label: 'Compare', dataType: 'string', color: '#F48FB1', defaultValue: 'equal' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'boolean', color: '#E57373' }
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
`const a = inputs['A'] ?? inputs['a'];
const b = inputs['B'] ?? inputs['b'];
const op = inputs['Compare'] ?? inputs['compare'] ?? node.data?.values?.compare ?? 'equal';

const valA = isNaN(Number(a)) || a === '' || a === null ? a : Number(a);
const valB = isNaN(Number(b)) || b === '' || b === null ? b : Number(b);

let res = false;
switch (op) {
  case 'equal': res = (valA == valB); break;
  case 'not_equal': res = (valA != valB); break;
  case 'greater': res = (valA > valB); break;
  case 'less': res = (valA < valB); break;
  case 'greater_equal': res = (valA >= valB); break;
  case 'less_equal': res = (valA <= valB); break;
  default: res = false;
}

outputs['Result'] = res;
outputs['res'] = res;
return;`
        }
      }
    },
    {
      type: 'logic_branch',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'cond_0', label: 'If Condition', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'out_0', label: 'If True', dataType: 'execution', color: '#FFFFFF' },
          { id: 'out_false', label: 'False', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          branches: [],
          code: 
`const branches = node.data?.branches || [];
const cond0 = inputs['If Condition'] ?? inputs['cond_0'];

if (Boolean(cond0)) {
  outputs['If True'] = true;
  outputs['out_0'] = true;
  return;
}

for (let i = 0; i < branches.length; i++) {
  const bType = branches[i];
  if (bType === 'else_if') {
    const condVal = inputs[\`cond_\${i + 1}\`];
    if (Boolean(condVal)) {
      outputs[\`out_\${i + 1}\`] = true;
      return;
    }
  } else if (bType === 'else') {
    outputs['out_else'] = true;
    return;
  }
}

outputs['False'] = true;
outputs['out_false'] = true;
return;`
        }
      }
    },
    {
      type: 'logic_switch',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', label: 'Value', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'out_case_0', label: 'Case "right"', dataType: 'execution', color: '#FFFFFF' },
          { id: 'out_case_1', label: 'Case "left"', dataType: 'execution', color: '#FFFFFF' },
          { id: 'out_default', label: 'Default', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          dataType: 'string',
          cases: ['right', 'left'],
          code: 
`const rawValue = inputs['Value'] ?? inputs['value'] ?? node.data?.values?.value;
const cases = node.data?.cases || [];
const dataType = node.data?.dataType || 'string';

let matchIndex = -1;

if (dataType === 'boolean') {
  const isTrue = (typeof rawValue === 'boolean') 
    ? rawValue 
    : String(rawValue || '').toLowerCase().trim() === 'true';

  matchIndex = cases.findIndex(c => {
    const cTrue = (typeof c === 'boolean') ? c : String(c).toLowerCase().trim() === 'true';
    return cTrue === isTrue;
  });
} else if (dataType === 'number') {
  const checkNum = Number(rawValue);
  matchIndex = cases.findIndex(c => Number(c) === checkNum);
} else {
  const checkStr = String(rawValue ?? '').trim();
  matchIndex = cases.findIndex(c => String(c).trim() === checkStr);
}

if (matchIndex !== -1) {
  outputs[\`out_case_\${matchIndex}\`] = true;
} else {
  outputs['Default'] = true;
  outputs['out_default'] = true;
}
return;`
        }
      }
    }
  ]
};
import { 
  Scale, 
  ArrowRightLeft, 
  GitBranch, 
  GitPullRequest
} from 'lucide-vue-next';

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
      icon: ArrowRightLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Compare', headerColor: '#3F51B5', category: 'Logic' },
        data: { op: 'equal', values: { a: 0, b: 0 } }, 
        inputs: [
          { id: 'a', label: 'A', dataType: 'any', color: '#ffffff' },
          { id: 'b', label: 'B', dataType: 'any', color: '#ffffff' }
        ], 
        outputs: [
          { id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ],
        data: {
          op: 'equal',
          values: { a: 0, b: 0 },
          code: `const a = inputs['A'];
const b = inputs['B'];
const op = node.data?.op || 'equal';

const valA = isNaN(Number(a)) || a === "" ? a : Number(a);
const valB = isNaN(Number(b)) || b === "" ? b : Number(b);

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
return;`
        }
      } 
    },
    { 
      type: 'logic_branch', 
      label: 'Branch (If/Else)', 
      description: 'Splits the execution path based on a boolean condition.',
      icon: GitBranch,
      allowDynamicInputs: true,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#3F51B5', category: 'Logic' },
        data: { branches: [] }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'cond_0', label: 'If Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { id: 'out_0', label: 'If True', dataType: 'execution', color: '#4CAF50' },
          { id: 'out_false', label: 'False', dataType: 'execution', color: '#F44336' }
        ],
        data: {
          branches: [],
          code: `const branches = node.data?.branches || [];

if (Boolean(inputs['If Condition'])) {
  outputs['If True'] = true;
  return;
}

for (let i = 0; i < branches.length; i++) {
  const bType = branches[i];
  if (bType === 'else_if') {
    const portLabel = \`Else If Condition \${i + 1}\`;
    const condVal = inputs[portLabel] ?? inputs[\`cond_\${i + 1}\`];
    if (Boolean(condVal)) {
      const outLabel = \`Else If \${i + 1}\`;
      outputs[outLabel] = true;
      return;
    }
  } else if (bType === 'else') {
    outputs['Else'] = true;
    return;
  }
}

outputs['False'] = true;
return;`
        }
      } 
    },
    { 
      type: 'logic_switch', 
      label: 'Switch', 
      description: 'Directs execution to a specific path based on the data type and its value.',
      icon: GitPullRequest, 
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Switch', headerColor: '#3F51B5', category: 'Logic' },
        data: { dataType: 'string', cases: ['right', 'left'] }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'value', label: 'Value', dataType: 'string', color: '#03A9F4' } 
        ], 
        outputs: [
          { id: 'out_case_0', label: 'Case "right"', dataType: 'execution', color: '#FFB300' },
          { id: 'out_case_1', label: 'Case "left"', dataType: 'execution', color: '#FFB300' },
          { id: 'out_default', label: 'Default', dataType: 'execution', color: '#9E9E9E' }
        ],
        data: {
          dataType: 'string',
          cases: ['right', 'left'],
          code: `const rawValue = inputs['Value'] ?? node.data?.value;
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
  const caseVal = cases[matchIndex];
  const portLabel = \`Case "\${caseVal}"\`;
  outputs[portLabel] = true;
} else {
  outputs['Default'] = true;
}
return;`
        }
      } 
    }
  ]
};
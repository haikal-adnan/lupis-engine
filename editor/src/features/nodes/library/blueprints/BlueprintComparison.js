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
    /**
     * =========================================================================
     * 1. LOGIC: COMPARE (Relational Operator Evaluator)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Hubungkan data yang ingin dibandingkan ke port 'A' dan port 'B'.
     * - Pilih operator pembanding dari opsi dropdown pada Inspector.
     * - Ambil nilai hasil evaluasi boolean pada port output 'Result'.
     */
{ 
  type: 'logic_compare', 
  label: 'Compare', 
  description: 'Compares two values (A vs B).', 
  icon: ArrowRightLeft,
  allowDynamicInputs: false,
  allowDynamicOutputs: false,
  defaultData: { 
    settings: { headerTitle: 'Compare', headerColor: '#3F51B5', category: 'Logic' },
    inputs: [
      { id: 'a', label: 'A', dataType: 'any', color: '#ffffff' },
      { id: 'b', label: 'B', dataType: 'any', color: '#ffffff' },
      { id: 'compare', label: 'Compare', dataType: 'string', color: '#FFEB3B', defaultValue: 'equal' }
    ], 
    outputs: [
      { id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
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
      code: `const a = inputs.a;
const b = inputs.b;
const op = inputs.compare || node.data?.values?.compare || node.data?.compare || 'equal';

const valA = isNaN(Number(a)) || a === "" || a === null ? a : Number(a);
const valB = isNaN(Number(b)) || b === "" || b === null ? b : Number(b);

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

outputs.res = res;
return;`
    }
  } 
},

    /**
     * =========================================================================
     * 2. LOGIC: BRANCH (If / Else Flow Control)
     * =========================================================================
     */
    { 
      type: 'logic_branch', 
      label: 'Branch (If/Else)', 
      description: 'Splits the execution path based on a boolean condition.',
      icon: GitBranch,
      allowDynamicInputs: true,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#3F51B5', category: 'Logic' },
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
const cond0 = inputs.cond_0;

if (Boolean(cond0)) {
  outputs.out_0 = true;
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
    outputs.out_else = true;
    return;
  }
}

outputs.out_false = true;
return;`
        }
      } 
    },

    /**
     * =========================================================================
     * 3. LOGIC: SWITCH (Multi-Value Execution Router)
     * =========================================================================
     */
    { 
      type: 'logic_switch', 
      label: 'Switch', 
      description: 'Directs execution to a specific path based on the data type and its value.',
      icon: GitPullRequest, 
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Switch', headerColor: '#3F51B5', category: 'Logic' },
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
          code: `const rawValue = inputs.value ?? node.data?.value;
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
  outputs.out_default = true;
}
return;` 
        }
      } 
    }
  ]
};
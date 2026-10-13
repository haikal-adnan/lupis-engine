import { ShieldCheck } from 'lucide-vue-next';

export const BlueprintBoolean = {
  id: 'boolean_logic',
  label: 'Boolean Logic',
  color: '#E57373',
  icon: ShieldCheck,
  items: [
    {
      type: 'logic_and',
      label: 'And',
      description: 'True if all dynamic inputs are true.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: { headerTitle: 'And', headerColor: '#E57373', category: 'Boolean Logic' },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'v1', label: 'Val 2', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'result', label: 'Result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            v0: false,
            v1: false
          },
          code: 
`const values = Object.values(inputs).map(Boolean);
outputs['Result'] = values.length > 0 ? values.every(Boolean) : false;
outputs['result'] = outputs['Result'];
return;`
        }
      }
    },
    {
      type: 'logic_or',
      label: 'Or',
      description: 'True if at least one input is true.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: { headerTitle: 'Or', headerColor: '#E57373', category: 'Boolean Logic' },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'boolean', color: '#E57373', defaultValue: false },
          { id: 'v1', label: 'Val 2', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'result', label: 'Result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            v0: false,
            v1: false
          },
          code: 
`const values = Object.values(inputs).map(Boolean);
outputs['Result'] = values.some(Boolean);
outputs['result'] = outputs['Result'];
return;`
        }
      }
    },
    {
      type: 'logic_not',
      label: 'Not',
      description: 'Inverts the boolean value.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Not', headerColor: '#E57373', category: 'Boolean Logic' },
        inputs: [
          { id: 'in_val', label: 'In', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'result', label: 'Out', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            in_val: false
          },
          code: 
`const inVal = Boolean(inputs['In'] ?? inputs['in_val']);
outputs['Out'] = !inVal;
outputs['result'] = !inVal;
return;`
        }
      }
    }
  ]
};
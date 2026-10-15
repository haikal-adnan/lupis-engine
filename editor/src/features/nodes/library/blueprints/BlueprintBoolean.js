import { ShieldCheck } from 'lucide-vue-next';

export const BlueprintBoolean = {
  id: 'boolean_logic',
  label: 'Boolean Logic',
  color: '#E57373',
  icon: ShieldCheck,
  items: [
    {
      type: 'logicAnd',
      label: 'And',
      description: 'True if all dynamic inputs are true.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: { headerTitle: 'And', headerColor: '#E57373', category: 'Boolean Logic' },
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
        settings: { headerTitle: 'Or', headerColor: '#E57373', category: 'Boolean Logic' },
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
        settings: { headerTitle: 'Not', headerColor: '#E57373', category: 'Boolean Logic' },
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
    }
  ]
};